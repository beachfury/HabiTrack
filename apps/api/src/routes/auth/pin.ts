// apps/api/src/routes/auth/pin.ts
// PIN-based authentication for kiosk login

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import { verifyUserKioskPin } from '../../crypto';
import { sessionStore } from '../../session-store';
import { setSessionCookie, SESSION_TTL_MINUTES } from '../../cookie-config';
import { success, serverError, validationError } from '../../utils';

/**
 * GET /api/auth/pin/users
 * Get users with PIN for kiosk selection
 */
export async function getPinUsers(req: Request, res: Response) {
  try {
    const users = await q<
      Array<{
        id: number;
        displayName: string;
        nickname: string | null;
        color: string | null;
        avatarUrl: string | null;
      }>
    >(
      `SELECT u.id, u.displayName, u.nickname, u.color, u.avatarUrl
       FROM users u
       INNER JOIN credentials c ON c.userId = u.id AND c.provider = 'kiosk_pin'
       WHERE u.active = 1 AND u.kioskOnly = 0
       ORDER BY u.displayName`,
    );

    return success(res, { users });
  } catch (err) {
    console.error('[getPinUsers] error', err);
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/auth/pin/login
 * Authenticate via kiosk PIN
 */
export async function postPinLogin(req: Request, res: Response) {
  try {
    const { userId, pin } = req.body as { userId?: number; pin?: string };

    if (!userId || !pin) {
      return validationError(res, 'userId and pin are required');
    }

    // Verify PIN
    const isValid = await verifyUserKioskPin(userId, pin);
    if (!isValid) {
      return res
        .status(401)
        .json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid PIN' } });
    }

    // Get user info
    const [user] = await q<
      Array<{
        id: number;
        displayName: string;
        nickname: string | null;
        roleId: 'admin' | 'member' | 'kid' | 'kiosk';
        color: string | null;
        avatarUrl: string | null;
        active: number;
      }>
    >(
      `SELECT id, displayName, nickname, roleId, color, avatarUrl, active
       FROM users WHERE id = ? AND active = 1`,
      [userId],
    );

    if (!user) {
      return res
        .status(401)
        .json({ error: { code: 'USER_NOT_FOUND', message: 'User not found or inactive' } });
    }

    // Create session
    const sess = await sessionStore.create({
      userId: user.id,
      role: user.roleId,
      ttlMinutes: SESSION_TTL_MINUTES,
    });

    setSessionCookie(res, sess.sid);

    await logAudit({
      action: 'auth.pin_login',
      result: 'ok',
      actorId: user.id,
      ip: req.ip || 'unknown',
      ua: req.get('user-agent') || 'unknown',
      details: { userId: user.id },
    });

    return success(res, {
      success: true,
      user: {
        actorid: user.id,
        displayName: user.displayName,
        nickname: user.nickname,
        role: user.roleId,
        color: user.color,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error('[postPinLogin] error', err);
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/auth/pin/verify
 * Verify PIN without creating session (for confirmation dialogs)
 */
export async function verifyPin(req: Request, res: Response) {
  try {
    const { userId, pin } = req.body as { userId?: number; pin?: string };

    if (!userId || !pin) {
      return validationError(res, 'userId and pin are required');
    }

    const isValid = await verifyUserKioskPin(userId, pin);

    return success(res, { valid: isValid });
  } catch (err) {
    console.error('[verifyPin] error', err);
    return serverError(res, err as Error);
  }
}
