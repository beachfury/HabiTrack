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
  const { userId } = (req.body ?? {}) as { userId?: number };
  const { ip, ua } = clientMeta(req);

  try {
    if (!userId) {
      return validationError(res, 'userId required');
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
        [userId, code],
      );
    } catch (sqlErr) {
      console.error('[auth.forgot] insert error:', sqlErr);
      if (!IS_DEV) throw sqlErr;
    }

    // Send email notification
    const user = await q<Array<{ email: string | null; displayName: string }>>(
      'SELECT email, displayName FROM users WHERE id = ? LIMIT 1',
      [userId],
    );

    if (user[0]?.email) {
      await Notifier.enqueue({
        kind: 'password_reset_code',
        userId,
        toEmail: user[0].email,
        subject: 'Your HabiTrack Password Reset Code',
        text: `Hi ${user[0].displayName},\n\nYour password reset code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
        html: `<p>Hi ${user[0].displayName},</p><p>Your password reset code is: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p><p>If you didn't request this, please ignore this email.</p>`,
      }).catch((err) => {
        console.error('[notify.enqueue] non-fatal:', err);
      });
    }

    await logAudit({ action: 'auth.forgot', result: 'ok', actorId: userId, ip, ua });

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
  const { userId, code, newSecret } = (req.body ?? {}) as {
    userId?: number;
    code?: string;
    newSecret?: string;
  };
  const { ip, ua } = clientMeta(req);

  try {
    if (!userId || !code || !newSecret) {
      return validationError(res, 'userId, code and newSecret required');
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
      [userId, code],
    );

    if (!rows.length) {
      // Increment attempts counter
      await q(
        `UPDATE password_resets
         SET attempts = LEAST(attempts + 1, 255)
         WHERE userId = ?
         ORDER BY createdAt DESC
         LIMIT 1`,
        [userId],
      ).catch(() => {});

      await logAudit({
        action: 'auth.reset',
        result: 'deny',
        actorId: userId,
        ip,
        ua,
        details: { reason: 'INVALID_OR_EXPIRED_CODE' },
      });

      return res.status(400).json({ error: { code: 'INVALID_OR_EXPIRED_CODE' } });
    }

    // Set new password
    await updateUserPassword(userId, newSecret);

    // Clear lockout
    await clearFailedAttempts(userId);

    // Invalidate all existing sessions
    await q('DELETE FROM sessions WHERE user_id = ?', [userId]).catch(() => {});

    // Delete reset code
    await q('DELETE FROM password_resets WHERE userId = ?', [userId]).catch(() => {});

    // Create fresh session
    const role = await getUserRole(userId);
    const sess = await sessionStore.create({ userId, role, ttlMinutes: SESSION_TTL_MINUTES });
    setSessionCookie(res, sess.sid);

    await logAudit({ action: 'auth.reset', result: 'ok', actorId: userId, ip, ua });

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
