// apps/api/src/routes/messages/direct.ts
// Direct messaging and announcements API

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

// =============================================================================
// ANNOUNCEMENTS (Admin -> All Users)
// =============================================================================

/**
 * Create an announcement programmatically (for internal use by other modules)
 */
export interface CreateAnnouncementParams {
  fromUserId: number;
  title: string;
  body: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  expiresAt?: string | null;
  link?: string;
}

export async function createAnnouncementInternal(params: CreateAnnouncementParams): Promise<number> {
  const { fromUserId, title, body, priority = 'normal', expiresAt = null, link } = params;

  const result: any = await q(
    `INSERT INTO messages (fromUserId, userId, type, isAnnouncement, title, body, priority, expiresAt)
     VALUES (?, ?, 'system', 1, ?, ?, ?, ?)`,
    [fromUserId, fromUserId, title, body, priority, expiresAt],
  );

  const announcementId = result.insertId;

  // Create notifications for all active users (except the sender)
  const users = await q<Array<{ id: number }>>(
    `SELECT id FROM users WHERE active = 1 AND id != ?`,
    [fromUserId],
  );

  for (const u of users) {
    await createNotification({
      userId: u.id,
      type: 'system',
      title: `📢 ${title}`,
      body: body.substring(0, 100) + (body.length > 100 ? '...' : ''),
      link: link || '/messages?tab=announcements',
      relatedId: announcementId,
      relatedType: 'announcement',
    });
  }

  return announcementId;
}

/**
 * POST /api/messages/announcements
 * Create an announcement (admin only)
 */
export async function createAnnouncement(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  if (user.roleId !== 'admin') {
    return forbidden(res, 'Only admins can create announcements');
  }

  const { title, body, priority = 'normal', expiresAt } = req.body;

  if (!title || !body) {
    return validationError(res, 'Title and body are required');
  }

  try {
    const result: any = await q(
      `INSERT INTO messages (fromUserId, userId, type, isAnnouncement, title, body, priority, expiresAt)
       VALUES (?, ?, 'system', 1, ?, ?, ?, ?)`,
      [user.id, user.id, title, body, priority, expiresAt || null],
    );

    const announcementId = result.insertId;

    // Create notifications for all active users
    const users = await q<Array<{ id: number }>>(
      `SELECT id FROM users WHERE active = 1 AND id != ?`,
      [user.id],
    );

    for (const u of users) {
      await createNotification({
        userId: u.id,
        type: 'system',
        title: `📢 ${title}`,
        body: body.substring(0, 100) + (body.length > 100 ? '...' : ''),
        link: '/messages?tab=announcements',
        relatedId: announcementId,
        relatedType: 'announcement',
      });
    }

    await logAudit({
      action: 'message.announcement.create',
      result: 'ok',
      actorId: user.id,
      details: { announcementId, title, recipientCount: users.length },
    });

    return created(res, {
      announcement: {
        id: announcementId,
        title,
        body,
        priority,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * GET /api/messages/announcements
 * Get all announcements
 */
export async function getAnnouncements(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { includeExpired } = req.query;

  try {
    let whereClause = 'WHERE m.isAnnouncement = 1';
    const params: any[] = [];

    if (includeExpired !== 'true') {
      whereClause += ' AND (m.expiresAt IS NULL OR m.expiresAt > NOW())';
    }

    const announcements = await q<any[]>(
      `SELECT
        m.id, m.title, m.body, m.priority, m.createdAt, m.expiresAt,
        u.id as fromUserId, u.displayName as fromUserName, u.avatarUrl as fromUserAvatar,
        (SELECT COUNT(*) FROM announcement_reads ar WHERE ar.messageId = m.id) as readCount,
        (SELECT COUNT(*) FROM users WHERE active = 1) as totalUsers,
        EXISTS(SELECT 1 FROM announcement_reads ar WHERE ar.messageId = m.id AND ar.userId = ?) as isRead
       FROM messages m
       LEFT JOIN users u ON m.fromUserId = u.id
       ${whereClause}
       ORDER BY m.priority = 'urgent' DESC, m.priority = 'high' DESC, m.createdAt DESC
       LIMIT 50`,
      [user.id, ...params],
    );

    return success(res, {
      announcements: announcements.map((a) => ({
        ...a,
        isRead: Boolean(a.isRead),
      })),
    });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/messages/announcements/:id/read
 * Mark an announcement as read
 */
export async function markAnnouncementRead(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const announcementId = parseInt(req.params.id, 10);

  try {
    await q(`INSERT IGNORE INTO announcement_reads (messageId, userId) VALUES (?, ?)`, [
      announcementId,
      user.id,
    ]);

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * DELETE /api/messages/announcements/:id
 * Delete an announcement (admin only)
 *
 * UPDATED: also clean up announcement_reads + related notifications
 */
export async function deleteAnnouncement(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  if (user.roleId !== 'admin') {
    return forbidden(res, 'Only admins can delete announcements');
  }

  const announcementId = parseInt(req.params.id, 10);

  try {
    // Remove notifications created for this announcement
    await q(`DELETE FROM notifications WHERE relatedType = 'announcement' AND relatedId = ?`, [
      announcementId,
    ]);

    // Remove read-tracking rows
    await q(`DELETE FROM announcement_reads WHERE messageId = ?`, [announcementId]);

    // Remove the announcement itself
    const result: any = await q(`DELETE FROM messages WHERE id = ? AND isAnnouncement = 1`, [
      announcementId,
    ]);

    await logAudit({
      action: 'message.announcement.delete',
      result: 'ok',
      actorId: user.id,
      details: { announcementId, deleted: result?.affectedRows || 0 },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

// =============================================================================
// DIRECT MESSAGES (User -> User)
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

// =============================================================================
// DELETION (Hard delete to keep DB clean)
// =============================================================================

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

    // Optional: keep conversation row accurate (update preview or delete if empty)
    // Determine other participant
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

    await logAudit({
      action: 'message.direct.delete',
      result: 'ok',
      actorId: user.id,
      details: { messageId, deleted: result?.affectedRows || 0 },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * DELETE /api/messages/conversations/:userId
 * Delete an entire conversation (all messages between users)
 */
export async function deleteConversation(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const otherUserId = parseInt(req.params.userId, 10);
  if (!otherUserId || otherUserId === user.id) {
    return validationError(res, 'Invalid user');
  }

  try {
    const [u1, u2] = user.id < otherUserId ? [user.id, otherUserId] : [otherUserId, user.id];

    // Find message ids in this conversation (so we can delete related notifications too)
    const ids = await q<Array<{ id: number }>>(
      `SELECT id FROM messages
       WHERE isAnnouncement = 0
         AND ((fromUserId = ? AND toUserId = ?) OR (fromUserId = ? AND toUserId = ?))`,
      [user.id, otherUserId, otherUserId, user.id],
    );

    const messageIds = ids.map((r) => r.id);

    if (messageIds.length) {
      await q(
        `DELETE FROM notifications
         WHERE relatedType = 'direct_message'
           AND relatedId IN (${messageIds.map(() => '?').join(',')})`,
        messageIds,
      );
    }

    const result: any = await q(
      `DELETE FROM messages
       WHERE isAnnouncement = 0
         AND ((fromUserId = ? AND toUserId = ?) OR (fromUserId = ? AND toUserId = ?))`,
      [user.id, otherUserId, otherUserId, user.id],
    );

    await q(`DELETE FROM conversations WHERE user1Id = ? AND user2Id = ?`, [u1, u2]);

    await logAudit({
      action: 'message.conversation.delete',
      result: 'ok',
      actorId: user.id,
      details: { otherUserId, deleted: result?.affectedRows || 0 },
    });

    return success(res, { success: true, deleted: result?.affectedRows || 0 });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * GET /api/messages/conversations
 * Get list of conversations for current user
 */
export async function getConversations(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  try {
    const conversations = await q<any[]>(
      `SELECT
        c.id,
        c.lastMessageAt,
        c.lastMessagePreview,
        CASE WHEN c.user1Id = ? THEN c.user2Id ELSE c.user1Id END as otherUserId,
        u.displayName as otherUserName,
        u.avatarUrl as otherUserAvatar,
        u.color as otherUserColor,
        (SELECT COUNT(*) FROM messages m
         WHERE m.toUserId = ?
         AND m.fromUserId = CASE WHEN c.user1Id = ? THEN c.user2Id ELSE c.user1Id END
         AND m.readAt IS NULL) as unreadCount
       FROM conversations c
       JOIN users u ON u.id = CASE WHEN c.user1Id = ? THEN c.user2Id ELSE c.user1Id END
       WHERE c.user1Id = ? OR c.user2Id = ?
       ORDER BY c.lastMessageAt DESC`,
      [user.id, user.id, user.id, user.id, user.id, user.id],
    );

    return success(res, { conversations });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * GET /api/messages/conversations/:userId
 * Get messages in a conversation with a specific user
 */
export async function getConversation(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const otherUserId = parseInt(req.params.userId, 10);
  const { limit = '50', before } = req.query;

  try {
    // Get other user info
    const [otherUser] = await q<
      Array<{ id: number; displayName: string; avatarUrl: string | null; color: string | null }>
    >(`SELECT id, displayName, avatarUrl, color FROM users WHERE id = ?`, [otherUserId]);

    if (!otherUser) {
      return notFound(res, 'User not found');
    }

    let whereClause = `WHERE ((m.fromUserId = ? AND m.toUserId = ?) OR (m.fromUserId = ? AND m.toUserId = ?))
                       AND m.isAnnouncement = 0`;
    const params: any[] = [user.id, otherUserId, otherUserId, user.id];

    if (before) {
      whereClause += ' AND m.createdAt < ?';
      params.push(before);
    }

    const messages = await q<any[]>(
      `SELECT
        m.id, m.fromUserId, m.toUserId, m.title, m.body, m.createdAt, m.readAt,
        u.displayName as fromUserName, u.avatarUrl as fromUserAvatar
       FROM messages m
       LEFT JOIN users u ON m.fromUserId = u.id
       ${whereClause}
       ORDER BY m.createdAt DESC
       LIMIT ?`,
      [...params, parseInt(limit as string, 10)],
    );

    // Mark messages as read
    await q(
      `UPDATE messages SET readAt = NOW()
       WHERE toUserId = ? AND fromUserId = ? AND readAt IS NULL`,
      [user.id, otherUserId],
    );

    return success(res, {
      otherUser,
      messages: messages.reverse(), // Return in chronological order
    });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * GET /api/messages/unread-total
 * Get total unread count (notifications + direct messages + announcements)
 */
export async function getUnreadTotal(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  try {
    // Unread notifications
    const [notifCount] = await q<Array<{ count: number }>>(
      `SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND \`read\` = 0`,
      [user.id],
    );

    // Unread direct messages
    const [dmCount] = await q<Array<{ count: number }>>(
      `SELECT COUNT(*) as count FROM messages WHERE toUserId = ? AND readAt IS NULL AND isAnnouncement = 0`,
      [user.id],
    );

    // Unread announcements
    const [announcementCount] = await q<Array<{ count: number }>>(
      `SELECT COUNT(*) as count FROM messages m
       WHERE m.isAnnouncement = 1
       AND (m.expiresAt IS NULL OR m.expiresAt > NOW())
       AND NOT EXISTS (SELECT 1 FROM announcement_reads ar WHERE ar.messageId = m.id AND ar.userId = ?)`,
      [user.id],
    );

    return success(res, {
      notifications: notifCount?.count || 0,
      directMessages: dmCount?.count || 0,
      announcements: announcementCount?.count || 0,
      total: (notifCount?.count || 0) + (dmCount?.count || 0) + (announcementCount?.count || 0),
    });
  } catch (err) {
    return serverError(res, err as Error);
  }
}
