// apps/api/src/routes/chores/definitions.ts
// Chore definition (template) management routes

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import { createNotification } from '../messages';
import {
  getUser,
  isValidString,
  isValidEnum,
  success,
  created,
  notFound,
  serverError,
  validationError,
} from '../../utils';
import { getTodayLocal, getTimezone } from '../../utils/date';
import { queueEmail, getUserEmail } from '../../email/queue';
import { createLogger } from '../../services/logger';

const log = createLogger('chores');

type Difficulty = 'easy' | 'medium' | 'hard';
type RecurrenceType = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom' | 'x_days';

interface Chore {
  id: number;
  title: string;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  difficulty: Difficulty;
  points: number;
  estimatedMinutes: number | null;
  recurrenceType: RecurrenceType;
  recurrenceInterval: number;
  recurrenceDays: string | null;
  dueTime: string | null;
  assignedTo: number | null;
  assignedToName: string | null;
  requireApproval: boolean;
  active: boolean;
}

/**
 * Format a Date object to YYYY-MM-DD string in the configured timezone
 */
function formatDateInTimezone(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: getTimezone(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Generate chore instances for a given chore definition
 * Creates instances from startDate up to 30 days in the future
 */
async function generateChoreInstances(
  choreId: number,
  recurrenceType: RecurrenceType,
  recurrenceInterval: number,
  assignedTo: number | null,
  startDate: string,
  daysAhead: number = 30,
  choreTitle?: string,
): Promise<number> {
  const instances: Array<{ choreId: number; dueDate: string; assignedTo: number | null }> = [];

  // Parse start date at noon to avoid DST issues
  const start = new Date(startDate + 'T12:00:00');
  const end = new Date();
  end.setDate(end.getDate() + daysAhead);

  // Get today's date in the configured timezone
  const todayStr = getTodayLocal();
  const today = new Date(todayStr + 'T12:00:00');

  // Ensure start date is not in the past for new chores
  if (start < today) {
    start.setTime(today.getTime());
  }

  let current = new Date(start);

  while (current <= end) {
    instances.push({
      choreId,
      dueDate: formatDateInTimezone(current), // Use timezone-aware formatting
      assignedTo,
    });

    // Calculate next date based on recurrence type
    switch (recurrenceType) {
      case 'once':
        // Only one instance
        current = new Date(end.getTime() + 86400000); // Exit loop
        break;
      case 'daily':
        current.setDate(current.getDate() + 1);
        break;
      case 'weekly':
        current.setDate(current.getDate() + 7);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + 1);
        break;
      case 'custom':
      case 'x_days':
        current.setDate(current.getDate() + recurrenceInterval);
        break;
      default:
        current = new Date(end.getTime() + 86400000); // Exit loop for unknown types
    }
  }

  // Insert all instances
  if (instances.length > 0) {
    const values = instances.map(() => '(?, ?, ?)').join(', ');
    const params = instances.flatMap((i) => [i.choreId, i.dueDate, i.assignedTo]);

    await q(`INSERT INTO chore_instances (choreId, dueDate, assignedTo) VALUES ${values}`, params);

    // Send notification to the assigned user about new chore assignments
    if (assignedTo && instances.length > 0) {
      const firstDueDate = instances[0].dueDate;
      const title = choreTitle || 'A chore';
      const instanceText = instances.length > 1
        ? `${instances.length} upcoming instances`
        : `due ${new Date(firstDueDate).toLocaleDateString()}`;

      // In-app notification
      await createNotification({
        userId: assignedTo,
        type: 'chore',
        title: 'New chore assigned to you',
        body: `"${title}" has been assigned to you (${instanceText})`,
        link: '/chores',
        relatedId: choreId,
        relatedType: 'chore',
      });

      // Email notification
      const assigneeEmail = await getUserEmail(assignedTo);
      if (assigneeEmail) {
        // Get assignee name for email
        const [assigneeInfo] = await q<Array<{ displayName: string }>>(
          'SELECT displayName FROM users WHERE id = ?',
          [assignedTo],
        );

        await queueEmail({
          userId: assignedTo,
          toEmail: assigneeEmail,
          template: 'CHORE_ASSIGNED',
          variables: {
            userName: assigneeInfo?.displayName || 'there',
            choreName: title,
            dueDate: new Date(firstDueDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }),
            points: 0, // Points aren't available here, using 0
            description: '',
          },
        });
      }
    }
  }

  return instances.length;
}

/**
 * GET /api/chores
 * Get all chore definitions
 */
export async function getChores(req: Request, res: Response) {
  try {
    const chores = await q<Chore[]>(
      `SELECT
        c.id, c.title, c.description, c.categoryId,
        cat.name as categoryName, cat.color as categoryColor,
        c.difficulty, c.points, c.estimatedMinutes,
        c.recurrenceType, c.recurrenceInterval, c.recurrenceDays,
        c.dueTime, c.assignedTo,
        u.displayName as assignedToName,
        c.requireApproval, c.active
       FROM chores c
       LEFT JOIN chore_categories cat ON c.categoryId = cat.id
       LEFT JOIN users u ON c.assignedTo = u.id
       WHERE c.active = 1
       ORDER BY c.title`,
    );

    return success(res, { chores });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * GET /api/chores/:id
 * Get a single chore definition
 */
export async function getChore(req: Request, res: Response) {
  const choreId = parseInt(req.params.id);

  if (isNaN(choreId)) {
    return validationError(res, 'Invalid chore ID');
  }

  try {
    const [chore] = await q<Chore[]>(
      `SELECT
        c.id, c.title, c.description, c.categoryId,
        cat.name as categoryName, cat.color as categoryColor,
        c.difficulty, c.points, c.estimatedMinutes,
        c.recurrenceType, c.recurrenceInterval, c.recurrenceDays,
        c.dueTime, c.assignedTo,
        u.displayName as assignedToName,
        c.requireApproval, c.active
       FROM chores c
       LEFT JOIN chore_categories cat ON c.categoryId = cat.id
       LEFT JOIN users u ON c.assignedTo = u.id
       WHERE c.id = ?`,
      [choreId],
    );

    if (!chore) {
      return notFound(res, 'Chore not found');
    }

    return success(res, { chore });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/chores
 * Create a new chore definition (admin only)
 */
export async function createChore(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const {
    title,
    description,
    categoryId,
    difficulty = 'medium',
    points = 10,
    estimatedMinutes,
    recurrenceType = 'once',
    recurrenceInterval = 1,
    recurrenceDays,
    dueTime,
    assignedTo,
    requireApproval = false,
    startDate,
  } = req.body;

  if (!isValidString(title, 2)) {
    return validationError(res, 'Title is required (min 2 characters)');
  }

  if (!isValidEnum(difficulty, ['easy', 'medium', 'hard'])) {
    return validationError(res, 'Invalid difficulty');
  }

  if (!isValidEnum(recurrenceType, ['once', 'daily', 'weekly', 'monthly', 'custom', 'x_days'])) {
    return validationError(res, 'Invalid recurrence type');
  }

  // Use timezone-aware date
  const effectiveStartDate = startDate || getTodayLocal();

  try {
    const result: any = await q(
      `INSERT INTO chores (
        title, description, categoryId, difficulty, points,
        estimatedMinutes, recurrenceType, recurrenceInterval,
        recurrenceDays, dueTime, assignedTo, requireApproval, startDate, createdBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description || null,
        categoryId || null,
        difficulty,
        points,
        estimatedMinutes || null,
        recurrenceType,
        recurrenceInterval,
        recurrenceDays || null,
        dueTime || null,
        assignedTo || null,
        requireApproval ? 1 : 0,
        effectiveStartDate,
        user.id,
      ],
    );

    const choreId = result.insertId;

    // Generate chore instances for the next 30 days
    const instanceCount = await generateChoreInstances(
      choreId,
      recurrenceType as RecurrenceType,
      recurrenceInterval,
      assignedTo || null,
      effectiveStartDate,
      30,
      title.trim(),
    );

    log.info('Chore created', { choreId, title: title.trim(), createdBy: user.id, instances: instanceCount });

    await logAudit({
      action: 'chore.create',
      result: 'ok',
      actorId: user.id,
      details: { choreId, title: title.trim(), instancesCreated: instanceCount },
    });

    return created(res, { id: choreId, instancesCreated: instanceCount });
  } catch (err) {
    log.error('Failed to create chore', { error: String(err) });
    return serverError(res, err as Error);
  }
}

/**
 * PUT /api/chores/:id
 * Update a chore definition (admin only)
 */
export async function updateChore(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const choreId = parseInt(req.params.id);
  const {
    title,
    description,
    categoryId,
    difficulty,
    points,
    estimatedMinutes,
    recurrenceType,
    recurrenceInterval,
    recurrenceDays,
    dueTime,
    assignedTo,
    requireApproval,
  } = req.body;

  try {
    const updates: string[] = [];
    const params: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title.trim());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description || null);
    }
    if (categoryId !== undefined) {
      updates.push('categoryId = ?');
      params.push(categoryId || null);
    }
    if (difficulty !== undefined) {
      updates.push('difficulty = ?');
      params.push(difficulty);
    }
    if (points !== undefined) {
      updates.push('points = ?');
      params.push(points);
    }
    if (estimatedMinutes !== undefined) {
      updates.push('estimatedMinutes = ?');
      params.push(estimatedMinutes || null);
    }
    if (recurrenceType !== undefined) {
      updates.push('recurrenceType = ?');
      params.push(recurrenceType);
    }
    if (recurrenceInterval !== undefined) {
      updates.push('recurrenceInterval = ?');
      params.push(recurrenceInterval);
    }
    if (recurrenceDays !== undefined) {
      updates.push('recurrenceDays = ?');
      params.push(recurrenceDays || null);
    }
    if (dueTime !== undefined) {
      updates.push('dueTime = ?');
      params.push(dueTime || null);
    }
    if (assignedTo !== undefined) {
      updates.push('assignedTo = ?');
      params.push(assignedTo || null);
    }
    if (requireApproval !== undefined) {
      updates.push('requireApproval = ?');
      params.push(requireApproval ? 1 : 0);
    }

    if (updates.length === 0) {
      return validationError(res, 'No fields to update');
    }

    params.push(choreId);
    await q(`UPDATE chores SET ${updates.join(', ')} WHERE id = ?`, params);

    // If assignedTo changed, update future pending instances
    if (assignedTo !== undefined) {
      const today = getTodayLocal();
      await q(
        `UPDATE chore_instances
         SET assignedTo = ?
         WHERE choreId = ? AND dueDate >= ? AND status = 'pending'`,
        [assignedTo || null, choreId, today],
      );
    }

    log.info('Chore updated', { choreId, updatedBy: user.id });

    await logAudit({
      action: 'chore.update',
      result: 'ok',
      actorId: user.id,
      details: { choreId, updates: req.body },
    });

    return success(res, { success: true });
  } catch (err) {
    log.error('Failed to update chore', { choreId, error: String(err) });
    return serverError(res, err as Error);
  }
}

/**
 * DELETE /api/chores/:id
 * Soft delete a chore (admin only)
 */
export async function deleteChore(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const choreId = parseInt(req.params.id);

  try {
    await q(`UPDATE chores SET active = 0 WHERE id = ?`, [choreId]);

    // Also delete future pending instances
    const today = getTodayLocal();
    await q(
      `DELETE FROM chore_instances WHERE choreId = ? AND dueDate >= ? AND status = 'pending'`,
      [choreId, today],
    );

    log.info('Chore deleted (soft)', { choreId, deletedBy: user.id });

    await logAudit({
      action: 'chore.delete',
      result: 'ok',
      actorId: user.id,
      details: { choreId },
    });

    return success(res, { success: true });
  } catch (err) {
    log.error('Failed to delete chore', { choreId, error: String(err) });
    return serverError(res, err as Error);
  }
}

/**
 * DELETE /api/chores/:id/hard
 * Permanently delete a chore and all instances (admin only)
 */
export async function hardDeleteChore(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const choreId = parseInt(req.params.id);

  try {
    // Delete all instances first
    await q(`DELETE FROM chore_instances WHERE choreId = ?`, [choreId]);
    // Delete the chore
    await q(`DELETE FROM chores WHERE id = ?`, [choreId]);

    await logAudit({
      action: 'chore.hard_delete',
      result: 'ok',
      actorId: user.id,
      details: { choreId },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/chores/:id/regenerate
 * Regenerate instances for a chore (admin only)
 * Useful if recurrence settings changed
 */
export async function regenerateInstances(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const choreId = parseInt(req.params.id);

  try {
    // Get the chore
    const [chore] = await q<any[]>(`SELECT * FROM chores WHERE id = ? AND active = 1`, [choreId]);

    if (!chore) {
      return notFound(res, 'Chore not found');
    }

    // Delete future pending instances
    const today = getTodayLocal();
    await q(
      `DELETE FROM chore_instances WHERE choreId = ? AND dueDate >= ? AND status = 'pending'`,
      [choreId, today],
    );

    // Regenerate instances (no notification on regenerate, only on new assignments)
    const instanceCount = await generateChoreInstances(
      choreId,
      chore.recurrenceType,
      chore.recurrenceInterval,
      chore.assignedTo,
      today,
      30,
      undefined, // Don't send notification on regenerate
    );

    await logAudit({
      action: 'chore.regenerate',
      result: 'ok',
      actorId: user.id,
      details: { choreId, instancesCreated: instanceCount },
    });

    return success(res, { success: true, instancesCreated: instanceCount });
  } catch (err) {
    return serverError(res, err as Error);
  }
}
