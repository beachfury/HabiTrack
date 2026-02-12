// apps/api/src/routes/messages/announcements.ts
// Announcement API endpoints (Admin -> All Users)

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import {
  getUser,
  success,
  forbidden,
  serverError,
  validationError,
  created,
} from '../../utils';
import { createNotification } from './notifications';
import { queueEmail, getActiveUsersWithEmail } from '../../email/queue';
import { LIMITS } from '../../utils/constants';
import { createLogger } from '../../services/logger';

const log = createLogger('messages');

// =============================================================================
// TYPES
// =============================================================================

export interface CreateAnnouncementParams {
  fromUserId: number;
  title: string;
  body: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  expiresAt?: string | null;
  link?: string;
}

// =============================================================================
// INTERNAL FUNCTIONS
// =============================================================================

/**
 * Create an announcement programmatically (for internal use by other modules)
 */
export async function createAnnouncementInternal(params: CreateAnnouncementParams): Promise<number> {
  const { fromUserId, title, body, priority = 'normal', expiresAt = null, link } = params;

  const result: any = await q(
    `INSERT INTO messages (fromUserId, userId, type, isAnnouncement, title, body, priority, expiresAt)
     VALUES (?, ?, 'system', 1, ?, ?, ?, ?)`,
    [fromUserId, fromUserId, title, body, priority, expiresAt],
  );

  const announcementId = result.insertId;

  // Get sender name for emails
  const [sender] = await q<Array<{ displayName: string }>>(
    'SELECT displayName FROM users WHERE id = ?',
    [fromUserId],
  );
  const fromName = sender?.displayName || 'Admin';

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

  // Send email notifications to all active users with email (except sender)
  const activeUsers = await getActiveUsersWithEmail();
  for (const recipient of activeUsers) {
    if (recipient.id !== fromUserId) {
      await queueEmail({
        userId: recipient.id,
        toEmail: recipient.email,
        template: 'ANNOUNCEMENT',
        variables: {
          userName: recipient.displayName,
          title,
          body: body.substring(0, 500),
          fromName,
        },
      });
    }
  }

  return announcementId;
}

// =============================================================================
// API ENDPOINTS
// =============================================================================

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

    // Send email notifications to all active users with email (except sender)
    const activeUsers = await getActiveUsersWithEmail();
    for (const recipient of activeUsers) {
      if (recipient.id !== user.id) {
        await queueEmail({
          userId: recipient.id,
          toEmail: recipient.email,
          template: 'ANNOUNCEMENT',
          variables: {
            userName: recipient.displayName,
            title,
            body: body.substring(0, 500),
            fromName: user.displayName || 'Admin',
          },
        });
      }
    }

    log.info('Announcement created', { announcementId, title, recipientCount: users.length, createdBy: user.id });

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
       LIMIT ?`,
      [user.id, ...params, LIMITS.ANNOUNCEMENTS],
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
 * Also cleans up announcement_reads + related notifications
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

    log.info('Announcement deleted', { announcementId, deletedBy: user.id });

    await logAudit({
      action: 'message.announcement.delete',
      result: 'ok',
      actorId: user.id,
      details: { announcementId, deleted: result?.affectedRows || 0 },
    });

    return success(res, { success: true });
  } catch (err) {
    log.error('Failed to delete announcement', { announcementId, error: String(err) });
    return serverError(res, err as Error);
  }
}
