// Budget Categories - CRUD operations
// Admin-only

import { Request, Response } from 'express';
import { q } from '../../db';

// Helper to get user from request
function getUser(req: Request) {
  return (req as any).user as { id: number; roleId: string } | undefined;
}

// ============================================
// GET ALL CATEGORIES
// ============================================
export async function getCategories(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const categories = await q<any[]>(`
      SELECT
        id,
        name,
        icon,
        color,
        parentId,
        sortOrder,
        active,
        createdAt,
        updatedAt
      FROM budget_categories
      WHERE active = 1
      ORDER BY sortOrder ASC, name ASC
    `);

    res.json({ categories });
  } catch (err) {
    console.error('Failed to get budget categories:', err);
    res.status(500).json({ error: 'Failed to get budget categories' });
  }
}

// ============================================
// CREATE CATEGORY
// ============================================
export async function createCategory(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, icon, color, parentId, sortOrder } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const result = await q<any>(`
      INSERT INTO budget_categories (name, icon, color, parentId, sortOrder)
      VALUES (?, ?, ?, ?, ?)
    `, [name.trim(), icon || null, color || null, parentId || null, sortOrder || 0]);

    res.status(201).json({
      id: result.insertId,
      message: 'Category created successfully'
    });
  } catch (err) {
    console.error('Failed to create budget category:', err);
    res.status(500).json({ error: 'Failed to create budget category' });
  }
}

// ============================================
// UPDATE CATEGORY
// ============================================
export async function updateCategory(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const { name, icon, color, parentId, sortOrder, active } = req.body;

    // Check if category exists
    const existing = await q<any[]>(`
      SELECT id FROM budget_categories WHERE id = ?
    `, [id]);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name.trim());
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      params.push(icon);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color);
    }
    if (parentId !== undefined) {
      updates.push('parentId = ?');
      params.push(parentId);
    }
    if (sortOrder !== undefined) {
      updates.push('sortOrder = ?');
      params.push(sortOrder);
    }
    if (active !== undefined) {
      updates.push('active = ?');
      params.push(active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    await q(`
      UPDATE budget_categories
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);

    res.json({ success: true, message: 'Category updated successfully' });
  } catch (err) {
    console.error('Failed to update budget category:', err);
    res.status(500).json({ error: 'Failed to update budget category' });
  }
}

// ============================================
// DELETE CATEGORY (soft delete)
// ============================================
export async function deleteCategory(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    // Check if category exists
    const existing = await q<any[]>(`
      SELECT id FROM budget_categories WHERE id = ?
    `, [id]);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category has budgets
    const budgetCount = await q<any[]>(`
      SELECT COUNT(*) as count FROM budgets WHERE categoryId = ? AND active = 1
    `, [id]);

    if (budgetCount[0].count > 0) {
      return res.status(400).json({
        error: 'Cannot delete category with active budgets. Move or delete the budgets first.'
      });
    }

    // Soft delete
    await q(`
      UPDATE budget_categories SET active = 0 WHERE id = ?
    `, [id]);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Failed to delete budget category:', err);
    res.status(500).json({ error: 'Failed to delete budget category' });
  }
}
