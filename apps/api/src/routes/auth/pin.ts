// apps/api/src/routes/auth/pin.ts
// PIN-based authentication for kiosk login
// SECURITY: Kiosk mode is restricted to local network only

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import { verifyUserKioskPin } from '../../crypto';
import { sessionStore } from '../../session-store';
import { setSessionCookie } from '../../cookie-config';
import { success, serverError, validationError } from '../../utils';
import { isLocalNetwork } from '../../middleware/kiosk-local-only';
import { checkLockout, recordLoginAttempt, AccountLockedError } from '../../lockout';

/**
 * SECURITY: Kiosk sessions have shorter TTL than regular sessions
 * This limits the damage if a kiosk device is compromised
 */
const KIOSK_SESSION_TTL_MINUTES = 4 * 60; // 4 hours (vs 30 days for regular)

/**
 * Get the client IP address for security logging
 */
function getClientIP(req: Request): string {
  const directIP = req.socket?.remoteAddress || req.ip || '';
  const normalizedDirect = directIP.toLowerCase().split('%')[0];

  // Only trust X-Forwarded-For from localhost
  const isFromLocalhost = /^(127\.|::1$|::ffff:127\.)/.test(normalizedDirect);
  if (isFromLocalhost) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const firstIP = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
      return firstIP.toLowerCase().split('%')[0];
    }
  }
  return normalizedDirect;
}

/**
 * Log kiosk login attempt to dedicated audit table
 */
async function logKioskAudit(
  userId: number | null,
  success: boolean,
  ip: string,
  userAgent: string | null,
  failureReason?: string,
) {
  try {
    await q(
      `INSERT INTO kiosk_login_audit (userId, success, ip, userAgent, failureReason)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, success ? 1 : 0, ip, userAgent, failureReason ?? null],
    );
  } catch (err) {
    console.error('[kiosk-audit] Failed to log:', err);
  }
}

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
 *
 * SECURITY:
 * - Only accepts connections from local network
 * - Creates kiosk-flagged session with shorter TTL
 * - Logs all attempts to kiosk_login_audit table
 */
export async function postPinLogin(req: Request, res: Response) {
  const clientIP = getClientIP(req);
  const userAgent = req.get('user-agent') || null;

  try {
    const { userId, pin } = req.body as { userId?: number; pin?: string };

    // SECURITY: Verify this is a local network request
    // This is defense-in-depth (middleware should have already blocked)
    if (!isLocalNetwork(clientIP)) {
      console.warn(`[postPinLogin] SECURITY: Non-local IP ${clientIP} bypassed middleware`);
      await logKioskAudit(userId ?? null, false, clientIP, userAgent, 'NON_LOCAL_IP');
      return res.status(403).json({
        error: { code: 'KIOSK_LOCAL_ONLY', message: 'Kiosk mode is only available on local network' },
      });
    }

    if (!userId || !pin) {
      await logKioskAudit(null, false, clientIP, userAgent, 'MISSING_PARAMS');
      return validationError(res, 'userId and pin are required');
    }

    // SECURITY: Check for account lockout (brute force protection)
    const lockoutStatus = await checkLockout(userId);
    if (lockoutStatus.isLocked) {
      await logKioskAudit(userId, false, clientIP, userAgent, 'ACCOUNT_LOCKED');
      const remainingMinutes = lockoutStatus.lockoutExpiresAt
        ? Math.ceil((lockoutStatus.lockoutExpiresAt.getTime() - Date.now()) / 60000)
        : 15;
      return res.status(423).json({
        error: {
          code: 'ACCOUNT_LOCKED',
          message: `Too many failed attempts. Try again in ${remainingMinutes} minutes.`,
          remainingMinutes,
        },
      });
    }

    // Verify PIN
    const isValid = await verifyUserKioskPin(userId, pin);
    if (!isValid) {
      // Record failed attempt for lockout tracking
      await recordLoginAttempt(userId, false, clientIP);
      await logKioskAudit(userId, false, clientIP, userAgent, 'INVALID_PIN');

      // Check remaining attempts and include in response
      const newStatus = await checkLockout(userId);
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid PIN',
          remainingAttempts: newStatus.remainingAttempts,
        },
      });
    }

    // Record successful login (clears failed attempts)
    await recordLoginAttempt(userId, true, clientIP);

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
      await logKioskAudit(userId, false, clientIP, userAgent, 'USER_NOT_FOUND');
      return res
        .status(401)
        .json({ error: { code: 'USER_NOT_FOUND', message: 'User not found or inactive' } });
    }

    // Create KIOSK session with shorter TTL and kiosk flag
    const sess = await sessionStore.create({
      userId: user.id,
      role: user.roleId,
      ttlMinutes: KIOSK_SESSION_TTL_MINUTES,
      isKiosk: true,
      clientIp: clientIP,
    });

    // Mark this request as a kiosk session for downstream middleware
    req.isKioskSession = true;

    setSessionCookie(res, sess.sid);

    // Log success to both audit systems
    await logKioskAudit(user.id, true, clientIP, userAgent);

    await logAudit({
      action: 'auth.kiosk_login',
      result: 'ok',
      actorId: user.id,
      ip: clientIP,
      ua: userAgent || 'unknown',
      details: { userId: user.id, isKiosk: true, ttlMinutes: KIOSK_SESSION_TTL_MINUTES },
    });

    return success(res, {
      success: true,
      isKiosk: true,
      user: {
        id: user.id,
        displayName: user.displayName,
        nickname: user.nickname,
        role: user.roleId,
        color: user.color,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error('[postPinLogin] error', err);
    await logKioskAudit(null, false, clientIP, userAgent, 'SERVER_ERROR');
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
