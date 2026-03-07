// apps/api/src/routes/kiosk.ts
// Kiosk board API — aggregated 7-day data for all family members
// All endpoints protected by kioskLocalOnly middleware (no auth required)

import { Request, Response } from 'express';
import { q } from '../db';
import { verifyUserKioskPin } from '../crypto';
import { logAudit } from '../audit';
import { createNotification } from './messages';
import {
  normalizeDate,
  getTodayLocal,
  success,
  notFound,
  serverError,
  validationError,
} from '../utils';
import { queueEmail } from '../email/queue';
import { createLogger } from '../services/logger';

const log = createLogger('kiosk');

async function safeQuery<T>(query: string, params?: any[]): Promise<T[]> {
  try {
    return await q<T[]>(query, params);
  } catch (err) {
    console.warn('Kiosk board query failed:', (err as Error).message);
    return [];
  }
}

// =============================================================================
// GET /api/kiosk/board
// Returns all family members with 7-day chores, events, paid chores, and meal
// =============================================================================

export async function getKioskBoard(_req: Request, res: Response) {
  try {
    const [members, chores, paidChores, events, meals] = await Promise.all([
      // All active family members (exclude kiosk-only accounts)
      safeQuery<any>(`
        SELECT id, displayName, nickname, color, avatarUrl, roleId, totalPoints
        FROM users
        WHERE active = 1 AND roleId != 'kiosk'
        ORDER BY
          CASE roleId WHEN 'admin' THEN 1 WHEN 'member' THEN 2 WHEN 'kid' THEN 3 ELSE 4 END,
          displayName
      `),

      // Chore instances for next 7 days
      safeQuery<any>(`
        SELECT ci.id, ci.choreId, c.title, ci.status, c.dueTime,
               DATE_FORMAT(ci.dueDate, '%Y-%m-%d') as dueDate,
               ci.completedAt, c.points, c.requireApproval,
               cat.color as categoryColor, ci.assignedTo
        FROM chore_instances ci
        JOIN chores c ON ci.choreId = c.id
        LEFT JOIN chore_categories cat ON c.categoryId = cat.id
        WHERE DATE(ci.dueDate) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
        ORDER BY ci.dueDate ASC, ci.status ASC, c.title ASC
      `),

      // Claimed/completed paid chores
      safeQuery<any>(`
        SELECT id, title, amount, difficulty, status, claimedBy, completedAt
        FROM paid_chores
        WHERE status IN ('claimed', 'completed')
          AND claimedBy IS NOT NULL
        ORDER BY title ASC
      `),

      // Calendar events for next 7 days
      safeQuery<any>(`
        SELECT id, title, startAt as startTime, endAt as endTime, color, allDay, assignedTo,
               DATE_FORMAT(startAt, '%Y-%m-%d') as startDate
        FROM calendar_events
        WHERE (DATE(startAt) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY))
           OR (DATE(startAt) <= CURDATE() AND DATE(endAt) >= CURDATE())
        ORDER BY startAt ASC
      `),

      // 7-day meal plans
      safeQuery<any>(`
        SELECT mp.id, DATE_FORMAT(mp.date, '%Y-%m-%d') as date, mp.mealType,
               mp.recipeId, r.name as recipeName, r.imageUrl as recipeImage,
               mp.customMealName, mp.isFendForYourself, mp.ffyMessage, mp.status
        FROM meal_plans mp
        LEFT JOIN recipes r ON mp.recipeId = r.id
        WHERE mp.date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
        ORDER BY mp.date ASC
      `),
    ]);

    // Group items by member
    const memberMap = members.map((m: any) => ({
      id: m.id,
      displayName: m.displayName,
      nickname: m.nickname,
      color: m.color,
      avatarUrl: m.avatarUrl,
      roleId: m.roleId,
      totalPoints: Number(m.totalPoints) || 0,
      chores: chores
        .filter((c: any) => c.assignedTo === m.id)
        .map((c: any) => ({
          id: c.id,
          choreId: c.choreId,
          title: c.title,
          status: c.status,
          dueDate: c.dueDate,
          dueTime: c.dueTime,
          completedAt: c.completedAt,
          points: c.points,
          requireApproval: !!c.requireApproval,
          categoryColor: c.categoryColor,
        })),
      paidChores: paidChores
        .filter((p: any) => p.claimedBy === m.id)
        .map((p: any) => ({
          id: p.id,
          title: p.title,
          amount: Number(p.amount),
          status: p.status,
          completedAt: p.completedAt,
        })),
      events: events
        .filter((e: any) => e.assignedTo === m.id || e.assignedTo === null)
        .map((e: any) => ({
          id: e.id,
          title: e.title,
          startTime: e.startTime,
          endTime: e.endTime,
          startDate: e.startDate,
          color: e.color,
          allDay: !!e.allDay,
        })),
    }));

    const today = new Date().toISOString().split('T')[0];
    const mealList = meals.map((m: any) => ({
      id: m.id,
      date: m.date,
      recipeName: m.recipeName,
      recipeImage: m.recipeImage,
      customMealName: m.customMealName,
      isFendForYourself: !!m.isFendForYourself,
      ffyMessage: m.ffyMessage,
      status: m.status,
    }));

    res.json({ members: memberMap, date: today, meals: mealList });
  } catch (err) {
    console.error('Kiosk board error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR' } });
  }
}

// =============================================================================
// POST /api/kiosk/complete-chore
// PIN-verified chore completion from kiosk (no session required)
// =============================================================================

export async function kioskCompleteChore(req: Request, res: Response) {
  try {
    const { userId, pin, choreInstanceId } = req.body;

    if (!userId || !pin || !choreInstanceId) {
      return validationError(res, 'userId, pin, and choreInstanceId are required');
    }

    // Verify PIN
    const isValid = await verifyUserKioskPin(userId, pin);
    if (!isValid) {
      return res.status(401).json({ error: { code: 'INVALID_PIN', message: 'Invalid PIN' } });
    }

    // Get the chore instance
    const [instance] = await q<any[]>(
      `SELECT ci.*, c.points, c.requireApproval, c.title
       FROM chore_instances ci
       JOIN chores c ON ci.choreId = c.id
       WHERE ci.id = ?`,
      [choreInstanceId],
    );

    if (!instance) {
      return notFound(res, 'Chore instance not found');
    }

    if (instance.status !== 'pending') {
      return validationError(res, 'Chore is not in pending status');
    }

    // Verify the chore is assigned to this user
    if (instance.assignedTo !== userId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'This chore is not assigned to you' } });
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const todayStr = getTodayLocal();
    const dueDate = normalizeDate(instance.dueDate);

    // Calculate bonus points for early completion
    let bonusPoints = 0;
    if (dueDate > todayStr) {
      bonusPoints = Math.floor(instance.points * 0.1);
    }
    const totalPoints = instance.points + bonusPoints;

    if (instance.requireApproval) {
      // Mark as completed, awaiting approval
      await q(
        `UPDATE chore_instances
         SET status = 'completed', completedAt = ?, completedBy = ?
         WHERE id = ?`,
        [now, userId, choreInstanceId],
      );

      // Notify admins
      const admins = await q<Array<{ id: number }>>(
        `SELECT id FROM users WHERE roleId = 'admin' AND active = 1`,
      );
      const [userInfo] = await q<Array<{ displayName: string }>>(
        'SELECT displayName FROM users WHERE id = ?',
        [userId],
      );
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: 'chore',
          title: 'Chore needs approval',
          body: `${userInfo?.displayName || 'Someone'} completed "${instance.title}" from the kiosk`,
          link: '/chores',
        });
      }

      log.info('Kiosk chore completed (awaiting approval)', { instanceId: choreInstanceId, userId });

      await logAudit({
        action: 'chore.complete',
        result: 'ok',
        actorId: userId,
        details: { instanceId: choreInstanceId, awaitsApproval: true, viaKiosk: true },
      });

      return success(res, { success: true, awaitsApproval: true });
    } else {
      // Auto-approve and award points
      await q(
        `UPDATE chore_instances
         SET status = 'approved', completedAt = ?, completedBy = ?,
             approvedAt = ?, approvedBy = ?, pointsAwarded = ?
         WHERE id = ?`,
        [now, userId, now, userId, totalPoints, choreInstanceId],
      );

      await q(`UPDATE users SET totalPoints = totalPoints + ? WHERE id = ?`, [totalPoints, userId]);

      log.info('Kiosk chore completed', { instanceId: choreInstanceId, userId, points: totalPoints });

      await logAudit({
        action: 'chore.complete',
        result: 'ok',
        actorId: userId,
        details: { instanceId: choreInstanceId, pointsAwarded: totalPoints, bonusPoints, viaKiosk: true },
      });

      return success(res, {
        success: true,
        pointsAwarded: totalPoints,
        bonusPoints: bonusPoints > 0 ? bonusPoints : undefined,
      });
    }
  } catch (err) {
    log.error('Kiosk chore completion error', { error: String(err) });
    return serverError(res, err as Error);
  }
}

// =============================================================================
// POST /api/kiosk/complete-paid-chore
// PIN-verified paid chore completion from kiosk (no session required)
// =============================================================================

export async function kioskCompletePaidChore(req: Request, res: Response) {
  try {
    const { userId, pin, paidChoreId } = req.body;

    if (!userId || !pin || !paidChoreId) {
      return validationError(res, 'userId, pin, and paidChoreId are required');
    }

    // Verify PIN
    const isValid = await verifyUserKioskPin(userId, pin);
    if (!isValid) {
      return res.status(401).json({ error: { code: 'INVALID_PIN', message: 'Invalid PIN' } });
    }

    const chores = await q<any[]>('SELECT * FROM paid_chores WHERE id = ?', [paidChoreId]);

    if (chores.length === 0) {
      return notFound(res, 'Paid chore not found');
    }

    const chore = chores[0];

    if (chore.status !== 'claimed') {
      return validationError(res, 'Chore must be claimed before completing');
    }

    if (chore.claimedBy !== userId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'This chore is not claimed by you' } });
    }

    // Skip photo requirement for kiosk (no camera available)
    await q(
      `UPDATE paid_chores SET status = 'completed', completedAt = NOW(3) WHERE id = ?`,
      [paidChoreId],
    );

    const [updated] = await q<any[]>('SELECT * FROM paid_chores WHERE id = ?', [paidChoreId]);

    // Notify admins
    const admins = await q<Array<{ id: number; email: string | null; displayName: string }>>(
      `SELECT id, email, displayName FROM users WHERE roleId = 'admin' AND active = 1`,
    );
    const [userInfo] = await q<Array<{ displayName: string }>>(
      'SELECT displayName FROM users WHERE id = ?',
      [userId],
    );
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'chore',
        title: 'Paid chore needs verification',
        body: `${userInfo?.displayName || 'Someone'} completed "${updated.title}" from the kiosk`,
        link: '/paid-chores',
      });

      if (admin.email) {
        await queueEmail({
          userId: admin.id,
          toEmail: admin.email,
          template: 'PAID_CHORE_UPDATE',
          variables: {
            userName: admin.displayName,
            choreName: updated.title,
            message: `${userInfo?.displayName || 'Someone'} has completed this chore from the kiosk and it's ready for your verification.`,
          },
        });
      }
    }

    log.info('Kiosk paid chore completed', { choreId: paidChoreId, userId });

    await logAudit({
      action: 'paid_chore.complete',
      result: 'ok',
      actorId: userId,
      details: { choreId: paidChoreId, viaKiosk: true },
    });

    return success(res, {
      success: true,
      message: 'Chore marked as complete! Waiting for admin verification.',
    });
  } catch (err) {
    log.error('Kiosk paid chore completion error', { error: String(err) });
    return serverError(res, err as Error);
  }
}
