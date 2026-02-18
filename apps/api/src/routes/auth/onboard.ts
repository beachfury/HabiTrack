// apps/api/src/routes/auth/onboard.ts
// Onboarding completion route with admin notification

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import { createNotification } from '../messages';
import { queueEmail } from '../../email/queue';
import { readOnboardToken } from '../../onboard/token';
import { updateUserPassword, getUserRole } from '../../crypto';
import { sessionStore } from '../../session-store';
import { SESSION_TTL_MINUTES, setSessionCookie } from '../../cookie-config';
import { createLogger } from '../../services/logger';

const log = createLogger('onboard');

/**
 * POST /api/auth/onboard/complete
 * Mark onboarding as complete for a user
 */
export async function postOnboardComplete(req: Request, res: Response) {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });
  }

  const userId = user.id;

  try {
    // Mark user as onboarded
    await q(`UPDATE users SET onboarded = 1 WHERE id = ?`, [userId]);

    // Get user info for the notification
    const [userData] = await q<Array<{ displayName: string }>>(
      `SELECT displayName FROM users WHERE id = ?`,
      [userId],
    );

    // Notify all admins that a new user has joined
    const admins = await q<Array<{ id: number; email: string | null; displayName: string }>>(
      `SELECT id, email, displayName FROM users WHERE roleId = 'admin' AND active = 1 AND id != ?`,
      [userId],
    );

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'family',
        title: 'New family member! 👋',
        body: `${userData?.displayName || 'A new user'} has joined and completed setup`,
        link: '/family',
        relatedId: userId,
        relatedType: 'user',
      });

      // Send email notification
      if (admin.email) {
        await queueEmail({
          userId: admin.id,
          toEmail: admin.email,
          template: 'NEW_FAMILY_MEMBER',
          variables: {
            userName: admin.displayName,
            memberName: userData?.displayName || 'A new user',
          },
        });
      }
    }

    await logAudit({ action: 'auth.onboard.complete', result: 'ok', actorId: userId });

    return res.json({ success: true });
  } catch (err) {
    console.error('[postOnboardComplete] error', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR' } });
  }
}

/**
 * POST /api/auth/onboard/set-password
 * Set password for first-time login (uses onboardToken, not session)
 * This is called when a new family member logs in with a temporary password
 * and needs to set their own password.
 */
export async function postSetPassword(req: Request, res: Response) {
  const { token, newPassword } = req.body as { token?: string; newPassword?: string };

  // Validate input
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: { code: 'TOKEN_REQUIRED', message: 'Onboard token is required' } });
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: { code: 'INVALID_PASSWORD', message: 'Password must be at least 8 characters' } });
  }

  // Validate the onboard token
  const tokenData = readOnboardToken(token);
  if (!tokenData) {
    log.warn('Invalid or expired onboard token');
    return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token. Please log in again.' } });
  }

  const userId = tokenData.userId;

  try {
    // Verify user exists and has firstLoginRequired flag set
    const [user] = await q<Array<{ id: number; displayName: string; firstLoginRequired: number }>>(
      `SELECT id, displayName, firstLoginRequired FROM users WHERE id = ? AND active = 1`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }

    if (!user.firstLoginRequired) {
      // User already completed first login, just log them in
      log.info('User already completed first login, proceeding with session', { userId });
    }

    // Update the user's password
    await updateUserPassword(userId, newPassword);

    // Clear the firstLoginRequired flag
    await q(`UPDATE users SET firstLoginRequired = 0 WHERE id = ?`, [userId]);

    // Create a session for the user
    const role = await getUserRole(userId);
    const sess = await sessionStore.create({
      userId,
      role,
      ttlMinutes: SESSION_TTL_MINUTES,
    });

    setSessionCookie(res, sess.sid);

    log.info('First login password set successfully', { userId, displayName: user.displayName });

    await logAudit({
      action: 'auth.first_login.complete',
      result: 'ok',
      actorId: userId,
      details: { displayName: user.displayName },
    });

    return res.json({ success: true, message: 'Password set successfully' });
  } catch (err) {
    log.error('Failed to set password for first login', { userId, error: String(err) });
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to set password' } });
  }
}
