// apps/api/src/routes/chores/instances.ts
// Chore instance management routes

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import { createNotification } from '../messages';
import {
  getUser,
  normalizeDate,
  getTodayLocal,
  success,
  notFound,
  serverError,
  validationError,
} from '../../utils';

interface ChoreInstance {
  id: number;
  choreId: number;
  title: string;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  difficulty: string;
  points: number;
  estimatedMinutes: number | null;
  dueDate: string;
  dueTime: string | null;
  assignedTo: number | null;
  assignedToName: string | null;
  status: string;
  completedAt: string | null;
  completedBy: number | null;
  completedByName: string | null;
  pointsAwarded: number | null;
  requireApproval: boolean;
}

/**
 * GET /api/chores/instances
 * Get chore instances for a date range
 */
export async function getInstances(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { startDate, endDate, mine } = req.query;

  try {
    let whereClause = 'WHERE ci.dueDate >= ? AND ci.dueDate <= ?';
    const params: any[] = [startDate, endDate];

    // If mine=true, only show instances assigned to current user
    if (mine === 'true') {
      whereClause += ' AND ci.assignedTo = ?';
      params.push(user.id);
    }

    const instances = await q<ChoreInstance[]>(
      `SELECT
        ci.id, ci.choreId, c.title, c.description,
        c.categoryId, cat.name as categoryName, cat.color as categoryColor,
        c.difficulty, c.points, c.estimatedMinutes,
        ci.dueDate, c.dueTime, ci.assignedTo,
        u.displayName as assignedToName,
        ci.status, ci.completedAt, ci.completedBy,
        cu.displayName as completedByName,
        ci.pointsAwarded, c.requireApproval
       FROM chore_instances ci
       JOIN chores c ON ci.choreId = c.id
       LEFT JOIN chore_categories cat ON c.categoryId = cat.id
       LEFT JOIN users u ON ci.assignedTo = u.id
       LEFT JOIN users cu ON ci.completedBy = cu.id
       ${whereClause}
       ORDER BY ci.dueDate, c.dueTime, c.title`,
      params,
    );

    return success(res, { instances });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/chores/instances/:id/complete
 * Mark a chore instance as complete
 */
export async function completeInstance(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const instanceId = parseInt(req.params.id);
  const { notes, forUserId } = req.body; // <-- ADD forUserId here

  try {
    // Get the instance
    const [instance] = await q<any[]>(
      `SELECT ci.*, c.points, c.requireApproval, c.title
       FROM chore_instances ci
       JOIN chores c ON ci.choreId = c.id
       WHERE ci.id = ?`,
      [instanceId],
    );

    if (!instance) {
      return notFound(res, 'Chore instance not found');
    }

    if (instance.status !== 'pending') {
      return validationError(res, 'Chore is not in pending status');
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

    // Determine who gets the points:
    // 1. If forUserId is specified (admin completing for someone), use that
    // 2. Otherwise, use the assignedTo user
    // 3. Fall back to the current user (person completing)
    const pointsRecipient = forUserId || instance.assignedTo || user.id;

    if (instance.requireApproval) {
      // Mark as completed, awaiting approval
      await q(
        `UPDATE chore_instances
         SET status = 'completed', completedAt = ?, completedBy = ?, completionNotes = ?
         WHERE id = ?`,
        [now, user.id, notes || null, instanceId],
      );

      // Notify admins...
      // (keep existing notification code)

      await logAudit({
        action: 'chore.complete',
        result: 'ok',
        actorId: user.id,
        details: { instanceId, awaitsApproval: true, forUserId },
      });

      return success(res, { success: true, awaitsApproval: true });
    } else {
      // Auto-approve and award points
      await q(
        `UPDATE chore_instances
         SET status = 'approved', completedAt = ?, completedBy = ?,
             approvedAt = ?, approvedBy = ?, pointsAwarded = ?, completionNotes = ?
         WHERE id = ?`,
        [now, user.id, now, user.id, totalPoints, notes || null, instanceId],
      );

      // Award points to the correct user
      await q(`UPDATE users SET totalPoints = totalPoints + ? WHERE id = ?`, [
        totalPoints,
        pointsRecipient, // <-- Uses forUserId if provided, else assignedTo, else current user
      ]);

      await logAudit({
        action: 'chore.complete',
        result: 'ok',
        actorId: user.id,
        details: {
          instanceId,
          pointsAwarded: totalPoints,
          bonusPoints,
          pointsRecipient,
          forUserId,
        },
      });

      return success(res, {
        success: true,
        pointsAwarded: totalPoints,
        pointsRecipient,
        bonusPoints: bonusPoints > 0 ? bonusPoints : undefined,
      });
    }
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/chores/instances/:id/approve
 * Approve a completed chore (admin only)
 */
export async function approveInstance(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const instanceId = parseInt(req.params.id);

  try {
    const [instance] = await q<any[]>(
      `SELECT ci.*, c.points, c.title, ci.completedBy
       FROM chore_instances ci
       JOIN chores c ON ci.choreId = c.id
       WHERE ci.id = ?`,
      [instanceId],
    );

    if (!instance) {
      return notFound(res, 'Chore instance not found');
    }

    if (instance.status !== 'completed') {
      return validationError(res, 'Chore must be in completed status to approve');
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const points = instance.points;

    await q(
      `UPDATE chore_instances
       SET status = 'approved', approvedAt = ?, approvedBy = ?, pointsAwarded = ?
       WHERE id = ?`,
      [now, user.id, points, instanceId],
    );

    // Award points
    if (instance.completedBy) {
      await q(`UPDATE users SET totalPoints = totalPoints + ? WHERE id = ?`, [
        points,
        instance.completedBy,
      ]);

      // Notify the user
      await createNotification({
        userId: instance.completedBy,
        type: 'chore',
        title: 'Chore approved!',
        body: `"${instance.title}" was approved. +${points} points!`,
        link: '/chores',
        relatedId: instanceId,
        relatedType: 'chore_instance',
      });
    }

    await logAudit({
      action: 'chore.approve',
      result: 'ok',
      actorId: user.id,
      details: { instanceId, pointsAwarded: points },
    });

    return success(res, { success: true, pointsAwarded: points });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/chores/instances/:id/reject
 * Reject a completed chore (admin only)
 */
export async function rejectInstance(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const instanceId = parseInt(req.params.id);
  const { reason } = req.body;

  try {
    const [instance] = await q<any[]>(
      `SELECT ci.*, c.title, ci.completedBy
       FROM chore_instances ci
       JOIN chores c ON ci.choreId = c.id
       WHERE ci.id = ?`,
      [instanceId],
    );

    if (!instance) {
      return notFound(res, 'Chore instance not found');
    }

    // Reset to pending
    await q(
      `UPDATE chore_instances
       SET status = 'pending', completedAt = NULL, completedBy = NULL, rejectionReason = ?
       WHERE id = ?`,
      [reason || null, instanceId],
    );

    // Notify the user
    if (instance.completedBy) {
      await createNotification({
        userId: instance.completedBy,
        type: 'chore',
        title: 'Chore needs redo',
        body: `"${instance.title}" was sent back${reason ? `: ${reason}` : ''}`,
        link: '/chores',
        relatedId: instanceId,
        relatedType: 'chore_instance',
      });
    }

    await logAudit({
      action: 'chore.reject',
      result: 'ok',
      actorId: user.id,
      details: { instanceId, reason },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/chores/instances/:id/skip
 * Skip a chore instance (admin only)
 */
export async function skipInstance(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const instanceId = parseInt(req.params.id);

  try {
    await q(`UPDATE chore_instances SET status = 'skipped' WHERE id = ?`, [instanceId]);

    await logAudit({
      action: 'chore.skip',
      result: 'ok',
      actorId: user.id,
      details: { instanceId },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/chores/instances/:id/reassign
 * Reassign a chore instance (admin only)
 */
export async function reassignInstance(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const instanceId = parseInt(req.params.id);
  const { userId } = req.body;

  try {
    // Get chore details before updating
    const instances = await q<any[]>(
      `SELECT ci.id, ci.dueDate, cd.title
       FROM chore_instances ci
       JOIN chore_definitions cd ON ci.choreId = cd.id
       WHERE ci.id = ?`,
      [instanceId]
    );

    const instance = instances[0];

    await q(`UPDATE chore_instances SET assignedTo = ? WHERE id = ?`, [userId || null, instanceId]);

    // Send notification to the newly assigned user
    if (userId) {
      const dueDate = instance?.dueDate ? new Date(instance.dueDate).toLocaleDateString() : 'soon';
      await createNotification({
        userId,
        type: 'chore',
        title: 'Chore assigned to you',
        body: `"${instance?.title || 'A chore'}" has been assigned to you - due ${dueDate}`,
        link: '/chores',
        relatedId: instanceId,
        relatedType: 'chore_instance',
      });
    }

    await logAudit({
      action: 'chore.reassign',
      result: 'ok',
      actorId: user.id,
      details: { instanceId, newAssignee: userId },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}
