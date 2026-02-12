// apps/api/src/routes/chores/stats.ts
// Chore statistics and leaderboard routes

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import { createNotification } from '../messages';
import { getUser, success, notFound, serverError, validationError } from '../../utils';
import { queueEmail, getUserEmail } from '../../email/queue';

interface LeaderboardEntry {
  userId: number;
  displayName: string;
  nickname: string | null;
  color: string | null;
  avatarUrl: string | null;
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  completedThisWeek: number;
  completedThisMonth: number;
}

/**
 * GET /api/chores/stats
 * Get chore statistics for current user
 */
export async function getStats(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  try {
    // Get user's total points
    const [userData] = await q<Array<{ totalPoints: number }>>(
      `SELECT totalPoints FROM users WHERE id = ?`,
      [user.id],
    );

    // Get counts for various statuses
    const [pendingCount] = await q<Array<{ count: number }>>(
      `SELECT COUNT(*) as count FROM chore_instances
       WHERE assignedTo = ? AND status = 'pending' AND dueDate <= CURDATE()`,
      [user.id],
    );

    const [completedTodayCount] = await q<Array<{ count: number }>>(
      `SELECT COUNT(*) as count FROM chore_instances
       WHERE completedBy = ? AND DATE(completedAt) = CURDATE()`,
      [user.id],
    );

    const [completedThisWeek] = await q<Array<{ count: number }>>(
      `SELECT COUNT(*) as count FROM chore_instances
       WHERE completedBy = ? AND completedAt >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)`,
      [user.id],
    );

    const [pointsThisWeek] = await q<Array<{ points: number }>>(
      `SELECT COALESCE(SUM(pointsAwarded), 0) as points FROM chore_instances
       WHERE completedBy = ? AND status = 'approved'
       AND completedAt >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)`,
      [user.id],
    );

    return success(res, {
      stats: {
        totalPoints: userData?.totalPoints || 0,
        pendingChores: pendingCount?.count || 0,
        completedToday: completedTodayCount?.count || 0,
        completedThisWeek: completedThisWeek?.count || 0,
        pointsThisWeek: pointsThisWeek?.points || 0,
      },
    });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * GET /api/chores/leaderboard
 * Get family leaderboard
 */
export async function getLeaderboard(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  try {
    const leaderboard = await q<LeaderboardEntry[]>(
      `SELECT
        u.id as userId, u.displayName, u.nickname, u.color, u.avatarUrl, u.totalPoints,
        COALESCE((
          SELECT SUM(ci.pointsAwarded) FROM chore_instances ci
          WHERE ci.completedBy = u.id AND ci.status = 'approved'
          AND ci.completedAt >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
        ), 0) as weeklyPoints,
        COALESCE((
          SELECT SUM(ci.pointsAwarded) FROM chore_instances ci
          WHERE ci.completedBy = u.id AND ci.status = 'approved'
          AND ci.completedAt >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
        ), 0) as monthlyPoints,
        COALESCE((
          SELECT COUNT(*) FROM chore_instances ci
          WHERE ci.completedBy = u.id AND ci.status = 'approved'
          AND ci.completedAt >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
        ), 0) as completedThisWeek,
        COALESCE((
          SELECT COUNT(*) FROM chore_instances ci
          WHERE ci.completedBy = u.id AND ci.status = 'approved'
          AND ci.completedAt >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
        ), 0) as completedThisMonth
       FROM users u
       WHERE u.active = 1 AND u.roleId != 'kiosk'
       ORDER BY u.totalPoints DESC`,
    );

    return success(res, { leaderboard });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/chores/points/adjust
 * Adjust a user's points (admin only)
 */
export async function adjustPoints(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { userId, amount, reason } = req.body;

  if (!userId || amount === undefined || amount === null) {
    return validationError(res, 'userId and amount are required');
  }

  const pointsAmount = parseInt(amount);
  if (isNaN(pointsAmount)) {
    return validationError(res, 'amount must be a valid number');
  }

  try {
    // Get target user
    const [targetUser] = await q<Array<{ id: number; displayName: string; totalPoints: number }>>(
      `SELECT id, displayName, totalPoints FROM users WHERE id = ?`,
      [userId],
    );

    if (!targetUser) {
      return notFound(res, 'User not found');
    }

    // Calculate new total (don't allow negative)
    const newTotal = Math.max(0, targetUser.totalPoints + pointsAmount);

    // Update points
    await q(`UPDATE users SET totalPoints = ? WHERE id = ?`, [newTotal, userId]);

    // Notify the user about the points adjustment
    const isPositive = pointsAmount > 0;
    await createNotification({
      userId: userId,
      type: 'chore',
      title: isPositive ? 'Points added! 🎉' : 'Points adjusted',
      body: isPositive
        ? `${user.displayName} added ${pointsAmount} points${reason ? `: ${reason}` : ''}`
        : `${user.displayName} adjusted your points by ${pointsAmount}${reason ? `: ${reason}` : ''}`,
      link: '/chores?tab=leaderboard',
    });

    // Send email notification for points adjustment
    const targetEmail = await getUserEmail(userId);
    if (targetEmail) {
      await queueEmail({
        userId: userId,
        toEmail: targetEmail,
        template: 'POINTS_ADJUSTED',
        variables: {
          userName: targetUser.displayName,
          change: isPositive ? `+${pointsAmount}` : String(pointsAmount),
          reason: reason || 'Manual adjustment',
          newTotal: newTotal,
        },
      });
    }

    await logAudit({
      action: 'chore.points.adjust',
      result: 'ok',
      actorId: user.id,
      details: {
        targetUserId: userId,
        targetUserName: targetUser.displayName,
        previousPoints: targetUser.totalPoints,
        adjustment: pointsAmount,
        newTotal,
        reason,
      },
    });

    return success(res, {
      success: true,
      previousPoints: targetUser.totalPoints,
      adjustment: pointsAmount,
      newTotal,
    });
  } catch (err) {
    return serverError(res, err as Error);
  }
}
