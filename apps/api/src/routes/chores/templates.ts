// apps/api/src/routes/chores/templates.ts
// Chore template management routes

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import {
  getUser,
  isValidString,
  success,
  created,
  serverError,
  validationError,
  notFound,
} from '../../utils';
import { getTodayLocal, getTimezone } from '../../utils/date';

interface ChoreTemplate {
  id: number;
  name: string;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  defaultPoints: number;
  estimatedMinutes: number | null;
  difficulty: 'easy' | 'medium' | 'hard';
  requiresPhoto: boolean;
  requireApproval: boolean;
  isSystem: boolean;
}

type RecurrenceType = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'x_days';

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
 * Creates instances from startDate up to endDate (or daysAhead days in the future if no endDate)
 */
async function generateChoreInstances(
  choreId: number,
  recurrenceType: RecurrenceType,
  recurrenceInterval: number,
  assignedTo: number | null,
  startDate: string,
  endDate?: string | null,
  daysAhead: number = 30,
): Promise<number> {
  const instances: Array<{ choreId: number; dueDate: string; assignedTo: number | null }> = [];

  // Parse start date at noon to avoid DST issues
  const start = new Date(startDate + 'T12:00:00');

  // Calculate end date: use provided endDate or default to daysAhead from now
  let end: Date;
  if (endDate) {
    end = new Date(endDate + 'T12:00:00');
  } else {
    end = new Date();
    end.setDate(end.getDate() + daysAhead);
  }

  // Get today's date in the configured timezone
  const todayStr = getTodayLocal();
  const today = new Date(todayStr + 'T12:00:00');

  // Ensure start date is not in the past for new chores
  if (start < today) {
    start.setTime(today.getTime());
  }

  let current = new Date(start);
  const interval = recurrenceInterval || 1;

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
        current.setDate(current.getDate() + interval);
        break;
      case 'weekly':
        current.setDate(current.getDate() + 7 * interval);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + interval);
        break;
      case 'custom':
      case 'x_days':
        current.setDate(current.getDate() + interval);
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
  }

  return instances.length;
}

/**
 * GET /api/chores/templates
 * Get all chore templates, optionally filtered by category
 */
export async function getTemplates(req: Request, res: Response) {
  try {
    const { categoryId } = req.query;

    let sql = `
      SELECT
        t.id,
        t.name,
        t.description,
        t.categoryId,
        c.name AS categoryName,
        c.color AS categoryColor,
        t.defaultPoints,
        t.estimatedMinutes,
        t.difficulty,
        t.requiresPhoto,
        t.requireApproval,
        t.isSystem
      FROM chore_templates t
      LEFT JOIN chore_categories c ON t.categoryId = c.id
    `;

    const params: any[] = [];
    if (categoryId) {
      sql += ' WHERE t.categoryId = ?';
      params.push(Number(categoryId));
    }

    sql += ' ORDER BY c.sortOrder, t.name';

    const templates = await q<ChoreTemplate[]>(sql, params);
    return success(res, { templates });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * GET /api/chores/templates/:id
 * Get a single chore template by ID
 */
export async function getTemplate(req: Request, res: Response) {
  try {
    const templateId = parseInt(req.params.id);

    const [template] = await q<ChoreTemplate[]>(
      `SELECT
        t.id,
        t.name,
        t.description,
        t.categoryId,
        c.name AS categoryName,
        c.color AS categoryColor,
        t.defaultPoints,
        t.estimatedMinutes,
        t.difficulty,
        t.requiresPhoto,
        t.requireApproval,
        t.isSystem
      FROM chore_templates t
      LEFT JOIN chore_categories c ON t.categoryId = c.id
      WHERE t.id = ?`,
      [templateId],
    );

    if (!template) {
      return notFound(res, 'Template not found');
    }

    return success(res, { template });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/chores/templates
 * Create a new chore template (admin only)
 */
export async function createTemplate(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const {
    name,
    description,
    categoryId,
    defaultPoints,
    estimatedMinutes,
    difficulty,
    requiresPhoto,
    requireApproval,
  } = req.body;

  // Also accept 'title' as an alias for 'name' (frontend compatibility)
  const templateName = name || req.body.title;

  if (!isValidString(templateName, 2)) {
    return validationError(res, 'Name is required (min 2 characters)');
  }

  const validDifficulties = ['easy', 'medium', 'hard'];
  const templateDifficulty = validDifficulties.includes(difficulty) ? difficulty : 'medium';

  try {
    const result: any = await q(
      `INSERT INTO chore_templates (name, description, categoryId, defaultPoints, estimatedMinutes, difficulty, requiresPhoto, requireApproval, isSystem)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        templateName.trim(),
        description || null,
        categoryId || null,
        defaultPoints ?? 10,
        estimatedMinutes || null,
        templateDifficulty,
        requiresPhoto ? 1 : 0,
        requireApproval ? 1 : 0,
      ],
    );

    const [template] = await q<ChoreTemplate[]>(
      `SELECT
        t.id,
        t.name,
        t.description,
        t.categoryId,
        c.name AS categoryName,
        c.color AS categoryColor,
        t.defaultPoints,
        t.estimatedMinutes,
        t.difficulty,
        t.requiresPhoto,
        t.requireApproval,
        t.isSystem
      FROM chore_templates t
      LEFT JOIN chore_categories c ON t.categoryId = c.id
      WHERE t.id = ?`,
      [result.insertId],
    );

    await logAudit({
      action: 'chore.template.create',
      result: 'ok',
      actorId: user.id,
      details: { templateId: result.insertId, name: templateName.trim() },
    });

    return created(res, { template, templateId: result.insertId });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * PUT /api/chores/templates/:id
 * Update an existing chore template (admin only)
 */
export async function updateTemplate(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const templateId = parseInt(req.params.id);
  const {
    name,
    title,
    description,
    categoryId,
    defaultPoints,
    estimatedMinutes,
    difficulty,
    requiresPhoto,
    requireApproval,
  } = req.body;

  try {
    // Check if template exists
    const [existing] = await q<{ id: number; isSystem: boolean }[]>(
      'SELECT id, isSystem FROM chore_templates WHERE id = ?',
      [templateId],
    );

    if (!existing) {
      return notFound(res, 'Template not found');
    }

    const updates: string[] = [];
    const params: any[] = [];

    // Accept both 'name' and 'title' for frontend compatibility
    const templateName = name ?? title;
    if (templateName !== undefined) {
      updates.push('name = ?');
      params.push(templateName);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description || null);
    }
    if (categoryId !== undefined) {
      updates.push('categoryId = ?');
      params.push(categoryId || null);
    }
    if (defaultPoints !== undefined) {
      updates.push('defaultPoints = ?');
      params.push(defaultPoints);
    }
    if (estimatedMinutes !== undefined) {
      updates.push('estimatedMinutes = ?');
      params.push(estimatedMinutes || null);
    }
    if (difficulty !== undefined) {
      const validDifficulties = ['easy', 'medium', 'hard'];
      if (validDifficulties.includes(difficulty)) {
        updates.push('difficulty = ?');
        params.push(difficulty);
      }
    }
    if (requiresPhoto !== undefined) {
      updates.push('requiresPhoto = ?');
      params.push(requiresPhoto ? 1 : 0);
    }
    if (requireApproval !== undefined) {
      updates.push('requireApproval = ?');
      params.push(requireApproval ? 1 : 0);
    }

    if (updates.length === 0) {
      return validationError(res, 'No fields to update');
    }

    params.push(templateId);
    await q(`UPDATE chore_templates SET ${updates.join(', ')} WHERE id = ?`, params);

    const [template] = await q<ChoreTemplate[]>(
      `SELECT
        t.id,
        t.name,
        t.description,
        t.categoryId,
        c.name AS categoryName,
        c.color AS categoryColor,
        t.defaultPoints,
        t.estimatedMinutes,
        t.difficulty,
        t.requiresPhoto,
        t.requireApproval,
        t.isSystem
      FROM chore_templates t
      LEFT JOIN chore_categories c ON t.categoryId = c.id
      WHERE t.id = ?`,
      [templateId],
    );

    await logAudit({
      action: 'chore.template.update',
      result: 'ok',
      actorId: user.id,
      details: { templateId, updates: req.body },
    });

    return success(res, { template });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * DELETE /api/chores/templates/:id
 * Delete a chore template (admin only)
 */
export async function deleteTemplate(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const templateId = parseInt(req.params.id);

  try {
    const [existing] = await q<{ id: number; isSystem: boolean }[]>(
      'SELECT id, isSystem FROM chore_templates WHERE id = ?',
      [templateId],
    );

    if (!existing) {
      return notFound(res, 'Template not found');
    }

    if (existing.isSystem) {
      return res
        .status(403)
        .json({ error: { code: 'FORBIDDEN', message: 'Cannot delete system templates' } });
    }

    await q('DELETE FROM chore_templates WHERE id = ?', [templateId]);

    await logAudit({
      action: 'chore.template.delete',
      result: 'ok',
      actorId: user.id,
      details: { templateId },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/chores/templates/:id/apply
 * Apply a template to create a new chore definition AND generate instances
 */
export async function applyTemplate(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const templateId = parseInt(req.params.id);
  const {
    assignedTo,
    recurrenceType = 'once',
    recurrenceInterval = 1,
    recurrenceDays,
    dueTime,
    startDate,
    endDate,
  } = req.body;

  try {
    const [template] = await q<ChoreTemplate[]>('SELECT * FROM chore_templates WHERE id = ?', [
      templateId,
    ]);

    if (!template) {
      return notFound(res, 'Template not found');
    }

    // Use timezone-aware today as default start date
    const effectiveStartDate = startDate || getTodayLocal();

    // Create the chore definition
    const result: any = await q(
      `INSERT INTO chores (
        title, description, categoryId, difficulty, estimatedMinutes, points,
        recurrenceType, recurrenceInterval, recurrenceDays, dueTime,
        assignedTo, startDate, endDate, createdBy, requirePhoto, requireApproval, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        template.name,
        template.description,
        template.categoryId,
        template.difficulty,
        template.estimatedMinutes,
        template.defaultPoints,
        recurrenceType,
        recurrenceInterval,
        recurrenceDays || null,
        dueTime || null,
        assignedTo || null,
        effectiveStartDate,
        endDate || null,
        user.id,
        (template as any).requiresPhoto ? 1 : 0,
        (template as any).requireApproval ? 1 : 0,
      ],
    );

    const choreId = result.insertId;

    // Generate instances for this chore
    const instanceCount = await generateChoreInstances(
      choreId,
      recurrenceType as RecurrenceType,
      recurrenceInterval,
      assignedTo || null,
      effectiveStartDate,
      endDate || null,
      30, // Default 30 days if no end date
    );

    await logAudit({
      action: 'chore.template.apply',
      result: 'ok',
      actorId: user.id,
      details: { templateId, choreId, instancesCreated: instanceCount, assignedTo },
    });

    return created(res, {
      choreId,
      instancesCreated: instanceCount,
      success: true,
    });
  } catch (err) {
    return serverError(res, err as Error);
  }
}
