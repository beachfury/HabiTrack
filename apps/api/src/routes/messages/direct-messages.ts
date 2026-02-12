// apps/api/src/routes/messages/direct-messages.ts
// Direct messaging API endpoints (User -> User)

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import {
  getUser,
  success,
  notFound,
  forbidden,
  serverError,
  validationError,
  created,
} from '../../utils';
import { createNotification } from './notifications';
import { queueEmail, getUserEmail } from '../../email/queue';
import { createLogger } from '../../services/logger';

const log = createLogger('messages');

// =============================================================================
// API ENDPOINTS
// =============================================================================

/**
 * POST /api/messages/send
 * Send a direct message to another user
 */
export async function sendDirectMessage(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { toUserId, title, body } = req.body;

  if (!toUserId || !body) {
    return validationError(res, 'Recipient and message body are required');
  }

  if (toUserId === user.id) {
    return validationError(res, 'Cannot send message to yourself');
  }

  try {
    // Verify recipient exists
    const [recipient] = await q<Array<{ id: number; displayName: string }>>(
      `SELECT id, displayName FROM users WHERE id = ? AND active = 1`,
      [toUserId],
    );

    if (!recipient) {
      return notFound(res, 'Recipient not found');
    }

    // Create the message
    const result: any = await q(
      `INSERT INTO messages (fromUserId, toUserId, userId, type, title, body)
       VALUES (?, ?, ?, 'family', ?, ?)`,
      [user.id, toUserId, toUserId, title || 'New message', body],
    );

    const messageId = result.insertId;

    // Update or create conversation
    const [user1, user2] = user.id < toUserId ? [user.id, toUserId] : [toUserId, user.id];

    await q(
      `INSERT INTO conversations (user1Id, user2Id, lastMessageAt, lastMessagePreview)
       VALUES (?, ?, NOW(), ?)
       ON DUPLICATE KEY UPDATE lastMessageAt = NOW(), lastMessagePreview = ?`,
      [user1, user2, body.substring(0, 100), body.substring(0, 100)],
    );

    // Create notification for recipient
    await createNotification({
      userId: toUserId,
      type: 'family',
      title: `Message from ${user.displayName}`,
      body: body.substring(0, 100) + (body.length > 100 ? '...' : ''),
      link: `/messages?conversation=${user.id}`,
      relatedId: messageId,
      relatedType: 'direct_message',
    });

    // Send email notification for new direct message
    const recipientEmail = await getUserEmail(toUserId);
    if (recipientEmail) {
      await queueEmail({
        userId: toUserId,
        toEmail: recipientEmail,
        template: 'NEW_MESSAGE',
        variables: {
          userName: recipient.displayName,
          senderName: user.displayName || 'Someone',
          messagePreview: body.substring(0, 100) + (body.length > 100 ? '...' : ''),
          messageTitle: title || 'New message',
        },
      });
    }

    log.info('Direct message sent', { messageId, fromUserId: user.id, toUserId });

    await logAudit({
      action: 'message.direct.send',
      result: 'ok',
      actorId: user.id,
      details: { messageId, toUserId },
    });

    return created(res, {
      message: {
        id: messageId,
        toUserId,
        toUserName: recipient.displayName,
        body,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * DELETE /api/messages/direct/:id
 * Delete a direct message (sender/recipient or admin)
 */
export async function deleteDirectMessage(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const messageId = parseInt(req.params.id, 10);

  try {
    // Ensure the user is allowed to delete it
    const [msg] = await q<
      Array<{
        id: number;
        fromUserId: number | null;
        toUserId: number | null;
        isAnnouncement: number;
      }>
    >(
      `SELECT id, fromUserId, toUserId, isAnnouncement
       FROM messages
       WHERE id = ?`,
      [messageId],
    );

    if (!msg || msg.isAnnouncement === 1) return notFound(res, 'Message not found');

    const isParticipant = msg.fromUserId === user.id || msg.toUserId === user.id;
    const isAdmin = user.roleId === 'admin';

    if (!isParticipant && !isAdmin) {
      return forbidden(res, 'Not allowed to delete this message');
    }

    // Delete related notification (if any)
    await q(`DELETE FROM notifications WHERE relatedType = 'direct_message' AND relatedId = ?`, [
      messageId,
    ]);

    // Delete the message
    const result: any = await q(`DELETE FROM messages WHERE id = ? AND isAnnouncement = 0`, [
      messageId,
    ]);

    // Update conversation row (update preview or delete if empty)
    const otherUserId = msg.fromUserId === user.id ? msg.toUserId : msg.fromUserId;

    if (otherUserId) {
      const [user1, user2] =
        user.id < otherUserId ? [user.id, otherUserId] : [otherUserId, user.id];

      const [last] = await q<Array<{ createdAt: string; body: string | null }>>(
        `SELECT createdAt, body
         FROM messages
         WHERE isAnnouncement = 0
           AND ((fromUserId = ? AND toUserId = ?) OR (fromUserId = ? AND toUserId = ?))
         ORDER BY createdAt DESC
         LIMIT 1`,
        [user.id, otherUserId, otherUserId, user.id],
      );

      if (last) {
        await q(
          `UPDATE conversations
           SET lastMessageAt = ?, lastMessagePreview = ?
           WHERE user1Id = ? AND user2Id = ?`,
          [last.createdAt, (last.body || '').substring(0, 100), user1, user2],
        );
      } else {
        await q(`DELETE FROM conversations WHERE user1Id = ? AND user2Id = ?`, [user1, user2]);
      }
    }

    log.info('Direct message deleted', { messageId, deletedBy: user.id });

    await logAudit({
      action: 'message.direct.delete',
      result: 'ok',
      actorId: user.id,
      details: { messageId, deleted: result?.affectedRows || 0 },
    });

    return success(res, { success: true });
  } catch (err) {
    log.error('Failed to delete direct message', { messageId, error: String(err) });
    return serverError(res, err as Error);
  }
}
