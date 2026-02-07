// apps/api/src/routes/admin/impersonate.ts
// Admin impersonation routes

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import { sessionStore } from '../../session-store';
import { SESSION_COOKIE_NAME, SESSION_TTL_MINUTES, setSessionCookie } from '../../cookie-config';

// Helper to get user from request
function getUser(req: Request) {
  return (req as any).user as
    | {
        id: number;
        displayName: string;
        roleId: 'admin' | 'member' | 'kid' | 'kiosk';
      }
    | undefined;
}

/**
 * POST /api/admin/impersonate/:userId
 * Start impersonating another user (admin only)
 */
export async function startImpersonation(req: Request, res: Response) {
  const admin = getUser(req);
  if (!admin || admin.roleId !== 'admin') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin only' } });
  }

  const targetUserId = Number(req.params.userId);
  if (!targetUserId || targetUserId === admin.id) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid user ID' } });
  }

  try {
    // Get target user
    const [targetUser] = await q<
      Array<{ id: number; displayName: string; roleId: string; active: number }>
    >('SELECT id, displayName, roleId, active FROM users WHERE id = ?', [targetUserId]);

    if (!targetUser || !targetUser.active) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    // Create new session as target user, but store original admin ID
    const sess = await sessionStore.create({
      userId: targetUserId,
      role: targetUser.roleId as 'admin' | 'member' | 'kid' | 'kiosk',
      ttlMinutes: SESSION_TTL_MINUTES,
      impersonatedBy: admin.id,
    });

    setSessionCookie(res, sess.sid);

    await logAudit({
      action: 'admin.impersonate.start',
      result: 'ok',
      actorId: admin.id,
      details: { targetUserId, targetUserName: targetUser.displayName },
    });

    return res.json({
      success: true,
      impersonating: {
        id: targetUser.id,
        displayName: targetUser.displayName,
        role: targetUser.roleId,
      },
      originalAdmin: {
        id: admin.id,
        displayName: admin.displayName,
      },
    });
  } catch (err) {
    console.error('[startImpersonation] error', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR' } });
  }
}

/**
 * POST /api/admin/impersonate/stop
 * Stop impersonating and return to admin account
 */
export async function stopImpersonation(req: Request, res: Response) {
  const currentSid = req.cookies?.[SESSION_COOKIE_NAME];
  if (!currentSid) {
    return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });
  }

  try {
    const currentSession = await sessionStore.get(currentSid);
    if (!currentSession || !currentSession.impersonatedBy) {
      return res
        .status(400)
        .json({ error: { code: 'NOT_IMPERSONATING', message: 'Not currently impersonating' } });
    }

    const adminId = currentSession.impersonatedBy;

    // Get admin user info
    const [admin] = await q<Array<{ id: number; displayName: string; roleId: string }>>(
      'SELECT id, displayName, roleId FROM users WHERE id = ?',
      [adminId],
    );

    if (!admin) {
      return res
        .status(500)
        .json({ error: { code: 'SERVER_ERROR', message: 'Original admin not found' } });
    }

    // Delete impersonation session
    await sessionStore.destroy(currentSid);

    // Create new session as original admin
    const sess = await sessionStore.create({
      userId: adminId,
      role: admin.roleId as 'admin' | 'member' | 'kid' | 'kiosk',
      ttlMinutes: SESSION_TTL_MINUTES,
    });

    setSessionCookie(res, sess.sid);

    await logAudit({
      action: 'admin.impersonate.stop',
      result: 'ok',
      actorId: adminId,
      details: { wasImpersonating: currentSession.userId },
    });

    return res.json({
      success: true,
      user: {
        id: admin.id,
        displayName: admin.displayName,
        role: admin.roleId,
      },
    });
  } catch (err) {
    console.error('[stopImpersonation] error', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR' } });
  }
}

/**
 * GET /api/admin/impersonate/status
 * Check if currently impersonating
 */
export async function getImpersonationStatus(req: Request, res: Response) {
  const currentSid = req.cookies?.[SESSION_COOKIE_NAME];
  if (!currentSid) {
    return res.json({ impersonating: false });
  }

  try {
    const currentSession = await sessionStore.get(currentSid);
    if (!currentSession || !currentSession.impersonatedBy) {
      return res.json({ impersonating: false });
    }

    // Get original admin info
    const [admin] = await q<Array<{ id: number; displayName: string }>>(
      'SELECT id, displayName FROM users WHERE id = ?',
      [currentSession.impersonatedBy],
    );

    return res.json({
      impersonating: true,
      originalAdmin: admin ? { id: admin.id, displayName: admin.displayName } : null,
    });
  } catch (err) {
    console.error('[getImpersonationStatus] error', err);
    return res.json({ impersonating: false });
  }
}
