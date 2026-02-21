// apps/api/src/routes/auth/reset.ts
// Password reset routes

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import { sessionStore } from '../../session-store';
import { SESSION_TTL_MINUTES, IS_DEV, setSessionCookie } from '../../cookie-config';
import { updateUserPassword, getUserRole, generateSecureCode } from '../../crypto';
import { clearFailedAttempts } from '../../lockout';
import { Notifier } from '../../notify';
import { success, serverError, validationError } from '../../utils';

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
 * POST /api/auth/creds/forgot
 * Generate and send password reset code
 */
export async function postForgotPassword(req: Request, res: Response) {
  const { userId, email } = (req.body ?? {}) as { userId?: number; email?: string };
  const { ip, ua } = clientMeta(req);

  try {
    // Resolve userId from email if provided
    let resolvedUserId = userId;

    if (!resolvedUserId && email) {
      const [user] = await q<Array<{ id: number }>>(
        'SELECT id FROM users WHERE email = ? AND active = 1 LIMIT 1',
        [email.toLowerCase().trim()],
      );
      if (user) {
        resolvedUserId = user.id;
      }
    }

    if (!resolvedUserId) {
      // Always return success to prevent email enumeration
      return success(res, { ok: true });
    }

    // Generate code
    const code = IS_DEV ? '000000' : generateSecureCode(6);

    // Store hash of code
    try {
      await q(
        `INSERT INTO password_resets (userId, codeHash, expiresAt, attempts, createdAt)
         VALUES (?, UNHEX(SHA2(?,256)), NOW(3) + INTERVAL 10 MINUTE, 0, NOW(3))
         ON DUPLICATE KEY UPDATE
           codeHash  = VALUES(codeHash),
           expiresAt = VALUES(expiresAt),
           attempts  = 0,
           createdAt = VALUES(createdAt)`,
        [resolvedUserId, code],
      );
    } catch (sqlErr) {
      console.error('[auth.forgot] insert error:', sqlErr);
      if (!IS_DEV) throw sqlErr;
    }

    // Send email notification
    const user = await q<Array<{ email: string | null; displayName: string }>>(
      'SELECT email, displayName FROM users WHERE id = ? LIMIT 1',
      [resolvedUserId],
    );

    if (user[0]?.email) {
      await Notifier.enqueue({
        kind: 'password_reset_code',
        userId: resolvedUserId,
        toEmail: user[0].email,
        subject: 'Your HabiTrack Password Reset Code',
        text: `Hi ${user[0].displayName},\n\nYour password reset code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
        html: `<p>Hi ${user[0].displayName},</p><p>Your password reset code is: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p><p>If you didn't request this, please ignore this email.</p>`,
      }).catch((err) => {
        console.error('[notify.enqueue] non-fatal:', err);
      });
    }

    await logAudit({ action: 'auth.forgot', result: 'ok', actorId: resolvedUserId, ip, ua });

    // In dev, return the code for testing
    if (IS_DEV) {
      return success(res, { ok: true, devCode: code });
    }

    return success(res, { ok: true });
  } catch (err) {
    console.error('[postForgotPassword] error', err);
    await logAudit({
      action: 'auth.forgot',
      result: 'error',
      actorId: userId,
      ip,
      ua,
      details: { error: String(err) },
    });
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/auth/creds/reset
 * Verify reset code and set new password
 */
export async function postResetPassword(req: Request, res: Response) {
  const { userId, email, code, newSecret } = (req.body ?? {}) as {
    userId?: number;
    email?: string;
    code?: string;
    newSecret?: string;
  };
  const { ip, ua } = clientMeta(req);

  try {
    // Resolve userId from email if provided
    let resolvedUserId = userId;
    if (!resolvedUserId && email) {
      const [user] = await q<Array<{ id: number }>>(
        'SELECT id FROM users WHERE email = ? AND active = 1 LIMIT 1',
        [email.toLowerCase().trim()],
      );
      if (user) resolvedUserId = user.id;
    }

    if (!resolvedUserId || !code || !newSecret) {
      return validationError(res, 'email (or userId), code and newSecret required');
    }

    // Verify code
    const rows = await q<Array<{ attempts: number }>>(
      `SELECT attempts
       FROM password_resets
       WHERE userId = ?
         AND codeHash = UNHEX(SHA2(?,256))
         AND expiresAt > NOW(3)
       ORDER BY createdAt DESC
       LIMIT 1`,
      [resolvedUserId, code],
    );

    if (!rows.length) {
      // Increment attempts counter
      await q(
        `UPDATE password_resets
         SET attempts = LEAST(attempts + 1, 255)
         WHERE userId = ?
         ORDER BY createdAt DESC
         LIMIT 1`,
        [resolvedUserId],
      ).catch(() => {});

      await logAudit({
        action: 'auth.reset',
        result: 'deny',
        actorId: resolvedUserId,
        ip,
        ua,
        details: { reason: 'INVALID_OR_EXPIRED_CODE' },
      });

      return res.status(400).json({ error: { code: 'INVALID_OR_EXPIRED_CODE' } });
    }

    // Set new password
    await updateUserPassword(resolvedUserId, newSecret);

    // Clear lockout
    await clearFailedAttempts(resolvedUserId);

    // Invalidate all existing sessions
    await q('DELETE FROM sessions WHERE user_id = ?', [resolvedUserId]).catch(() => {});

    // Delete reset code
    await q('DELETE FROM password_resets WHERE userId = ?', [resolvedUserId]).catch(() => {});

    // Create fresh session
    const role = await getUserRole(resolvedUserId);
    const sess = await sessionStore.create({ userId: resolvedUserId, role, ttlMinutes: SESSION_TTL_MINUTES });
    setSessionCookie(res, sess.sid);

    await logAudit({ action: 'auth.reset', result: 'ok', actorId: resolvedUserId, ip, ua });

    return res.status(204).end();
  } catch (err) {
    console.error('[postResetPassword] error', err);
    await logAudit({
      action: 'auth.reset',
      result: 'error',
      actorId: userId,
      ip,
      ua,
      details: { error: String(err) },
    });
    return serverError(res, err as Error);
  }
}
