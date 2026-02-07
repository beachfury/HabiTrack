// apps/api/src/routes/chores/assignments.ts
// Routes for managing chore assignments (instances)

import type { Request, Response } from 'express';
import { q } from '../../db';
import { getUser, success, notFound, serverError } from '../../utils';

interface AssignedChore {
  id: number;
  choreId: number;
  title: string;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  dueDate: string;
  dueTime: string | null;
  assignedTo: number | null;
  assignedToName: string | null;
  status: 'pending' | 'completed' | 'skipped' | 'pending_approval';
}

/**
 * GET /api/chores/assignments
 * Get all assigned chore instances with filters
 */
export async function getAssignments(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { choreId, assignedTo, status, startDate, endDate, futureOnly } = req.query;

  try {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (choreId) {
      whereClause += ' AND ci.choreId = ?';
      params.push(choreId);
    }

    if (assignedTo) {
      whereClause += ' AND ci.assignedTo = ?';
      params.push(assignedTo);
    }

    if (status) {
      whereClause += ' AND ci.status = ?';
      params.push(status);
    }

    if (startDate) {
      whereClause += ' AND ci.dueDate >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND ci.dueDate <= ?';
      params.push(endDate);
    }

    if (futureOnly === 'true') {
      whereClause += ' AND ci.dueDate >= CURDATE()';
    }

    const assignments = await q<AssignedChore[]>(
      `SELECT
        ci.id, ci.choreId, c.title, c.description,
        c.categoryId, cat.name as categoryName, cat.color as categoryColor,
        ci.dueDate, c.dueTime, ci.assignedTo,
        u.displayName as assignedToName,
        ci.status
       FROM chore_instances ci
       JOIN chores c ON ci.choreId = c.id
       LEFT JOIN chore_categories cat ON c.categoryId = cat.id
       LEFT JOIN users u ON ci.assignedTo = u.id
       ${whereClause}
       ORDER BY ci.dueDate DESC, c.title
       LIMIT 500`,
      params,
    );

    // Get unique chores for the filter dropdown
    const chores = await q<Array<{ id: number; title: string }>>(
      `SELECT DISTINCT c.id, c.title
       FROM chores c
       JOIN chore_instances ci ON c.id = ci.choreId
       WHERE c.active = 1
       ORDER BY c.title`,
    );

    // Get users for the filter dropdown
    const users = await q<Array<{ id: number; displayName: string }>>(
      `SELECT id, displayName FROM users WHERE active = 1 ORDER BY displayName`,
    );

    return success(res, {
      assignments,
      filters: {
        chores,
        users,
      },
    });
  } catch (err) {
    console.error('getAssignments error:', err);
    return serverError(res, err as Error);
  }
}

/**
 * DELETE /api/chores/assignments/:id
 * Delete a single chore instance
 */
export async function deleteAssignment(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const instanceId = parseInt(req.params.id);

  try {
    // Check if instance exists
    const [instance] = await q<Array<{ id: number; status: string }>>(
      `SELECT id, status FROM chore_instances WHERE id = ?`,
      [instanceId],
    );

    if (!instance) {
      return notFound(res, 'Chore instance not found');
    }

    // Delete the instance
    await q(`DELETE FROM chore_instances WHERE id = ?`, [instanceId]);

    return success(res, { success: true, deletedId: instanceId });
  } catch (err) {
    console.error('deleteAssignment error:', err);
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/chores/assignments/bulk-delete
 * Delete multiple chore instances based on criteria
 */
export async function bulkDeleteAssignments(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const {
    instanceIds, // Specific instance IDs to delete
    choreId, // Delete all instances of this chore
    assignedTo, // Delete all instances assigned to this user
    startDate, // Delete instances from this date
    endDate, // Delete instances until this date
    futureOnly, // Only delete future instances
    statusFilter, // Only delete instances with this status
  } = req.body;

  try {
    let deletedCount = 0;

    // Option 1: Delete specific instances by ID
    if (instanceIds && Array.isArray(instanceIds) && instanceIds.length > 0) {
      const placeholders = instanceIds.map(() => '?').join(',');
      const result: any = await q(
        `DELETE FROM chore_instances WHERE id IN (${placeholders})`,
        instanceIds,
      );
      deletedCount = result.affectedRows || instanceIds.length;
    }
    // Option 2: Delete by criteria
    else if (choreId || assignedTo) {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      if (choreId) {
        whereClause += ' AND choreId = ?';
        params.push(choreId);
      }

      if (assignedTo) {
        whereClause += ' AND assignedTo = ?';
        params.push(assignedTo);
      }

      if (startDate) {
        whereClause += ' AND dueDate >= ?';
        params.push(startDate);
      }

      if (endDate) {
        whereClause += ' AND dueDate <= ?';
        params.push(endDate);
      }

      if (futureOnly) {
        whereClause += ' AND dueDate >= CURDATE()';
      }

      if (statusFilter) {
        whereClause += ' AND status = ?';
        params.push(statusFilter);
      } else {
        // By default, only delete pending instances (not completed ones)
        whereClause += ' AND status = "pending"';
      }

      const result: any = await q(`DELETE FROM chore_instances ${whereClause}`, params);
      deletedCount = result.affectedRows || 0;
    } else {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Must provide instanceIds or choreId/assignedTo',
        },
      });
    }

    return success(res, {
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} chore assignment${deletedCount !== 1 ? 's' : ''}`,
    });
  } catch (err) {
    console.error('bulkDeleteAssignments error:', err);
    return serverError(res, err as Error);
  }
}

/**
 * GET /api/chores/assignments/summary
 * Get summary counts for assignments management
 */
export async function getAssignmentsSummary(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  try {
    const [summary] = await q<
      Array<{
        totalPending: number;
        totalFuture: number;
        totalCompleted: number;
        totalSkipped: number;
      }>
    >(
      `SELECT
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as totalPending,
        SUM(CASE WHEN status = 'pending' AND dueDate >= CURDATE() THEN 1 ELSE 0 END) as totalFuture,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as totalCompleted,
        SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as totalSkipped
       FROM chore_instances`,
    );

    return success(res, { summary });
  } catch (err) {
    console.error('getAssignmentsSummary error:', err);
    return serverError(res, err as Error);
  }
}
