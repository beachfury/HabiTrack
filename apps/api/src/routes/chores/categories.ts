// apps/api/src/routes/chores/categories.ts
// Chore category management routes

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
} from '../../utils';
import { createLogger } from '../../services/logger';

const log = createLogger('chores');

interface Category {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  sortOrder: number;
}

/**
 * GET /api/chores/categories
 * Get all active chore categories
 */
export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await q<Category[]>(
      `SELECT id, name, icon, color, sortOrder
       FROM chore_categories
       WHERE active = 1
       ORDER BY sortOrder, name`,
    );

    return success(res, { categories });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/chores/categories
 * Create a new chore category (admin only)
 */
export async function createCategory(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { name, icon, color } = req.body;

  if (!isValidString(name, 2)) {
    return validationError(res, 'Name is required (min 2 characters)');
  }

  try {
    const result: any = await q(
      `INSERT INTO chore_categories (name, icon, color, sortOrder)
       VALUES (?, ?, ?, (SELECT COALESCE(MAX(sortOrder), 0) + 1 FROM chore_categories cc))`,
      [name.trim(), icon || null, color || null],
    );

    await logAudit({
      action: 'chore.category.create',
      result: 'ok',
      actorId: user.id,
      details: { categoryId: result.insertId, name: name.trim() },
    });

    return created(res, {
      category: {
        id: result.insertId,
        name: name.trim(),
        icon: icon || null,
        color: color || null,
      },
    });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * PATCH /api/chores/categories/:id
 * Update a chore category (admin only)
 */
export async function updateCategory(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const categoryId = parseInt(req.params.id);
  const { name, icon, color } = req.body;

  try {
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      params.push(icon);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color);
    }

    if (updates.length === 0) {
      return validationError(res, 'No fields to update');
    }

    params.push(categoryId);
    await q(`UPDATE chore_categories SET ${updates.join(', ')} WHERE id = ?`, params);

    const [category] = await q<Category[]>(`SELECT * FROM chore_categories WHERE id = ?`, [
      categoryId,
    ]);

    await logAudit({
      action: 'chore.category.update',
      result: 'ok',
      actorId: user.id,
      details: { categoryId, updates: req.body },
    });

    return success(res, { category });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * DELETE /api/chores/categories/:id
 * Delete a chore category (admin only)
 */
export async function deleteCategory(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const categoryId = parseInt(req.params.id);

  try {
    // Set categoryId to NULL for all templates/chores using this category
    await q(`UPDATE chore_templates SET categoryId = NULL WHERE categoryId = ?`, [categoryId]);
    await q(`UPDATE chores SET categoryId = NULL WHERE categoryId = ?`, [categoryId]);

    // Soft delete the category
    await q(`UPDATE chore_categories SET active = 0 WHERE id = ?`, [categoryId]);

    await logAudit({
      action: 'chore.category.delete',
      result: 'ok',
      actorId: user.id,
      details: { categoryId },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}
