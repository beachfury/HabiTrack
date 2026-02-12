// apps/api/src/routes/paid-chores/earnings.ts
// Paid Chores earnings and leaderboard

import { Request, Response } from 'express';
import { q } from '../../db';
import { getUser } from '../../utils/auth';
import { authRequired, serverError } from '../../utils/errors';
import { LIMITS } from '../../utils/constants';

// =============================================================================
// GET EARNINGS (User's total earnings)
// =============================================================================

export async function getEarnings(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { userId } = req.query;

    // Admins can view anyone's earnings, others can only view their own
    const targetUserId = user.roleId === 'admin' && userId ? userId : user.id;

    // Get total earnings
    const totals = await q<any[]>(`
      SELECT COALESCE(SUM(amount), 0) as totalEarnings
      FROM paid_chore_earnings
      WHERE userId = ?
    `, [targetUserId]);

    // Get earnings history
    const history = await q<any[]>(`
      SELECT
        pce.*,
        pc.title as choreTitle,
        pc.description as choreDescription
      FROM paid_chore_earnings pce
      JOIN paid_chores pc ON pce.paidChoreId = pc.id
      WHERE pce.userId = ?
      ORDER BY pce.earnedAt DESC
      LIMIT ?
    `, [targetUserId, LIMITS.EARNINGS_HISTORY]);

    // Get user info
    const users = await q<any[]>('SELECT id, displayName, color FROM users WHERE id = ?', [targetUserId]);

    res.json({
      user: users[0],
      totalEarnings: parseFloat(totals[0].totalEarnings),
      history,
    });
  } catch (err) {
    console.error('Failed to get earnings:', err);
    serverError(res, 'Failed to get earnings');
  }
}

// =============================================================================
// GET LEADERBOARD (Top earners)
// =============================================================================

export async function getEarningsLeaderboard(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const leaderboard = await q<any[]>(`
      SELECT
        u.id,
        u.displayName,
        u.nickname,
        u.color,
        u.avatarUrl,
        COALESCE(SUM(pce.amount), 0) as totalEarnings,
        COUNT(pce.id) as choresCompleted
      FROM users u
      LEFT JOIN paid_chore_earnings pce ON u.id = pce.userId
      WHERE u.active = 1
      GROUP BY u.id
      ORDER BY totalEarnings DESC
      LIMIT ?
    `, [LIMITS.LEADERBOARD]);

    res.json({ leaderboard });
  } catch (err) {
    console.error('Failed to get earnings leaderboard:', err);
    serverError(res, 'Failed to get earnings leaderboard');
  }
}
