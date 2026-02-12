// apps/api/src/routes/shopping/catalog.ts
// Shopping catalog (items and prices) routes

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import {
  getUser,
  isValidString,
  success,
  created,
  notFound,
  serverError,
  validationError,
} from '../../utils';
import { createLogger } from '../../services/logger';

const log = createLogger('shopping');

interface CatalogItem {
  id: number;
  name: string;
  brand: string | null;
  sizeText: string | null;
  categoryId: number | null;
  categoryName: string | null;
  imageUrl: string | null;
  lowestPrice: number | null;
  lowestPriceStore: string | null;
}

interface ItemPrice {
  storeId: number;
  storeName: string;
  price: number;
  unit: string | null;
  observedAt: string;
}

/**
 * GET /api/shopping/catalog
 * Get catalog items with optional search
 */
export async function getCatalogItems(req: Request, res: Response) {
  const { search, categoryId, limit = '100' } = req.query;

  try {
    let whereClause = 'WHERE ci.active = 1';
    const params: any[] = [];

    if (search && typeof search === 'string' && search.trim()) {
      whereClause += ` AND (ci.name LIKE ? OR ci.brand LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
    }

    if (categoryId) {
      whereClause += ` AND ci.categoryId = ?`;
      params.push(categoryId);
    }

    params.push(parseInt(limit as string));

    const items = await q<CatalogItem[]>(
      `SELECT
        ci.id, ci.name, ci.brand, ci.sizeText, ci.categoryId,
        sc.name as categoryName, ci.imageUrl,
        (SELECT MIN(price) FROM item_prices WHERE catalogItemId = ci.id) as lowestPrice,
        (SELECT s.name FROM item_prices ip
         JOIN stores s ON ip.storeId = s.id
         WHERE ip.catalogItemId = ci.id
         ORDER BY ip.price ASC LIMIT 1) as lowestPriceStore
       FROM catalog_items ci
       LEFT JOIN shopping_categories sc ON ci.categoryId = sc.id
       ${whereClause}
       ORDER BY ci.name
       LIMIT ?`,
      params,
    );

    return success(res, { items });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * GET /api/shopping/catalog/:id
 * Get a single catalog item
 */
export async function getCatalogItem(req: Request, res: Response) {
  const itemId = parseInt(req.params.id);

  try {
    const [item] = await q<CatalogItem[]>(
      `SELECT
        ci.id, ci.name, ci.brand, ci.sizeText, ci.categoryId,
        sc.name as categoryName, ci.imageUrl,
        (SELECT MIN(price) FROM item_prices WHERE catalogItemId = ci.id) as lowestPrice,
        (SELECT s.name FROM item_prices ip
         JOIN stores s ON ip.storeId = s.id
         WHERE ip.catalogItemId = ci.id
         ORDER BY ip.price ASC LIMIT 1) as lowestPriceStore
       FROM catalog_items ci
       LEFT JOIN shopping_categories sc ON ci.categoryId = sc.id
       WHERE ci.id = ?`,
      [itemId],
    );

    if (!item) {
      return notFound(res, 'Catalog item not found');
    }

    return success(res, { item });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * GET /api/shopping/catalog/:id/prices
 * Get prices for a catalog item at different stores
 */
export async function getCatalogItemPrices(req: Request, res: Response) {
  const itemId = parseInt(req.params.id);

  try {
    const prices = await q<ItemPrice[]>(
      `SELECT ip.storeId, s.name as storeName, ip.price, ip.unit, ip.observedAt
       FROM item_prices ip
       JOIN stores s ON ip.storeId = s.id
       WHERE ip.catalogItemId = ?
       ORDER BY ip.price ASC`,
      [itemId],
    );

    return success(res, { prices });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/shopping/catalog
 * Create a new catalog item (admin only)
 */
export async function createCatalogItem(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { name, brand, sizeText, categoryId, imageUrl, prices } = req.body;

  if (!isValidString(name, 2)) {
    return validationError(res, 'Name is required (min 2 characters)');
  }

  try {
    const result: any = await q(
      `INSERT INTO catalog_items (name, brand, sizeText, categoryId, imageUrl)
       VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), brand || null, sizeText || null, categoryId || null, imageUrl || null],
    );

    const itemId = result.insertId;

    // Add prices if provided
    if (prices && Array.isArray(prices)) {
      for (const p of prices) {
        if (p.storeId && p.price) {
          await q(
            `INSERT INTO item_prices (catalogItemId, storeId, price, unit)
             VALUES (?, ?, ?, ?)`,
            [itemId, p.storeId, p.price, p.unit || null],
          );
        }
      }
    }

    await logAudit({
      action: 'shopping.catalog.create',
      result: 'ok',
      actorId: user.id,
      details: { itemId, name: name.trim() },
    });

    return created(res, { id: itemId });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * PUT /api/shopping/catalog/:id
 * Update a catalog item (admin only)
 */
export async function updateCatalogItem(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const itemId = parseInt(req.params.id);
  const { name, brand, sizeText, categoryId, imageUrl } = req.body;

  try {
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name.trim());
    }
    if (brand !== undefined) {
      updates.push('brand = ?');
      params.push(brand || null);
    }
    if (sizeText !== undefined) {
      updates.push('sizeText = ?');
      params.push(sizeText || null);
    }
    if (categoryId !== undefined) {
      updates.push('categoryId = ?');
      params.push(categoryId || null);
    }
    if (imageUrl !== undefined) {
      updates.push('imageUrl = ?');
      params.push(imageUrl || null);
    }

    if (updates.length === 0) {
      return validationError(res, 'No fields to update');
    }

    params.push(itemId);
    await q(`UPDATE catalog_items SET ${updates.join(', ')} WHERE id = ?`, params);

    await logAudit({
      action: 'shopping.catalog.update',
      result: 'ok',
      actorId: user.id,
      details: { itemId, updates: req.body },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * DELETE /api/shopping/catalog/:id
 * Delete a catalog item (admin only)
 */
export async function deleteCatalogItem(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const itemId = parseInt(req.params.id);

  try {
    await q(`UPDATE catalog_items SET active = 0 WHERE id = ?`, [itemId]);

    await logAudit({
      action: 'shopping.catalog.delete',
      result: 'ok',
      actorId: user.id,
      details: { itemId },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/shopping/catalog/:id/prices
 * Add or update a price for a catalog item
 */
export async function setCatalogItemPrice(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const itemId = parseInt(req.params.id);
  const { storeId, price, unit } = req.body;

  if (!storeId || price === undefined) {
    return validationError(res, 'storeId and price are required');
  }

  try {
    // Upsert the price
    await q(
      `INSERT INTO item_prices (catalogItemId, storeId, price, unit, observedAt)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE price = ?, unit = ?, observedAt = NOW()`,
      [itemId, storeId, price, unit || null, price, unit || null],
    );

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}
