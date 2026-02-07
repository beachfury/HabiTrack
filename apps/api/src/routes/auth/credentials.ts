// apps/api/src/routes/auth/credentials.ts
// Password-based authentication routes

import type { Request, Response } from 'express';
import { parseEnv } from '@habitrack/core-config';
import { q } from '../../db';
import { logAudit } from '../../audit';
import { sessionStore } from '../../session-store';
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MINUTES,
  IS_DEV,
  setSessionCookie,
} from '../../cookie-config';
import {
  updateUserPassword,
  verifyUserPassword,
  getUserRole,
  generateSecureCode,
} from '../../crypto';
import { checkLockout, recordLoginAttempt, clearFailedAttempts } from '../../lockout';
import { Notifier } from '../../notify';
import { makeOnboardToken } from '../../onboard/token';
import { success, serverError, validationError } from '../../utils';

const cfg = parseEnv(process.env);

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
 * POST /api/auth/creds/register
 * Register credentials for existing user
 */
export async function postRegister(req: Request, res: Response) {
  const { userId, secret } = (req.body ?? {}) as { userId?: number; secret?: string };

  if (!userId || !secret) {
    return validationError(res, 'userId and secret required');
  }

  const u = await q<Array<{ id: number }>>('SELECT id FROM users WHERE id=? LIMIT 1', [userId]);
  if (!u.length) {
    return res.status(404).json({ error: { code: 'USER_NOT_FOUND' } });
  }

  await updateUserPassword(userId, secret);

  await logAudit({
    action: 'auth.register',
    result: 'ok',
    ...clientMeta(req),
    details: { userId },
  });

  const role = await getUserRole(userId);
  const sess = await sessionStore.create({ userId, role, ttlMinutes: SESSION_TTL_MINUTES });
  setSessionCookie(res, sess.sid);

  return res.status(204).end();
}

/**
 * POST /api/auth/creds/login
 * Login with email/userId and password
 */
export async function postLogin(req: Request, res: Response) {
  const { userId, email, secret } = (req.body ?? {}) as {
    userId?: number;
    email?: string;
    secret?: string;
  };
  const { ip, ua } = clientMeta(req);

  if ((!userId && !email) || !secret) {
    return validationError(res, '(userId or email) and secret required');
  }

  // Resolve userId from email if needed
  let resolvedUserId = userId;
  if (!resolvedUserId && email) {
    const [user] = await q<Array<{ id: number }>>('SELECT id FROM users WHERE email = ? LIMIT 1', [
      email.toLowerCase(),
    ]);
    if (!user) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS' } });
    }
    resolvedUserId = user.id;
  }

  if (!resolvedUserId) {
    return validationError(res, 'Could not resolve user');
  }

  try {
    // Check lockout
    const lockoutStatus = await checkLockout(resolvedUserId);
    if (lockoutStatus.isLocked) {
      await logAudit({
        action: 'auth.lockout',
        result: 'deny',
        actorId: resolvedUserId,
        ip,
        ua,
        details: {
          failedAttempts: lockoutStatus.failedAttempts,
          expiresAt: lockoutStatus.lockoutExpiresAt?.toISOString(),
        },
      });

      const retryAfter = Math.ceil((lockoutStatus.lockoutExpiresAt!.getTime() - Date.now()) / 1000);

      return res.status(423).json({
        error: {
          code: 'ACCOUNT_LOCKED',
          message: `Account locked. Try again in ${Math.ceil(retryAfter / 60)} minutes.`,
          retryAfter,
        },
      });
    }

    // Verify password
    const ok = await verifyUserPassword(resolvedUserId, secret);
    if (!ok) {
      await recordLoginAttempt(resolvedUserId, false, ip);

      await logAudit({
        action: 'auth.login.fail',
        result: 'deny',
        actorId: resolvedUserId,
        ip,
        ua,
        details: { remainingAttempts: lockoutStatus.remainingAttempts - 1 },
      });

      const newStatus = await checkLockout(resolvedUserId);
      if (newStatus.isLocked) {
        return res.status(423).json({
          error: {
            code: 'ACCOUNT_LOCKED',
            message: 'Too many failed attempts. Account is now locked.',
          },
        });
      }

      return res.status(401).json({
        error: {
          code: 'BAD_CREDENTIALS',
          remainingAttempts: newStatus.remainingAttempts,
        },
      });
    }

    // Success
    await recordLoginAttempt(resolvedUserId, true, ip);

    // Check first login requirement
    const u = await q<Array<{ firstLoginRequired: number }>>(
      'SELECT firstLoginRequired FROM users WHERE id=? LIMIT 1',
      [resolvedUserId],
    );

    if (u[0]?.firstLoginRequired) {
      const exp = Date.now() + 10 * 60_000;
      const token = makeOnboardToken(resolvedUserId, 'onboard', exp);
      return res.status(428).json({
        error: { code: 'FIRST_LOGIN_REQUIRED' },
        onboardToken: token,
      });
    }

    // Create session
    const role = await getUserRole(resolvedUserId);
    const sess = await sessionStore.create({
      userId: resolvedUserId,
      role,
      ttlMinutes: SESSION_TTL_MINUTES,
    });

    setSessionCookie(res, sess.sid);

    await logAudit({
      action: 'auth.login.ok',
      result: 'ok',
      actorId: resolvedUserId,
      ip,
      ua,
      details: { sid: sess.sid },
    });

    return res.status(204).end();
  } catch (e) {
    console.error('[postLogin] error', e);
    return serverError(res, e as Error);
  }
}

/**
 * POST /api/auth/creds/change
 * Change password (requires current session)
 */
export async function postChangePassword(req: Request, res: Response) {
  const { oldSecret, newSecret } = (req.body ?? {}) as { oldSecret?: string; newSecret?: string };
  const { ip, ua } = clientMeta(req);

  if (!oldSecret || !newSecret) {
    return validationError(res, 'oldSecret and newSecret required');
  }

  const sid = (req.cookies?.[SESSION_COOKIE_NAME] ?? '').trim();
  if (!sid) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const sess = await sessionStore.get(sid);
  if (!sess) return res.status(401).json({ error: { code: 'AUTH_EXPIRED' } });

  const userId = sess.userId;

  // Verify old password
  const okOld = await verifyUserPassword(userId, oldSecret);
  if (!okOld) {
    await logAudit({
      action: 'auth.password.change',
      result: 'deny',
      actorId: userId,
      ip,
      ua,
      details: { reason: 'old_secret_mismatch' },
    });
    return res.status(401).json({ error: { code: 'BAD_CREDENTIALS' } });
  }

  // Update password
  await updateUserPassword(userId, newSecret);

  // Rotate sessions
  await q('DELETE FROM sessions WHERE user_id = ?', [userId]);

  // Create fresh session
  const role = await getUserRole(userId);
  const newSess = await sessionStore.create({ userId, role, ttlMinutes: SESSION_TTL_MINUTES });
  setSessionCookie(res, newSess.sid);

  await logAudit({
    action: 'auth.password.change',
    result: 'ok',
    actorId: userId,
    ip,
    ua,
    details: { rotatedSessions: true },
  });

  return res.status(204).end();
}
