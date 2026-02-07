// apps/api/src/routes/shopping/stores.ts
// Shopping stores and categories routes

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import { createNotification } from '../messages';
import {
  getUser,
  isValidString,
  success,
  created,
  duplicate,
  serverError,
  validationError,
} from '../../utils';

// =============================================================================
// CATEGORIES
// =============================================================================

/**
 * GET /api/shopping/categories
 */
export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await q<Array<{ id: number; name: string; color: string | null }>>(
      `SELECT id, name, color FROM shopping_categories WHERE active = 1 ORDER BY name`,
    );
    return success(res, { categories });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/shopping/categories (admin only)
 */
export async function createCategory(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { name, color } = req.body;

  if (!isValidString(name, 2)) {
    return validationError(res, 'Category name is required (min 2 characters)');
  }

  try {
    const result: any = await q(
      `INSERT INTO shopping_categories (name, color) VALUES (?, ?)`,
      [name.trim(), color || '#f97316'],
    );

    await logAudit({
      action: 'shopping.category.create',
      result: 'ok',
      actorId: user.id,
      details: { categoryId: result.insertId, name: name.trim(), color },
    });

    return created(res, { category: { id: result.insertId, name: name.trim(), color: color || '#f97316' } });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return duplicate(res, 'Category already exists');
    }
    return serverError(res, err);
  }
}

/**
 * PUT /api/shopping/categories/:id (admin only)
 */
export async function updateCategory(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const categoryId = parseInt(req.params.id);
  const { name, color } = req.body;

  if (!categoryId || isNaN(categoryId)) {
    return validationError(res, 'Invalid category ID');
  }

  try {
    // Check if category exists
    const [existing] = await q<Array<{ id: number }>>(
      'SELECT id FROM shopping_categories WHERE id = ?',
      [categoryId],
    );

    if (!existing) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Category not found' } });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      if (!isValidString(name, 2)) {
        return validationError(res, 'Category name must be at least 2 characters');
      }
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (color !== undefined) {
      updates.push('color = ?');
      values.push(color);
    }

    if (updates.length === 0) {
      return validationError(res, 'No fields to update');
    }

    values.push(categoryId);

    await q(`UPDATE shopping_categories SET ${updates.join(', ')} WHERE id = ?`, values);

    await logAudit({
      action: 'shopping.category.update',
      result: 'ok',
      actorId: user.id,
      details: { categoryId, name, color },
    });

    return success(res, { success: true });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return duplicate(res, 'Category name already exists');
    }
    return serverError(res, err);
  }
}

/**
 * DELETE /api/shopping/categories/:id (admin only)
 */
export async function deleteCategory(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const categoryId = parseInt(req.params.id);

  if (!categoryId || isNaN(categoryId)) {
    return validationError(res, 'Invalid category ID');
  }

  try {
    // Check if category has items
    const [itemCount] = await q<Array<{ count: number }>>(
      'SELECT COUNT(*) as count FROM catalog_items WHERE categoryId = ?',
      [categoryId],
    );

    if (itemCount && itemCount.count > 0) {
      return res.status(400).json({
        error: {
          code: 'HAS_ITEMS',
          message: 'Cannot delete category with items. Move or delete items first.',
        },
      });
    }

    const result: any = await q('DELETE FROM shopping_categories WHERE id = ?', [categoryId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Category not found' } });
    }

    await logAudit({
      action: 'shopping.category.delete',
      result: 'ok',
      actorId: user.id,
      details: { categoryId },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

// =============================================================================
// STORES
// =============================================================================

/**
 * GET /api/shopping/stores
 */
export async function getStores(req: Request, res: Response) {
  try {
    const stores = await q<Array<{ id: number; name: string }>>(
      `SELECT id, name FROM stores WHERE active = 1 ORDER BY name`,
    );
    return success(res, { stores });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/shopping/stores (admin only)
 */
export async function createStore(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { name } = req.body;

  if (!isValidString(name, 2)) {
    return validationError(res, 'Store name is required (min 2 characters)');
  }

  try {
    const result: any = await q(`INSERT INTO stores (name) VALUES (?)`, [name.trim()]);

    await logAudit({
      action: 'shopping.store.create',
      result: 'ok',
      actorId: user.id,
      details: { storeId: result.insertId, name: name.trim() },
    });

    return created(res, { store: { id: result.insertId, name: name.trim() } });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return duplicate(res, 'Store already exists');
    }
    return serverError(res, err);
  }
}

// =============================================================================
// STORE REQUESTS
// =============================================================================

/**
 * POST /api/shopping/stores/request
 */
export async function requestStore(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { name } = req.body;

  if (!isValidString(name, 2)) {
    return validationError(res, 'Store name is required (min 2 characters)');
  }

  try {
    // Check if store already exists
    const [existing] = await q<Array<{ id: number }>>(
      `SELECT id FROM stores WHERE LOWER(name) = LOWER(?) AND active = 1`,
      [name.trim()],
    );

    if (existing) {
      return duplicate(res, 'Store already exists');
    }

    // Check for pending request
    const [pendingRequest] = await q<Array<{ id: number }>>(
      `SELECT id FROM store_requests WHERE LOWER(name) = LOWER(?) AND status = 'pending'`,
      [name.trim()],
    );

    if (pendingRequest) {
      return duplicate(res, 'Store request already pending');
    }

    const result: any = await q(`INSERT INTO store_requests (name, requestedBy) VALUES (?, ?)`, [
      name.trim(),
      user.id,
    ]);

    // Notify admins
    const admins = await q<Array<{ id: number }>>(
      `SELECT id FROM users WHERE roleId = 'admin' AND active = 1`,
    );
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'system',
        title: 'New store request',
        body: `${user.displayName} requested to add "${name.trim()}"`,
        link: '/shopping?tab=manage',
        relatedId: result.insertId,
        relatedType: 'store_request',
      });
    }

    return created(res, { request: { id: result.insertId, name: name.trim(), status: 'pending' } });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * GET /api/shopping/stores/requests
 */
export async function getStoreRequests(req: Request, res: Response) {
  try {
    const requests = await q<
      Array<{
        id: number;
        name: string;
        status: string;
        requestedBy: number;
        requestedByName: string;
        createdAt: string;
      }>
    >(
      `SELECT sr.id, sr.name, sr.status, sr.requestedBy, u.displayName as requestedByName, sr.createdAt
       FROM store_requests sr
       JOIN users u ON sr.requestedBy = u.id
       WHERE sr.status = 'pending'
       ORDER BY sr.createdAt DESC`,
    );

    return success(res, { requests });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/shopping/stores/requests/:id/approve
 */
export async function approveStoreRequest(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const requestId = parseInt(req.params.id);

  try {
    const [request] = await q<Array<{ name: string; requestedBy: number }>>(
      `SELECT name, requestedBy FROM store_requests WHERE id = ?`,
      [requestId],
    );

    if (!request) {
      return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    }

    // Create the store
    const result: any = await q(`INSERT INTO stores (name) VALUES (?)`, [request.name]);

    // Update request status
    await q(`UPDATE store_requests SET status = 'approved' WHERE id = ?`, [requestId]);

    // Notify requester
    await createNotification({
      userId: request.requestedBy,
      type: 'system',
      title: 'Store request approved',
      body: `"${request.name}" has been added as a store`,
      link: '/shopping',
    });

    await logAudit({
      action: 'shopping.store.approve_request',
      result: 'ok',
      actorId: user.id,
      details: { requestId, storeId: result.insertId, name: request.name },
    });

    return success(res, { store: { id: result.insertId, name: request.name } });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/shopping/stores/requests/:id/deny
 */
export async function denyStoreRequest(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const requestId = parseInt(req.params.id);

  try {
    const [request] = await q<Array<{ name: string; requestedBy: number }>>(
      `SELECT name, requestedBy FROM store_requests WHERE id = ?`,
      [requestId],
    );

    if (!request) {
      return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    }

    await q(`UPDATE store_requests SET status = 'denied' WHERE id = ?`, [requestId]);

    // Notify requester
    await createNotification({
      userId: request.requestedBy,
      type: 'system',
      title: 'Store request denied',
      body: `Your request for "${request.name}" was not approved`,
      link: '/shopping',
    });

    await logAudit({
      action: 'shopping.store.deny_request',
      result: 'ok',
      actorId: user.id,
      details: { requestId, name: request.name },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}
