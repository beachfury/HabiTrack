// apps/api/src/routes/auth/session.ts
// Session management routes (login, logout, me)

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import { sessionStore } from '../../session-store';
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MINUTES,
  setSessionCookie,
  clearSessionCookie,
} from '../../cookie-config';
import { success, serverError } from '../../utils';
import { createLogger } from '../../services/logger';

const log = createLogger('auth');

/**
 * Get client metadata from request
 */
function clientMeta(req: Request) {
  return {
    ip:
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.socket?.remoteAddress ?? undefined),
    ua: (req.headers['user-agent'] as string | undefined) ?? undefined,
  };
}

/**
 * POST /api/auth/login
 * Legacy/dev login (direct userId)
 */
export async function postLogin(req: Request, res: Response) {
  const { userId } = (req.body ?? {}) as { userId?: number };

  if (!userId) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'userId required' } });
  }

  const rows = await q<Array<{ roleId: 'admin' | 'member' | 'kid' | 'kiosk'; active: 0 | 1 }>>(
    'SELECT roleId, active FROM users WHERE id = ? LIMIT 1',
    [userId],
  );

  const u = rows[0];
  if (!u || !u.active) {
    return res.status(403).json({ error: { code: 'USER_INACTIVE' } });
  }

  const sess = await sessionStore.create({
    userId,
    role: u.roleId,
    ttlMinutes: SESSION_TTL_MINUTES,
  });

  setSessionCookie(res, sess.sid);

  log.info('User logged in (dev mode)', { userId, role: u.roleId });

  await logAudit({
    action: 'auth.login.dev',
    result: 'ok',
    actorId: userId,
    ...clientMeta(req),
  });

  return res.status(204).end();
}

/**
 * POST /api/auth/logout
 * Clear session
 */
export async function postLogout(req: Request, res: Response) {
  const { ip, ua } = clientMeta(req);

  try {
    const sid = (req as any).sessionId;
    const user = (req as any).user;

    clearSessionCookie(res);

    if (sid) {
      await sessionStore.destroy(sid).catch(() => {});
    }

    log.info('User logged out', { userId: user?.id });

    await logAudit({
      action: 'auth.logout',
      result: 'ok',
      actorId: user?.id,
      ip,
      ua,
    });

    return res.status(204).end();
  } catch (e) {
    log.error('Logout failed', { error: String(e) });
    await logAudit({
      action: 'auth.logout',
      result: 'error',
      ip,
      ua,
      details: { error: String(e) },
    });
    return serverError(res, e as Error);
  }
}

/**
 * GET /api/me
 * Get current user info
 */
export async function getMe(req: Request, res: Response) {
  const u = (req as any).user;

  if (!u) {
    return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });
  }

  // Check if this is a kiosk session
  const isKioskSession = !!(req as any).isKioskSession;

  // Get full user details
  const [user] = await q<
    Array<{
      id: number;
      displayName: string;
      nickname: string | null;
      email: string | null;
      roleId: string;
      color: string | null;
      avatarUrl: string | null;
      theme: string | null;
      accentColor: string | null;
    }>
  >(
    `SELECT id, displayName, nickname, email, roleId, color, avatarUrl, theme, accentColor
     FROM users WHERE id = ?`,
    [u.id],
  );

  return success(res, {
    user: {
      id: user.id,
      displayName: user.displayName,
      nickname: user.nickname,
      email: user.email,
      role: user.roleId,
      color: user.color,
      avatarUrl: user.avatarUrl,
      theme: user.theme,
      accentColor: user.accentColor,
      isKiosk: isKioskSession,
    },
  });
}

/**
 * GET /api/auth/session
 * Check if session is valid
 */
export async function checkSession(req: Request, res: Response) {
  const sid = req.cookies?.[SESSION_COOKIE_NAME];

  if (!sid) {
    return res.status(401).json({ valid: false });
  }

  const sess = await sessionStore.get(sid);

  if (!sess) {
    return res.status(401).json({ valid: false });
  }

  return success(res, {
    valid: true,
    userId: sess.userId,
    role: sess.role,
    expiresAt: sess.expiresAt,
  });
}
