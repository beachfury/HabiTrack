// apps/api/src/routes/messages/notifications.ts
// Notification/message routes

import type { Request, Response } from 'express';
import { q } from '../../db';
import { getUser, success, serverError, notFound, validationError } from '../../utils';

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  relatedId: number | null;
  relatedType: string | null;
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
}

interface CreateNotificationParams {
  userId: number;
  type: string;
  title: string;
  body?: string;
  link?: string;
  relatedId?: number;
  relatedType?: string;
}

/**
 * Create a notification (internal use)
 */
export async function createNotification(params: CreateNotificationParams): Promise<number> {
  const result: any = await q(
    `INSERT INTO notifications (userId, type, title, body, link, relatedId, relatedType)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      params.userId,
      params.type,
      params.title,
      params.body || null,
      params.link || null,
      params.relatedId || null,
      params.relatedType || null,
    ],
  );
  return result.insertId;
}

/**
 * GET /api/messages
 * Get notifications for current user
 */
export async function getMessages(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { type, unreadOnly, limit = '50' } = req.query;

  try {
    let whereClause = 'WHERE userId = ?';
    const params: any[] = [user.id];

    if (unreadOnly === 'true') {
      whereClause += ' AND `read` = 0';
    }
    if (type && typeof type === 'string') {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    const messages = await q<Notification[]>(
      `SELECT id, userId, type, title, body, link, relatedId, relatedType, \`read\`, readAt, createdAt
       FROM notifications
       ${whereClause}
       ORDER BY createdAt DESC
       LIMIT ?`,
      [...params, parseInt(limit as string)],
    );

    // Get unread count
    const [countResult] = await q<Array<{ count: number }>>(
      `SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND \`read\` = 0`,
      [user.id],
    );

    return success(res, {
      messages: messages.map((m) => ({
        id: m.id,
        type: m.type,
        title: m.title,
        body: m.body,
        link: m.link,
        relatedId: m.relatedId,
        relatedType: m.relatedType,
        isRead: Boolean(m.read),
        readAt: m.readAt,
        createdAt: m.createdAt,
      })),
      unreadCount: countResult?.count || 0,
    });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * GET /api/messages/unread-count
 * Get count of unread notifications
 */
export async function getUnreadCount(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  try {
    const [result] = await q<Array<{ count: number }>>(
      `SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND \`read\` = 0`,
      [user.id],
    );
    // FIXED: Return 'unreadCount' to match what frontend Layout.tsx expects
    return success(res, { unreadCount: result?.count || 0 });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/messages/:id/read
 * Mark a notification as read
 */
export async function markAsRead(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const messageId = parseInt(req.params.id);

  try {
    await q(`UPDATE notifications SET \`read\` = 1, readAt = NOW() WHERE id = ? AND userId = ?`, [
      messageId,
      user.id,
    ]);
    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/messages/read-all
 * Mark all notifications as read
 */
export async function markAllAsRead(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  try {
    await q(
      `UPDATE notifications SET \`read\` = 1, readAt = NOW() WHERE userId = ? AND \`read\` = 0`,
      [user.id],
    );
    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * DELETE /api/messages/:id
 * Delete a single notification
 */
export async function deleteMessage(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const messageId = parseInt(req.params.id);

  if (isNaN(messageId)) {
    return validationError(res, 'Invalid message ID');
  }

  try {
    const result: any = await q(`DELETE FROM notifications WHERE id = ? AND userId = ?`, [
      messageId,
      user.id,
    ]);

    if (result.affectedRows === 0) {
      return notFound(res, 'Message not found');
    }

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * DELETE /api/messages
 * Delete all read notifications
 */
export async function deleteAllRead(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  try {
    const result: any = await q(`DELETE FROM notifications WHERE userId = ? AND \`read\` = 1`, [
      user.id,
    ]);

    return success(res, { deleted: result.affectedRows || 0 });
  } catch (err) {
    return serverError(res, err as Error);
  }
}
