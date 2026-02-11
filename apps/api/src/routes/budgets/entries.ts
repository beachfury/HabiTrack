// Budget Entries - CRUD operations for transactions
// Admin-only

import { Request, Response } from 'express';
import { q } from '../../db';

// Helper to get user from request
function getUser(req: Request) {
  return (req as any).user as { id: number; roleId: string } | undefined;
}

// ============================================
// GET ALL ENTRIES (with filters)
// ============================================
export async function getEntries(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { budgetId, categoryId, startDate, endDate, limit = 100, offset = 0 } = req.query;

    let sql = `
      SELECT
        be.id,
        be.budgetId,
        b.name as budgetName,
        bc.id as categoryId,
        bc.name as categoryName,
        bc.icon as categoryIcon,
        bc.color as categoryColor,
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
      LEFT JOIN budgets b ON be.budgetId = b.id
      LEFT JOIN budget_categories bc ON b.categoryId = bc.id
      LEFT JOIN users u ON be.createdBy = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (budgetId) {
      sql += ' AND be.budgetId = ?';
      params.push(budgetId);
    }

    if (categoryId) {
      sql += ' AND bc.id = ?';
      params.push(categoryId);
    }

    if (startDate) {
      sql += ' AND be.transactionDate >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND be.transactionDate <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY be.transactionDate DESC, be.createdAt DESC';
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const entries = await q<any[]>(sql, params);

    // Get total count for pagination
    let countSql = `
      SELECT COUNT(*) as total
      FROM budget_entries be
      LEFT JOIN budgets b ON be.budgetId = b.id
      LEFT JOIN budget_categories bc ON b.categoryId = bc.id
      WHERE 1=1
    `;
    const countParams: any[] = [];

    if (budgetId) {
      countSql += ' AND be.budgetId = ?';
      countParams.push(budgetId);
    }
    if (categoryId) {
      countSql += ' AND bc.id = ?';
      countParams.push(categoryId);
    }
    if (startDate) {
      countSql += ' AND be.transactionDate >= ?';
      countParams.push(startDate);
    }
    if (endDate) {
      countSql += ' AND be.transactionDate <= ?';
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
    console.error('Failed to get budget entries:', err);
    res.status(500).json({ error: 'Failed to get budget entries' });
  }
}

// ============================================
// GET SINGLE ENTRY
// ============================================
export async function getEntry(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const entries = await q<any[]>(`
      SELECT
        be.id,
        be.budgetId,
        b.name as budgetName,
        bc.id as categoryId,
        bc.name as categoryName,
        bc.icon as categoryIcon,
        bc.color as categoryColor,
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
      LEFT JOIN budgets b ON be.budgetId = b.id
      LEFT JOIN budget_categories bc ON b.categoryId = bc.id
      LEFT JOIN users u ON be.createdBy = u.id
      WHERE be.id = ?
    `, [id]);

    if (entries.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({ entry: entries[0] });
  } catch (err) {
    console.error('Failed to get budget entry:', err);
    res.status(500).json({ error: 'Failed to get budget entry' });
  }
}

// ============================================
// CREATE ENTRY
// ============================================
export async function createEntry(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      budgetId,
      amount,
      description,
      transactionDate,
      paymentMethod,
      vendor,
      receiptUrl,
      notes
    } = req.body;

    // Validation
    if (!budgetId) {
      return res.status(400).json({ error: 'Budget is required' });
    }
    if (amount === undefined || amount === null || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    if (!transactionDate) {
      return res.status(400).json({ error: 'Transaction date is required' });
    }

    // Check budget exists
    const budget = await q<any[]>(`
      SELECT id FROM budgets WHERE id = ? AND active = 1
    `, [budgetId]);

    if (budget.length === 0) {
      return res.status(400).json({ error: 'Invalid budget' });
    }

    const result = await q<any>(`
      INSERT INTO budget_entries (
        budgetId, amount, description, transactionDate,
        paymentMethod, vendor, receiptUrl, notes, createdBy
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      budgetId,
      amount,
      description || null,
      transactionDate,
      paymentMethod || null,
      vendor || null,
      receiptUrl || null,
      notes || null,
      user.id
    ]);

    res.status(201).json({
      id: result.insertId,
      message: 'Entry created successfully'
    });
  } catch (err) {
    console.error('Failed to create budget entry:', err);
    res.status(500).json({ error: 'Failed to create budget entry' });
  }
}

// ============================================
// UPDATE ENTRY
// ============================================
export async function updateEntry(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const {
      budgetId,
      amount,
      description,
      transactionDate,
      paymentMethod,
      vendor,
      receiptUrl,
      notes
    } = req.body;

    // Check if entry exists
    const existing = await q<any[]>(`
      SELECT id FROM budget_entries WHERE id = ?
    `, [id]);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (budgetId !== undefined) {
      // Verify budget exists
      const budget = await q<any[]>(`
        SELECT id FROM budgets WHERE id = ? AND active = 1
      `, [budgetId]);
      if (budget.length === 0) {
        return res.status(400).json({ error: 'Invalid budget' });
      }
      updates.push('budgetId = ?');
      params.push(budgetId);
    }
    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than 0' });
      }
      updates.push('amount = ?');
      params.push(amount);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (transactionDate !== undefined) {
      updates.push('transactionDate = ?');
      params.push(transactionDate);
    }
    if (paymentMethod !== undefined) {
      updates.push('paymentMethod = ?');
      params.push(paymentMethod);
    }
    if (vendor !== undefined) {
      updates.push('vendor = ?');
      params.push(vendor);
    }
    if (receiptUrl !== undefined) {
      updates.push('receiptUrl = ?');
      params.push(receiptUrl);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    await q(`
      UPDATE budget_entries
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);

    res.json({ success: true, message: 'Entry updated successfully' });
  } catch (err) {
    console.error('Failed to update budget entry:', err);
    res.status(500).json({ error: 'Failed to update budget entry' });
  }
}

// ============================================
// DELETE ENTRY
// ============================================
export async function deleteEntry(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    // Check if entry exists
    const existing = await q<any[]>(`
      SELECT id FROM budget_entries WHERE id = ?
    `, [id]);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Hard delete entries (they can be re-added)
    await q(`
      DELETE FROM budget_entries WHERE id = ?
    `, [id]);

    res.json({ success: true, message: 'Entry deleted successfully' });
  } catch (err) {
    console.error('Failed to delete budget entry:', err);
    res.status(500).json({ error: 'Failed to delete budget entry' });
  }
}
