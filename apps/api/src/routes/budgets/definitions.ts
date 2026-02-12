// Budget Definitions - CRUD operations
// Admin-only

import { Request, Response } from 'express';
import { q } from '../../db';
import { getUser } from '../../utils/auth';
import { authRequired, invalidInput, notFound, serverError } from '../../utils/errors';
import { createLogger } from '../../services/logger';

const log = createLogger('budgets');

// Helper to get current period dates based on periodType
function getCurrentPeriodDates(periodType: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (periodType) {
    case 'weekly':
      // Start of current week (Sunday)
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case 'one-time':
      // For one-time, use all-time range
      startDate = new Date(2000, 0, 1);
      endDate = new Date(2100, 11, 31);
      break;
    case 'monthly':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
  }

  return { startDate, endDate };
}

// ============================================
// GET ALL BUDGETS
// ============================================
export async function getBudgets(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { categoryId, active } = req.query;

    let sql = `
      SELECT
        b.id,
        b.categoryId,
        bc.name as categoryName,
        bc.icon as categoryIcon,
        bc.color as categoryColor,
        b.name,
        b.description,
        b.budgetAmount,
        COALESCE(b.budgetType, 'bill') as budgetType,
        b.periodType,
        b.startDate,
        b.endDate,
        b.isRecurring,
        b.dueDay,
        b.active,
        b.createdBy,
        u.displayName as creatorName,
        b.createdAt,
        b.updatedAt
      FROM budgets b
      LEFT JOIN budget_categories bc ON b.categoryId = bc.id
      LEFT JOIN users u ON b.createdBy = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (categoryId) {
      sql += ' AND b.categoryId = ?';
      params.push(categoryId);
    }

    if (active !== undefined) {
      sql += ' AND b.active = ?';
      params.push(active === 'true' ? 1 : 0);
    } else {
      // Default to active only
      sql += ' AND b.active = 1';
    }

    sql += ' ORDER BY bc.sortOrder ASC, b.name ASC';

    const budgets = await q<any[]>(sql, params);

    // Calculate current spending for each budget
    const budgetsWithSpending = await Promise.all(budgets.map(async (budget) => {
      const { startDate, endDate } = getCurrentPeriodDates(budget.periodType);

      const spendingResult = await q<any[]>(`
        SELECT COALESCE(SUM(amount), 0) as totalSpent, COUNT(*) as entryCount
        FROM budget_entries
        WHERE budgetId = ?
          AND transactionDate >= ?
          AND transactionDate <= ?
      `, [budget.id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

      const totalSpent = parseFloat(spendingResult[0]?.totalSpent || 0);
      const budgetAmount = parseFloat(budget.budgetAmount);
      const entryCount = parseInt(spendingResult[0]?.entryCount || 0);

      // For bills, check if paid this period (at least one entry)
      const isPaidThisPeriod = entryCount > 0;

      return {
        ...budget,
        currentSpent: totalSpent,
        remainingAmount: budgetAmount - totalSpent,
        percentUsed: budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0,
        entryCount,
        isPaidThisPeriod
      };
    }));

    res.json({ budgets: budgetsWithSpending });
  } catch (err) {
    console.error('Failed to get budgets:', err);
    serverError(res, 'Failed to get budgets');
  }
}

// ============================================
// GET SINGLE BUDGET WITH ENTRIES
// ============================================
export async function getBudget(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { id } = req.params;

    const budgets = await q<any[]>(`
      SELECT
        b.id,
        b.categoryId,
        bc.name as categoryName,
        bc.icon as categoryIcon,
        bc.color as categoryColor,
        b.name,
        b.description,
        b.budgetAmount,
        b.periodType,
        b.startDate,
        b.endDate,
        b.isRecurring,
        b.dueDay,
        b.active,
        b.createdBy,
        u.displayName as creatorName,
        b.createdAt,
        b.updatedAt
      FROM budgets b
      LEFT JOIN budget_categories bc ON b.categoryId = bc.id
      LEFT JOIN users u ON b.createdBy = u.id
      WHERE b.id = ?
    `, [id]);

    if (budgets.length === 0) {
      return notFound(res, 'Budget');
    }

    const budget = budgets[0];
    const { startDate, endDate } = getCurrentPeriodDates(budget.periodType);

    // Get entries for this budget in current period
    const entries = await q<any[]>(`
      SELECT
        be.id,
        be.budgetId,
        be.amount,
        be.description,
        be.transactionDate,
        be.paymentMethod,
        be.vendor,
        be.receiptUrl,
        be.notes,
        be.createdBy,
        u.displayName as creatorName,
        be.createdAt,
        be.updatedAt
      FROM budget_entries be
      LEFT JOIN users u ON be.createdBy = u.id
      WHERE be.budgetId = ?
      ORDER BY be.transactionDate DESC, be.createdAt DESC
    `, [id]);

    // Calculate spending for current period
    const periodEntries = entries.filter(e => {
      const date = new Date(e.transactionDate);
      return date >= startDate && date <= endDate;
    });

    const totalSpent = periodEntries.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const budgetAmount = parseFloat(budget.budgetAmount);

    res.json({
      budget: {
        ...budget,
        currentSpent: totalSpent,
        remainingAmount: budgetAmount - totalSpent,
        percentUsed: budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0,
        entryCount: periodEntries.length
      },
      entries,
      periodInfo: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        periodType: budget.periodType
      }
    });
  } catch (err) {
    console.error('Failed to get budget:', err);
    serverError(res, 'Failed to get budget');
  }
}

// ============================================
// CREATE BUDGET
// ============================================
export async function createBudget(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const {
      categoryId,
      name,
      description,
      budgetAmount,
      budgetType = 'bill',
      periodType = 'monthly',
      startDate,
      endDate,
      isRecurring = true,
      dueDay
    } = req.body;

    // Validation
    if (!categoryId) {
      return invalidInput(res, 'Category is required');
    }
    if (!name || name.trim().length === 0) {
      return invalidInput(res, 'Budget name is required');
    }
    if (budgetAmount === undefined || budgetAmount === null || budgetAmount < 0) {
      return invalidInput(res, 'Valid budget amount is required');
    }

    // Check category exists
    const category = await q<any[]>(`
      SELECT id FROM budget_categories WHERE id = ? AND active = 1
    `, [categoryId]);

    if (category.length === 0) {
      return invalidInput(res, 'Invalid category');
    }

    const result = await q<any>(`
      INSERT INTO budgets (
        categoryId, name, description, budgetAmount, budgetType, periodType,
        startDate, endDate, isRecurring, dueDay, createdBy
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      categoryId,
      name.trim(),
      description || null,
      budgetAmount,
      budgetType,
      periodType,
      startDate || null,
      endDate || null,
      isRecurring ? 1 : 0,
      dueDay || null,
      user.id
    ]);

    log.info('Budget created', { budgetId: result.insertId, name, budgetAmount, createdBy: user.id });

    res.status(201).json({
      id: result.insertId,
      message: 'Budget created successfully'
    });
  } catch (err) {
    log.error('Failed to create budget', { error: String(err) });
    serverError(res, 'Failed to create budget');
  }
}

// ============================================
// UPDATE BUDGET (with history tracking)
// ============================================
export async function updateBudget(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { id } = req.params;
    const {
      categoryId,
      name,
      description,
      budgetAmount,
      periodType,
      startDate,
      endDate,
      isRecurring,
      dueDay,
      active,
      reason // Reason for budget amount change
    } = req.body;

    // Get existing budget
    const existing = await q<any[]>(`
      SELECT * FROM budgets WHERE id = ?
    `, [id]);

    if (existing.length === 0) {
      return notFound(res, 'Budget');
    }

    const oldBudget = existing[0];

    // If budget amount changed, log to history
    if (budgetAmount !== undefined && parseFloat(budgetAmount) !== parseFloat(oldBudget.budgetAmount)) {
      await q(`
        INSERT INTO budget_history (budgetId, previousAmount, newAmount, reason, changedBy)
        VALUES (?, ?, ?, ?, ?)
      `, [id, oldBudget.budgetAmount, budgetAmount, reason || null, user.id]);
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (categoryId !== undefined) {
      updates.push('categoryId = ?');
      params.push(categoryId);
    }
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name.trim());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (budgetAmount !== undefined) {
      updates.push('budgetAmount = ?');
      params.push(budgetAmount);
    }
    if (periodType !== undefined) {
      updates.push('periodType = ?');
      params.push(periodType);
    }
    if (startDate !== undefined) {
      updates.push('startDate = ?');
      params.push(startDate);
    }
    if (endDate !== undefined) {
      updates.push('endDate = ?');
      params.push(endDate);
    }
    if (isRecurring !== undefined) {
      updates.push('isRecurring = ?');
      params.push(isRecurring ? 1 : 0);
    }
    if (dueDay !== undefined) {
      updates.push('dueDay = ?');
      params.push(dueDay);
    }
    if (req.body.budgetType !== undefined) {
      updates.push('budgetType = ?');
      params.push(req.body.budgetType);
    }
    if (active !== undefined) {
      updates.push('active = ?');
      params.push(active ? 1 : 0);
    }

    if (updates.length === 0) {
      return invalidInput(res, 'No fields to update');
    }

    params.push(id);
    await q(`
      UPDATE budgets
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);

    log.info('Budget updated', { budgetId: id, updatedBy: user.id });

    res.json({ success: true, message: 'Budget updated successfully' });
  } catch (err) {
    log.error('Failed to update budget', { budgetId: id, error: String(err) });
    serverError(res, 'Failed to update budget');
  }
}

// ============================================
// DELETE BUDGET (soft delete)
// ============================================
export async function deleteBudget(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { id } = req.params;

    // Check if budget exists
    const existing = await q<any[]>(`
      SELECT id FROM budgets WHERE id = ?
    `, [id]);

    if (existing.length === 0) {
      return notFound(res, 'Budget');
    }

    // Soft delete
    await q(`
      UPDATE budgets SET active = 0 WHERE id = ?
    `, [id]);

    res.json({ success: true, message: 'Budget deleted successfully' });
  } catch (err) {
    console.error('Failed to delete budget:', err);
    serverError(res, 'Failed to delete budget');
  }
}

// ============================================
// GET BUDGET HISTORY
// ============================================
export async function getBudgetHistory(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { id } = req.params;

    // Check if budget exists
    const existing = await q<any[]>(`
      SELECT id, name FROM budgets WHERE id = ?
    `, [id]);

    if (existing.length === 0) {
      return notFound(res, 'Budget');
    }

    const history = await q<any[]>(`
      SELECT
        bh.id,
        bh.budgetId,
        bh.previousAmount,
        bh.newAmount,
        bh.reason,
        bh.changedBy,
        u.displayName as changedByName,
        bh.changedAt
      FROM budget_history bh
      LEFT JOIN users u ON bh.changedBy = u.id
      WHERE bh.budgetId = ?
      ORDER BY bh.changedAt DESC
    `, [id]);

    res.json({
      budgetName: existing[0].name,
      history
    });
  } catch (err) {
    console.error('Failed to get budget history:', err);
    serverError(res, 'Failed to get budget history');
  }
}
