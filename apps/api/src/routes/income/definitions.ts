// Income Definitions - CRUD operations for income sources
// Admin-only household income tracking

import { Request, Response } from 'express';
import { q } from '../../db';
import { getUser } from '../../utils/auth';
import { authRequired, invalidInput, notFound, serverError } from '../../utils/errors';
import { createLogger } from '../../services/logger';

const log = createLogger('income');

// ============================================
// GET ALL INCOME DEFINITIONS
// ============================================
export async function getIncomeDefinitions(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { active } = req.query;

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthEndStr = `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`;

    let sql = `
      SELECT
        mi.id,
        mi.name,
        mi.description,
        mi.amount,
        mi.incomeType,
        mi.frequency,
        mi.dayOfMonth,
        mi.startDate,
        mi.endDate,
        mi.active,
        mi.createdBy,
        u.displayName as creatorName,
        mi.createdAt,
        mi.updatedAt,
        COALESCE(entries_sum.receivedThisMonth, 0) as receivedThisMonth
      FROM monthly_income mi
      LEFT JOIN users u ON mi.createdBy = u.id
      LEFT JOIN (
        SELECT incomeId, SUM(amount) as receivedThisMonth
        FROM monthly_income_entries
        WHERE receivedDate >= ? AND receivedDate <= ?
        GROUP BY incomeId
      ) entries_sum ON mi.id = entries_sum.incomeId
      WHERE 1=1
    `;
    const params: any[] = [monthStart, monthEndStr];

    if (active !== undefined) {
      sql += ' AND mi.active = ?';
      params.push(active === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY mi.name ASC';

    const definitions = await q<any[]>(sql, params);

    res.json({ incomeDefinitions: definitions });
  } catch (err) {
    log.error('Failed to get income definitions', { error: String(err) });
    serverError(res, 'Failed to get income definitions');
  }
}

// ============================================
// GET SINGLE INCOME DEFINITION
// ============================================
export async function getIncomeDefinition(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { id } = req.params;

    const definitions = await q<any[]>(`
      SELECT
        mi.id,
        mi.name,
        mi.description,
        mi.amount,
        mi.incomeType,
        mi.frequency,
        mi.dayOfMonth,
        mi.startDate,
        mi.endDate,
        mi.active,
        mi.createdBy,
        u.displayName as creatorName,
        mi.createdAt,
        mi.updatedAt
      FROM monthly_income mi
      LEFT JOIN users u ON mi.createdBy = u.id
      WHERE mi.id = ?
    `, [id]);

    if (definitions.length === 0) {
      return notFound(res, 'Income source');
    }

    // Get recent entries for this income source
    const entries = await q<any[]>(`
      SELECT
        mie.id,
        mie.incomeId,
        mie.amount,
        mie.receivedDate,
        mie.notes,
        mie.createdBy,
        u.displayName as creatorName,
        mie.createdAt,
        mie.updatedAt
      FROM monthly_income_entries mie
      LEFT JOIN users u ON mie.createdBy = u.id
      WHERE mie.incomeId = ?
      ORDER BY mie.receivedDate DESC
      LIMIT 20
    `, [id]);

    res.json({
      incomeDefinition: definitions[0],
      entries
    });
  } catch (err) {
    log.error('Failed to get income definition', { error: String(err) });
    serverError(res, 'Failed to get income definition');
  }
}

// ============================================
// CREATE INCOME DEFINITION
// ============================================
export async function createIncomeDefinition(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const {
      name,
      description,
      amount,
      incomeType = 'salary',
      frequency = 'monthly',
      dayOfMonth,
      startDate,
      endDate
    } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return invalidInput(res, 'Income source name is required');
    }
    if (amount === undefined || amount === null || amount <= 0) {
      return invalidInput(res, 'Amount must be greater than 0');
    }

    const result = await q<any>(`
      INSERT INTO monthly_income (
        name, description, amount, incomeType, frequency,
        dayOfMonth, startDate, endDate, createdBy
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name.trim(),
      description || null,
      amount,
      incomeType,
      frequency,
      dayOfMonth || null,
      startDate || null,
      endDate || null,
      user.id
    ]);

    log.info('Income definition created', { incomeId: result.insertId, name, amount, createdBy: user.id });

    res.status(201).json({
      id: result.insertId,
      message: 'Income source created successfully'
    });
  } catch (err) {
    log.error('Failed to create income definition', { error: String(err) });
    serverError(res, 'Failed to create income definition');
  }
}

// ============================================
// UPDATE INCOME DEFINITION
// ============================================
export async function updateIncomeDefinition(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { id } = req.params;
    const {
      name,
      description,
      amount,
      incomeType,
      frequency,
      dayOfMonth,
      startDate,
      endDate,
      active
    } = req.body;

    // Check if income source exists
    const existing = await q<any[]>(`
      SELECT id FROM monthly_income WHERE id = ?
    `, [id]);

    if (existing.length === 0) {
      return notFound(res, 'Income source');
    }

    // Validate amount if provided
    if (amount !== undefined && amount <= 0) {
      return invalidInput(res, 'Amount must be greater than 0');
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name.trim());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (amount !== undefined) {
      updates.push('amount = ?');
      params.push(amount);
    }
    if (incomeType !== undefined) {
      updates.push('incomeType = ?');
      params.push(incomeType);
    }
    if (frequency !== undefined) {
      updates.push('frequency = ?');
      params.push(frequency);
    }
    if (dayOfMonth !== undefined) {
      updates.push('dayOfMonth = ?');
      params.push(dayOfMonth);
    }
    if (startDate !== undefined) {
      updates.push('startDate = ?');
      params.push(startDate);
    }
    if (endDate !== undefined) {
      updates.push('endDate = ?');
      params.push(endDate);
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
      UPDATE monthly_income
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);

    log.info('Income definition updated', { incomeId: id, updatedBy: user.id });

    res.json({ success: true, message: 'Income source updated successfully' });
  } catch (err) {
    log.error('Failed to update income definition', { incomeId: req.params.id, error: String(err) });
    serverError(res, 'Failed to update income definition');
  }
}

// ============================================
// DELETE INCOME DEFINITION (soft delete)
// ============================================
export async function deleteIncomeDefinition(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { id } = req.params;

    // Check if income source exists
    const existing = await q<any[]>(`
      SELECT id FROM monthly_income WHERE id = ?
    `, [id]);

    if (existing.length === 0) {
      return notFound(res, 'Income source');
    }

    // Soft delete
    await q(`
      UPDATE monthly_income SET active = 0 WHERE id = ?
    `, [id]);

    log.info('Income definition deleted (soft)', { incomeId: id, deletedBy: user.id });

    res.json({ success: true, message: 'Income source deleted successfully' });
  } catch (err) {
    log.error('Failed to delete income definition', { incomeId: req.params.id, error: String(err) });
    serverError(res, 'Failed to delete income definition');
  }
}
