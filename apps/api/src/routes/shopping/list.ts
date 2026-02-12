// apps/api/src/routes/shopping/list.ts
// Shopping list management routes

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import { getUser, success, created, notFound, serverError, validationError } from '../../utils';
import { queueEmail, getActiveUsersWithEmail } from '../../email/queue';
import { createLogger } from '../../services/logger';

const log = createLogger('shopping');

/**
 * Track when an item is added to the shopping list
 * Used for popularity-based suggestions
 */
async function trackItemAdd(catalogItemId: number, userId: number | null): Promise<void> {
  try {
    // Log the add event
    await q(
      `INSERT INTO item_add_events (catalogItemId, addedBy) VALUES (?, ?)`,
      [catalogItemId, userId],
    );

    // Update the popularity cache (upsert)
    await q(
      `INSERT INTO item_popularity (catalogItemId, addCount30Days, addCount90Days, addCountAllTime, lastAddedAt)
       VALUES (?, 1, 1, 1, NOW(3))
       ON DUPLICATE KEY UPDATE
         addCount30Days = addCount30Days + 1,
         addCount90Days = addCount90Days + 1,
         addCountAllTime = addCountAllTime + 1,
         lastAddedAt = NOW(3)`,
      [catalogItemId],
    );
  } catch (err) {
    // Non-fatal - don't fail the main operation if tracking fails
    console.warn('[trackItemAdd] Failed to track item add:', err);
  }
}

interface ShoppingListItem {
  id: number;
  catalogItemId: number;
  itemName: string;
  brand: string | null;
  sizeText: string | null;
  categoryId: number | null;
  categoryName: string | null;
  imageUrl: string | null;
  listType: 'need' | 'want';
  quantity: number;
  storeId: number | null;
  storeName: string | null;
  storePrice: number | null;
  lowestPrice: number | null;
  purchasedToday: boolean;
}

/**
 * GET /api/shopping/list
 * Get the current shopping list
 */
export async function getShoppingList(req: Request, res: Response) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const items = await q<ShoppingListItem[]>(
      `SELECT
        sl.id, sl.catalogItemId, ci.name as itemName, ci.brand, ci.sizeText,
        ci.categoryId, sc.name as categoryName, ci.imageUrl,
        sl.listType, sl.quantity, sl.storeId, s.name as storeName,
        ip.price as storePrice,
        (SELECT MIN(price) FROM item_prices WHERE catalogItemId = ci.id) as lowestPrice,
        CASE WHEN sl.purchasedAt IS NOT NULL AND DATE(sl.purchasedAt) = ? THEN 1 ELSE 0 END as purchasedToday
       FROM shopping_list sl
       JOIN catalog_items ci ON sl.catalogItemId = ci.id
       LEFT JOIN shopping_categories sc ON ci.categoryId = sc.id
       LEFT JOIN stores s ON sl.storeId = s.id
       LEFT JOIN item_prices ip ON sl.catalogItemId = ip.catalogItemId AND sl.storeId = ip.storeId
       WHERE sl.active = 1
       ORDER BY sl.purchasedAt IS NOT NULL, sc.name, ci.name`,
      [today],
    );

    // Calculate totals
    // If a specific store is selected, use ONLY that store's price
    // Only use lowestPrice when no store is selected (storeId is null)
    const getItemPrice = (item: (typeof items)[0]) => {
      if (item.storeId) {
        // Specific store selected - use its price or 0
        return Number(item.storePrice || 0);
      }
      // Any store - use lowest price
      return Number(item.storePrice || item.lowestPrice || 0);
    };

    const activeItems = items.filter((i) => !i.purchasedToday);
    const needsOnly = activeItems
      .filter((i) => i.listType === 'need')
      .reduce((sum, i) => sum + getItemPrice(i) * i.quantity, 0);
    const needsPlusWants = activeItems.reduce((sum, i) => sum + getItemPrice(i) * i.quantity, 0);

    return success(res, {
      items,
      totals: { needsOnly, needsPlusWants },
    });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/shopping/list
 * Add an item to the shopping list
 */
export async function addToList(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { catalogItemId, listType = 'need', quantity = 1, storeId } = req.body;

  if (!catalogItemId) {
    return validationError(res, 'catalogItemId is required');
  }

  try {
    // Check if already on list
    const [existing] = await q<Array<{ id: number; quantity: number }>>(
      `SELECT id, quantity FROM shopping_list
       WHERE catalogItemId = ? AND active = 1 AND purchasedAt IS NULL`,
      [catalogItemId],
    );

    if (existing) {
      // Update quantity
      await q(`UPDATE shopping_list SET quantity = quantity + ? WHERE id = ?`, [
        quantity,
        existing.id,
      ]);
      return success(res, { id: existing.id, updated: true });
    }

    const result: any = await q(
      `INSERT INTO shopping_list (catalogItemId, listType, quantity, storeId, addedBy)
       VALUES (?, ?, ?, ?, ?)`,
      [catalogItemId, listType, quantity, storeId || null, user.id],
    );

    // Track this add event for popularity-based suggestions
    await trackItemAdd(catalogItemId, user.id);

    // Get item name for notification
    const [itemInfo] = await q<Array<{ name: string }>>(
      `SELECT name FROM catalog_items WHERE id = ?`,
      [catalogItemId],
    );

    // Send email notifications to active users who have shopping updates enabled
    const activeUsers = await getActiveUsersWithEmail();
    for (const recipient of activeUsers) {
      // Don't send to the user who added the item
      if (recipient.id !== user.id) {
        await queueEmail({
          userId: recipient.id,
          toEmail: recipient.email,
          template: 'SHOPPING_ITEM_ADDED',
          variables: {
            userName: recipient.displayName,
            itemName: itemInfo?.name || 'An item',
            addedBy: user.displayName || 'Someone',
            quantity: quantity,
            listType: listType === 'want' ? 'wants list' : 'shopping list',
          },
        });
      }
    }

    log.info('Item added to shopping list', { listItemId: result.insertId, itemName: itemInfo?.name, addedBy: user.id });

    await logAudit({
      action: 'shopping.list.add',
      result: 'ok',
      actorId: user.id,
      details: { listItemId: result.insertId, catalogItemId },
    });

    return created(res, { id: result.insertId });
  } catch (err) {
    log.error('Failed to add item to shopping list', { error: String(err) });
    return serverError(res, err as Error);
  }
}

/**
 * PUT /api/shopping/list/:id
 * Update a shopping list item
 */
export async function updateListItem(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const listItemId = parseInt(req.params.id);
  const { listType, quantity, storeId } = req.body;

  try {
    const updates: string[] = [];
    const params: any[] = [];

    if (listType !== undefined) {
      updates.push('listType = ?');
      params.push(listType);
    }
    if (quantity !== undefined) {
      updates.push('quantity = ?');
      params.push(quantity);
    }
    if (storeId !== undefined) {
      updates.push('storeId = ?');
      params.push(storeId || null);
    }

    if (updates.length === 0) {
      return validationError(res, 'No fields to update');
    }

    params.push(listItemId);
    await q(`UPDATE shopping_list SET ${updates.join(', ')} WHERE id = ?`, params);

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * DELETE /api/shopping/list/:id
 * Remove an item from the shopping list
 */
export async function removeFromList(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const listItemId = parseInt(req.params.id);

  try {
    await q(`UPDATE shopping_list SET active = 0 WHERE id = ?`, [listItemId]);

    await logAudit({
      action: 'shopping.list.remove',
      result: 'ok',
      actorId: user.id,
      details: { listItemId },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/shopping/list/:id/purchase
 * Mark an item as purchased
 */
export async function markPurchased(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const listItemId = parseInt(req.params.id);
  const { unitPrice, storeId } = req.body;

  try {
    const [item] = await q<
      Array<{
        catalogItemId: number;
        quantity: number;
        storeId: number | null;
      }>
    >(`SELECT catalogItemId, quantity, storeId FROM shopping_list WHERE id = ?`, [listItemId]);

    if (!item) {
      return notFound(res, 'List item not found');
    }

    const actualStoreId = storeId || item.storeId;

    // Look up stored price if not provided
    let price = unitPrice;
    if (price === undefined || price === null) {
      // Try to get price from item_prices table
      const [storedPrice] = await q<Array<{ price: number }>>(
        `SELECT price FROM item_prices WHERE catalogItemId = ? AND storeId = ?`,
        [item.catalogItemId, actualStoreId],
      );
      price = storedPrice?.price || 0;
    }

    // Mark as purchased - use NOW() for MySQL datetime
    await q(
      `UPDATE shopping_list
       SET purchasedAt = NOW(), purchasedBy = ?, storeId = ?
       WHERE id = ?`,
      [user.id, actualStoreId, listItemId],
    );

    // Log purchase event with the price
    await q(
      `INSERT INTO shopping_purchase_events
       (catalogItemId, storeId, quantity, price, purchasedBy, purchasedAt)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [item.catalogItemId, actualStoreId, item.quantity, price, user.id],
    );

    // Update price if provided
    if (unitPrice && actualStoreId) {
      await q(
        `INSERT INTO item_prices (catalogItemId, storeId, price, observedAt)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE price = ?, observedAt = NOW()`,
        [item.catalogItemId, actualStoreId, unitPrice, unitPrice],
      );
    }

    log.info('Item purchased', { listItemId, catalogItemId: item.catalogItemId, purchasedBy: user.id, price });

    await logAudit({
      action: 'shopping.list.purchase',
      result: 'ok',
      actorId: user.id,
      details: { listItemId, storeId: actualStoreId, unitPrice },
    });

    return success(res, { success: true });
  } catch (err) {
    log.error('Failed to mark item as purchased', { listItemId, error: String(err) });
    return serverError(res, err as Error);
  }
}

// =============================================================================
// REQUESTS, HISTORY & ANALYTICS
// =============================================================================

/**
 * GET /api/shopping/requests
 * Get item requests (for kids to request items to be added)
 */
export async function getRequests(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  try {
    const requests = await q<any[]>(
      `SELECT
        r.id, r.name, r.brand, r.categoryId, r.imageUrl,
        r.requestType, r.status, r.requestedBy, r.reviewedBy,
        r.reviewedAt, r.reviewNote, r.createdAt,
        u1.displayName as requestedByName,
        u2.displayName as reviewedByName,
        sc.name as categoryName
       FROM shopping_requests r
       LEFT JOIN users u1 ON r.requestedBy = u1.id
       LEFT JOIN users u2 ON r.reviewedBy = u2.id
       LEFT JOIN shopping_categories sc ON r.categoryId = sc.id
       WHERE r.status = 'pending' OR r.requestedBy = ?
       ORDER BY r.createdAt DESC`,
      [user.id],
    );

    return success(res, { requests });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/shopping/requests
 * Create a new item request
 */
export async function createRequest(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { name, brand, categoryId, imageUrl, requestType = 'need' } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 1) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Name is required' } });
  }

  try {
    const result: any = await q(
      `INSERT INTO shopping_requests (name, brand, categoryId, imageUrl, requestType, requestedBy, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [name.trim(), brand || null, categoryId || null, imageUrl || null, requestType, user.id],
    );

    return res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/shopping/requests/:id/approve
 * Approve an item request (admin only)
 */
export async function approveRequest(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });
  if (user.roleId !== 'admin') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
  }

  const requestId = parseInt(req.params.id);

  try {
    await q(
      `UPDATE shopping_requests
       SET status = 'approved', reviewedBy = ?, reviewedAt = NOW()
       WHERE id = ?`,
      [user.id, requestId],
    );

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/shopping/requests/:id/deny
 * Deny an item request (admin only)
 */
export async function denyRequest(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });
  if (user.roleId !== 'admin') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
  }

  const requestId = parseInt(req.params.id);
  const { reason } = req.body;

  try {
    await q(
      `UPDATE shopping_requests
       SET status = 'denied', reviewedBy = ?, reviewedAt = NOW(), reviewNote = ?
       WHERE id = ?`,
      [user.id, reason || null, requestId],
    );

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * GET /api/shopping/history
 * Get purchase history
 */
export async function getHistory(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const days = parseInt(req.query.days as string) || 30;

  try {
    const purchases = await q<any[]>(
      `SELECT
        spe.id,
        spe.catalogItemId,
        spe.quantity,
        spe.price as unitPrice,
        (spe.price * spe.quantity) as totalPrice,
        spe.purchasedAt,
        ci.name as itemName,
        ci.brand,
        ci.imageUrl,
        sc.name as categoryName,
        s.name as storeName,
        u.displayName as purchasedByName
       FROM shopping_purchase_events spe
       JOIN catalog_items ci ON spe.catalogItemId = ci.id
       LEFT JOIN shopping_categories sc ON ci.categoryId = sc.id
       LEFT JOIN stores s ON spe.storeId = s.id
       LEFT JOIN users u ON spe.purchasedBy = u.id
       WHERE spe.purchasedAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
       ORDER BY spe.purchasedAt DESC`,
      [days],
    );

    return success(res, { purchases });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * GET /api/shopping/analytics
 * Get shopping analytics/stats
 */
export async function getAnalytics(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const days = parseInt(req.query.days as string) || 30;

  try {
    // Total spent
    const [spentResult] = await q<Array<{ total: number }>>(
      `SELECT COALESCE(SUM(price * quantity), 0) as total
       FROM shopping_purchase_events
       WHERE purchasedAt >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days],
    );

    // Purchase count
    const [countResult] = await q<Array<{ count: number }>>(
      `SELECT COUNT(*) as count
       FROM shopping_purchase_events
       WHERE purchasedAt >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days],
    );

    // Category spending (format: { categoryName, total, count })
    const categorySpending = await q<Array<{ categoryName: string; total: number; count: number }>>(
      `SELECT
        COALESCE(sc.name, 'Uncategorized') as categoryName,
        COALESCE(SUM(spe.price * spe.quantity), 0) as total,
        COUNT(spe.id) as count
       FROM shopping_purchase_events spe
       JOIN catalog_items ci ON spe.catalogItemId = ci.id
       LEFT JOIN shopping_categories sc ON ci.categoryId = sc.id
       WHERE spe.purchasedAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY ci.categoryId
       ORDER BY total DESC`,
      [days],
    );

    const totalSpent = spentResult?.total || 0;
    const purchaseCount = countResult?.count || 0;

    return success(res, {
      totalSpent,
      purchaseCount,
      categorySpending,
    });
  } catch (err) {
    return serverError(res, err as Error);
  }
}
