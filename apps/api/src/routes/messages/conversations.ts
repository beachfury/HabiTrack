// apps/api/src/routes/messages/conversations.ts
// Conversation management API endpoints

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import {
  getUser,
  success,
  notFound,
  serverError,
  validationError,
} from '../../utils';
import { LIMITS } from '../../utils/constants';
import { createLogger } from '../../services/logger';

const log = createLogger('messages');

// =============================================================================
// API ENDPOINTS
// =============================================================================

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
  const { limit = String(LIMITS.MESSAGE_HISTORY), before } = req.query;

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
