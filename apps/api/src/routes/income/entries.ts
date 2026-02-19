// Income Entries - CRUD operations for income transactions + summary
// Admin-only household income tracking

import { Request, Response } from 'express';
import { q } from '../../db';
import { getUser } from '../../utils/auth';
import { authRequired, invalidInput, notFound, serverError } from '../../utils/errors';
import { createLogger } from '../../services/logger';

const log = createLogger('income');

// ============================================
// GET ALL INCOME ENTRIES (with filters)
// ============================================
export async function getIncomeEntries(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { incomeId, startDate, endDate, limit = 100, offset = 0 } = req.query;

    let sql = `
      SELECT
        mie.id,
        mie.incomeId,
        mi.name as incomeName,
        mie.amount,
        mie.receivedDate,
        mie.notes,
        mie.createdBy,
        u.displayName as creatorName,
        mie.createdAt,
        mie.updatedAt
      FROM monthly_income_entries mie
      LEFT JOIN monthly_income mi ON mie.incomeId = mi.id
      LEFT JOIN users u ON mie.createdBy = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (incomeId) {
      sql += ' AND mie.incomeId = ?';
      params.push(incomeId);
    }

    if (startDate) {
      sql += ' AND mie.receivedDate >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND mie.receivedDate <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY mie.receivedDate DESC, mie.createdAt DESC';
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const entries = await q<any[]>(sql, params);

    // Get total count for pagination
    let countSql = `
      SELECT COUNT(*) as total
      FROM monthly_income_entries mie
      WHERE 1=1
    `;
    const countParams: any[] = [];

    if (incomeId) {
      countSql += ' AND mie.incomeId = ?';
      countParams.push(incomeId);
    }
    if (startDate) {
      countSql += ' AND mie.receivedDate >= ?';
      countParams.push(startDate);
    }
    if (endDate) {
      countSql += ' AND mie.receivedDate <= ?';
      countParams.push(endDate);
    }

    const countResult = await q<any[]>(countSql, countParams);

    res.json({
      entries,
      pagination: {
        total: countResult[0]?.total || 0,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (err) {
    log.error('Failed to get income entries', { error: String(err) });
    serverError(res, 'Failed to get income entries');
  }
}

// ============================================
// CREATE INCOME ENTRY
// ============================================
export async function createIncomeEntry(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const {
      incomeId,
      amount,
      receivedDate,
      notes
    } = req.body;

    // Validation
    if (!incomeId) {
      return invalidInput(res, 'Income source is required');
    }
    if (amount === undefined || amount === null || amount <= 0) {
      return invalidInput(res, 'Amount must be greater than 0');
    }
    if (!receivedDate) {
      return invalidInput(res, 'Received date is required');
    }

    // Check income source exists
    const income = await q<any[]>(`
      SELECT id FROM monthly_income WHERE id = ? AND active = 1
    `, [incomeId]);

    if (income.length === 0) {
      return invalidInput(res, 'Invalid income source');
    }

    const result = await q<any>(`
      INSERT INTO monthly_income_entries (
        incomeId, amount, receivedDate, notes, createdBy
      )
      VALUES (?, ?, ?, ?, ?)
    `, [
      incomeId,
      amount,
      receivedDate,
      notes || null,
      user.id
    ]);

    log.info('Income entry created', { entryId: result.insertId, incomeId, amount, createdBy: user.id });

    res.status(201).json({
      id: result.insertId,
      message: 'Income entry created successfully'
    });
  } catch (err) {
    log.error('Failed to create income entry', { error: String(err) });
    serverError(res, 'Failed to create income entry');
  }
}

// ============================================
// UPDATE INCOME ENTRY
// ============================================
export async function updateIncomeEntry(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { id } = req.params;
    const {
      incomeId,
      amount,
      receivedDate,
      notes
    } = req.body;

    // Check if entry exists
    const existing = await q<any[]>(`
      SELECT id FROM monthly_income_entries WHERE id = ?
    `, [id]);

    if (existing.length === 0) {
      return notFound(res, 'Income entry');
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (incomeId !== undefined) {
      // Verify income source exists
      const income = await q<any[]>(`
        SELECT id FROM monthly_income WHERE id = ? AND active = 1
      `, [incomeId]);
      if (income.length === 0) {
        return invalidInput(res, 'Invalid income source');
      }
      updates.push('incomeId = ?');
      params.push(incomeId);
    }
    if (amount !== undefined) {
      if (amount <= 0) {
        return invalidInput(res, 'Amount must be greater than 0');
      }
      updates.push('amount = ?');
      params.push(amount);
    }
    if (receivedDate !== undefined) {
      updates.push('receivedDate = ?');
      params.push(receivedDate);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return invalidInput(res, 'No fields to update');
    }

    params.push(id);
    await q(`
      UPDATE monthly_income_entries
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);

    log.info('Income entry updated', { entryId: id, updatedBy: user.id });

    res.json({ success: true, message: 'Income entry updated successfully' });
  } catch (err) {
    log.error('Failed to update income entry', { entryId: req.params.id, error: String(err) });
    serverError(res, 'Failed to update income entry');
  }
}

// ============================================
// DELETE INCOME ENTRY (hard delete)
// ============================================
export async function deleteIncomeEntry(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { id } = req.params;

    // Check if entry exists
    const existing = await q<any[]>(`
      SELECT id FROM monthly_income_entries WHERE id = ?
    `, [id]);

    if (existing.length === 0) {
      return notFound(res, 'Income entry');
    }

    // Hard delete
    await q(`
      DELETE FROM monthly_income_entries WHERE id = ?
    `, [id]);

    log.info('Income entry deleted', { entryId: id, deletedBy: user.id });

    res.json({ success: true, message: 'Income entry deleted successfully' });
  } catch (err) {
    log.error('Failed to delete income entry', { entryId: req.params.id, error: String(err) });
    serverError(res, 'Failed to delete income entry');
  }
}

// ============================================
// GET INCOME SUMMARY (current month)
// ============================================
export async function getIncomeSummary(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthEndStr = `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`;

    // Calculate total expected monthly income from active sources
    // Normalize all frequencies to a monthly amount
    const activeSources = await q<any[]>(`
      SELECT amount, frequency
      FROM monthly_income
      WHERE active = 1
    `);

    let totalExpectedMonthly = 0;
    for (const source of activeSources) {
      const amt = parseFloat(source.amount);
      switch (source.frequency) {
        case 'monthly':
          totalExpectedMonthly += amt;
          break;
        case 'bi-weekly':
          totalExpectedMonthly += (amt * 26) / 12;
          break;
        case 'weekly':
          totalExpectedMonthly += (amt * 52) / 12;
          break;
        case 'yearly':
          totalExpectedMonthly += amt / 12;
          break;
        case 'one-time':
        case 'irregular':
          // Don't include in expected monthly
          break;
        default:
          totalExpectedMonthly += amt;
          break;
      }
    }

    // Total received this month
    const receivedResult = await q<any[]>(`
      SELECT COALESCE(SUM(amount), 0) as totalReceived
      FROM monthly_income_entries
      WHERE receivedDate >= ? AND receivedDate <= ?
    `, [monthStart, monthEndStr]);

    const totalReceivedThisMonth = parseFloat(receivedResult[0]?.totalReceived || 0);

    // Total budgeted expenses (approximate monthly from budgets table)
    const budgetResult = await q<any[]>(`
      SELECT COALESCE(SUM(budgetAmount), 0) as totalBudgeted
      FROM budgets
      WHERE active = 1 AND periodType = 'monthly'
    `);

    const totalBudgetedExpenses = parseFloat(budgetResult[0]?.totalBudgeted || 0);

    // Net position
    const netPosition = totalReceivedThisMonth - totalBudgetedExpenses;

    // Count of active income sources
    const countResult = await q<any[]>(`
      SELECT COUNT(*) as sourceCount
      FROM monthly_income
      WHERE active = 1
    `);

    const incomeSourceCount = parseInt(countResult[0]?.sourceCount || 0);

    res.json({
      summary: {
        totalExpectedMonthly: Math.round(totalExpectedMonthly * 100) / 100,
        totalReceivedThisMonth: Math.round(totalReceivedThisMonth * 100) / 100,
        totalBudgetedExpenses: Math.round(totalBudgetedExpenses * 100) / 100,
        netPosition: Math.round(netPosition * 100) / 100,
        incomeSourceCount,
        periodStart: monthStart,
        periodEnd: monthEndStr
      }
    });
  } catch (err) {
    log.error('Failed to get income summary', { error: String(err) });
    serverError(res, 'Failed to get income summary');
  }
}
