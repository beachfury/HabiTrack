// apps/api/src/routes/auth/onboard.ts
// Onboarding completion route with admin notification

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import { createNotification } from '../messages';
import { queueEmail } from '../../email/queue';

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
