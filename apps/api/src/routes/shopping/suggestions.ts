// apps/api/src/routes/shopping/suggestions.ts
// Unified algorithmic shopping suggestions/predictions

import type { Request, Response } from 'express';
import { q } from '../../db';
import { getUser, success, serverError } from '../../utils';

interface Suggestion {
  catalogItemId: number;
  itemName: string;
  brand: string | null;
  imageUrl: string | null;
  categoryName: string | null;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  daysSinceLast: number | null;
  avgInterval: number | null;
  suggestedQuantity: number;
  suggestedStoreId: number | null;
  suggestedStoreName: string | null;
  bestPrice: number | null;
  suggestionType: 'overdue' | 'due_soon' | 'popular' | 'frequently_bought';
  score: number; // Internal ranking score
}

/**
 * Core suggestion algorithm - used by both GET and POST endpoints
 * Returns a consistent list of suggestions based on purchase patterns
 */
async function calculateSuggestions(): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];

  // Get items already on the shopping list (to exclude)
  const onList = await q<Array<{ catalogItemId: number }>>(
    `SELECT catalogItemId FROM shopping_list
     WHERE active = 1 AND purchasedAt IS NULL`,
  );
  const onListIds = new Set(onList.map((i) => i.catalogItemId));

  // ==========================================================================
  // ALGORITHM STEP 1: Pattern-based predictions (items purchased 2+ times)
  // Score = (daysSinceLast / avgInterval) - higher means more overdue
  // ==========================================================================
  const patternItems = await q<
    Array<{
      catalogItemId: number;
      itemName: string;
      brand: string | null;
      imageUrl: string | null;
      categoryName: string | null;
      purchaseCount: number;
      avgInterval: number;
      daysSinceLast: number;
      avgQuantity: number;
    }>
  >(
    `SELECT * FROM (
      SELECT
        ci.id as catalogItemId,
        ci.name as itemName,
        ci.brand,
        ci.imageUrl,
        sc.name as categoryName,
        COUNT(spe.id) as purchaseCount,
        AVG(DATEDIFF(
          spe.purchasedAt,
          (SELECT MAX(spe2.purchasedAt)
           FROM shopping_purchase_events spe2
           WHERE spe2.catalogItemId = ci.id AND spe2.purchasedAt < spe.purchasedAt)
        )) as avgInterval,
        DATEDIFF(NOW(), MAX(spe.purchasedAt)) as daysSinceLast,
        ROUND(AVG(spe.quantity)) as avgQuantity
       FROM catalog_items ci
       JOIN shopping_purchase_events spe ON ci.id = spe.catalogItemId
       LEFT JOIN shopping_categories sc ON ci.categoryId = sc.id
       WHERE ci.active = 1
       GROUP BY ci.id
       HAVING purchaseCount >= 2 AND avgInterval IS NOT NULL AND avgInterval > 0
     ) AS sub
     ORDER BY (sub.daysSinceLast / sub.avgInterval) DESC
     LIMIT 20`,
  );

  for (const item of patternItems) {
    if (onListIds.has(item.catalogItemId)) continue;

    const ratio = item.daysSinceLast / item.avgInterval;
    let confidence: 'high' | 'medium' | 'low';
    let suggestionType: 'overdue' | 'due_soon';
    let reason: string;

    if (ratio >= 1.2) {
      confidence = 'high';
      suggestionType = 'overdue';
      reason = `Overdue! Usually buy every ${Math.round(item.avgInterval)} days, last purchased ${item.daysSinceLast} days ago`;
    } else if (ratio >= 0.8) {
      confidence = 'medium';
      suggestionType = 'due_soon';
      reason = `Due soon - usually buy every ${Math.round(item.avgInterval)} days`;
    } else if (ratio >= 0.5) {
      confidence = 'low';
      suggestionType = 'due_soon';
      reason = `Coming up - bought ${item.purchaseCount} times, avg every ${Math.round(item.avgInterval)} days`;
    } else {
      continue; // Not due yet, skip
    }

    // Get best price for this item
    const [priceInfo] = await q<Array<{ price: number; storeId: number; storeName: string }>>(
      `SELECT ip.price, ip.storeId, s.name as storeName
       FROM item_prices ip
       JOIN stores s ON ip.storeId = s.id
       WHERE ip.catalogItemId = ?
       ORDER BY ip.price ASC
       LIMIT 1`,
      [item.catalogItemId],
    );

    suggestions.push({
      catalogItemId: item.catalogItemId,
      itemName: item.itemName,
      brand: item.brand,
      imageUrl: item.imageUrl,
      categoryName: item.categoryName,
      confidence,
      reason,
      daysSinceLast: item.daysSinceLast,
      avgInterval: Math.round(item.avgInterval),
      suggestedQuantity: item.avgQuantity || 1,
      suggestedStoreId: priceInfo?.storeId || null,
      suggestedStoreName: priceInfo?.storeName || null,
      bestPrice: priceInfo?.price || null,
      suggestionType,
      score: ratio * 100, // Higher score = more urgent
    });
  }

  // ==========================================================================
  // ALGORITHM STEP 2: Single-purchase items (bought once, might need again)
  // Only include if purchased 14+ days ago
  // ==========================================================================
  const singlePurchaseItems = await q<
    Array<{
      catalogItemId: number;
      itemName: string;
      brand: string | null;
      imageUrl: string | null;
      categoryName: string | null;
      daysSinceLast: number;
      quantity: number;
      storeId: number | null;
      storeName: string | null;
    }>
  >(
    `SELECT
      ci.id as catalogItemId,
      ci.name as itemName,
      ci.brand,
      ci.imageUrl,
      sc.name as categoryName,
      DATEDIFF(NOW(), MAX(spe.purchasedAt)) as daysSinceLast,
      spe.quantity,
      spe.storeId,
      s.name as storeName
     FROM catalog_items ci
     JOIN shopping_purchase_events spe ON ci.id = spe.catalogItemId
     LEFT JOIN shopping_categories sc ON ci.categoryId = sc.id
     LEFT JOIN stores s ON spe.storeId = s.id
     WHERE ci.active = 1
     GROUP BY ci.id
     HAVING COUNT(spe.id) = 1 AND daysSinceLast >= 14
     ORDER BY daysSinceLast DESC
     LIMIT 5`,
  );

  for (const item of singlePurchaseItems) {
    if (onListIds.has(item.catalogItemId)) continue;
    if (suggestions.some((s) => s.catalogItemId === item.catalogItemId)) continue;

    suggestions.push({
      catalogItemId: item.catalogItemId,
      itemName: item.itemName,
      brand: item.brand,
      imageUrl: item.imageUrl,
      categoryName: item.categoryName,
      confidence: 'low',
      reason: `Purchased ${item.daysSinceLast} days ago - might need again?`,
      daysSinceLast: item.daysSinceLast,
      avgInterval: null,
      suggestedQuantity: item.quantity || 1,
      suggestedStoreId: item.storeId,
      suggestedStoreName: item.storeName,
      bestPrice: null,
      suggestionType: 'frequently_bought',
      score: 10 + item.daysSinceLast / 7, // Low base score
    });
  }

  // ==========================================================================
  // ALGORITHM STEP 3: Popular staples (for new users with few purchases)
  // Only add if we have fewer than 5 pattern-based suggestions
  // ==========================================================================
  const patternCount = suggestions.filter(
    (s) => s.suggestionType === 'overdue' || s.suggestionType === 'due_soon',
  ).length;

  if (patternCount < 5) {
    const limit = 5 - patternCount;

    const popularItems = await q<
      Array<{
        catalogItemId: number;
        itemName: string;
        brand: string | null;
        imageUrl: string | null;
        categoryName: string | null;
        lowestPrice: number | null;
        storeName: string | null;
        storeId: number | null;
      }>
    >(
      `SELECT
        ci.id as catalogItemId,
        ci.name as itemName,
        ci.brand,
        ci.imageUrl,
        sc.name as categoryName,
        (SELECT MIN(ip.price) FROM item_prices ip WHERE ip.catalogItemId = ci.id) as lowestPrice,
        (SELECT s.name FROM item_prices ip2
         JOIN stores s ON ip2.storeId = s.id
         WHERE ip2.catalogItemId = ci.id
         ORDER BY ip2.price ASC LIMIT 1) as storeName,
        (SELECT ip3.storeId FROM item_prices ip3
         WHERE ip3.catalogItemId = ci.id
         ORDER BY ip3.price ASC LIMIT 1) as storeId
       FROM catalog_items ci
       LEFT JOIN shopping_categories sc ON ci.categoryId = sc.id
       WHERE ci.active = 1
         AND ci.id NOT IN (SELECT DISTINCT catalogItemId FROM shopping_purchase_events)
         AND sc.name IN ('Dairy', 'Produce', 'Bakery', 'Beverages', 'Pantry')
       ORDER BY ci.id
       LIMIT ?`,
      [limit],
    );

    for (const item of popularItems) {
      if (onListIds.has(item.catalogItemId)) continue;
      if (suggestions.some((s) => s.catalogItemId === item.catalogItemId)) continue;

      suggestions.push({
        catalogItemId: item.catalogItemId,
        itemName: item.itemName,
        brand: item.brand,
        imageUrl: item.imageUrl,
        categoryName: item.categoryName,
        confidence: 'low',
        reason: 'Popular staple item',
        daysSinceLast: null,
        avgInterval: null,
        suggestedQuantity: 1,
        suggestedStoreId: item.storeId,
        suggestedStoreName: item.storeName,
        bestPrice: item.lowestPrice,
        suggestionType: 'popular',
        score: 5, // Lowest priority
      });
    }
  }

  // ==========================================================================
  // FINAL: Sort by score (highest first) and return
  // ==========================================================================
  suggestions.sort((a, b) => b.score - a.score);

  return suggestions;
}

/**
 * GET /api/shopping/suggestions
 * Get shopping suggestions based on purchase history
 */
export async function getSuggestions(req: Request, res: Response) {
  try {
    const suggestions = await calculateSuggestions();

    // Calculate stats
    const highConfidence = suggestions.filter((s) => s.confidence === 'high').length;
    const mediumConfidence = suggestions.filter((s) => s.confidence === 'medium').length;
    const lowConfidence = suggestions.filter((s) => s.confidence === 'low').length;

    // Due this week = items where (avgInterval - daysSinceLast) <= 7
    const dueThisWeek = suggestions.filter((s) => {
      if (s.avgInterval && s.daysSinceLast !== null) {
        const daysUntilDue = s.avgInterval - s.daysSinceLast;
        return daysUntilDue <= 7;
      }
      return false;
    });

    // Remove internal score before sending to client
    const clientSuggestions = suggestions.map(({ score, ...rest }) => rest);
    const clientDueThisWeek = dueThisWeek.map(({ score, ...rest }) => rest);

    return success(res, {
      suggestions: clientSuggestions,
      dueThisWeek: clientDueThisWeek,
      stats: {
        totalSuggestions: suggestions.length,
        highConfidence,
        mediumConfidence,
        lowConfidence,
        dueThisWeekCount: dueThisWeek.length,
      },
    });
  } catch (err) {
    console.error('getSuggestions error:', err);
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/shopping/suggestions/add-all
 * Add all suggestions to shopping list
 * Uses the SAME algorithm as getSuggestions for consistency
 */
export async function addAllSuggestions(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { confidenceLevel } = req.body; // Optional: 'high', 'medium', or 'all'

  try {
    // Use the same algorithm
    let suggestions = await calculateSuggestions();

    // Filter by confidence if specified
    if (confidenceLevel === 'high') {
      suggestions = suggestions.filter((s) => s.confidence === 'high');
    } else if (confidenceLevel === 'medium') {
      suggestions = suggestions.filter((s) => s.confidence === 'high' || s.confidence === 'medium');
    }
    // 'all' or undefined = add everything

    // Add each item to the shopping list
    let addedCount = 0;
    for (const item of suggestions) {
      try {
        await q(
          `INSERT INTO shopping_list (catalogItemId, listType, quantity, storeId, addedBy)
           VALUES (?, 'need', ?, ?, ?)`,
          [item.catalogItemId, item.suggestedQuantity, item.suggestedStoreId, user.id],
        );
        addedCount++;
      } catch (insertErr) {
        // Item might already be on list or other constraint violation
        console.error('Failed to add suggestion:', item.catalogItemId, insertErr);
      }
    }

    return success(res, {
      success: true,
      addedCount,
      message:
        addedCount > 0
          ? `Added ${addedCount} item${addedCount !== 1 ? 's' : ''} to your shopping list`
          : 'No new items to add',
    });
  } catch (err) {
    console.error('addAllSuggestions error:', err);
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/shopping/suggestions/:id/add
 * Add a single suggestion to shopping list
 */
export async function addSuggestion(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const catalogItemId = parseInt(req.params.id);
  const { quantity, storeId } = req.body;

  try {
    // Check if already on list
    const [existing] = await q<Array<{ id: number }>>(
      `SELECT id FROM shopping_list
       WHERE catalogItemId = ? AND active = 1 AND purchasedAt IS NULL`,
      [catalogItemId],
    );

    if (existing) {
      return success(res, { id: existing.id, alreadyOnList: true });
    }

    // Get suggested values if not provided
    let finalQuantity = quantity;
    let finalStoreId = storeId;

    if (!finalQuantity || !finalStoreId) {
      // Look up from purchase history
      const [purchaseInfo] = await q<Array<{ avgQuantity: number; lastStoreId: number | null }>>(
        `SELECT
          ROUND(AVG(quantity)) as avgQuantity,
          (SELECT storeId FROM shopping_purchase_events
           WHERE catalogItemId = ? ORDER BY purchasedAt DESC LIMIT 1) as lastStoreId
         FROM shopping_purchase_events
         WHERE catalogItemId = ?`,
        [catalogItemId, catalogItemId],
      );

      if (!finalQuantity) finalQuantity = purchaseInfo?.avgQuantity || 1;

      // Get best price store if no store specified
      if (!finalStoreId) {
        const [bestPrice] = await q<Array<{ storeId: number }>>(
          `SELECT storeId FROM item_prices WHERE catalogItemId = ? ORDER BY price ASC LIMIT 1`,
          [catalogItemId],
        );
        finalStoreId = bestPrice?.storeId || purchaseInfo?.lastStoreId || null;
      }
    }

    const result: any = await q(
      `INSERT INTO shopping_list (catalogItemId, listType, quantity, storeId, addedBy)
       VALUES (?, 'need', ?, ?, ?)`,
      [catalogItemId, finalQuantity, finalStoreId, user.id],
    );

    return success(res, {
      id: result.insertId,
      quantity: finalQuantity,
      storeId: finalStoreId,
    });
  } catch (err) {
    console.error('addSuggestion error:', err);
    return serverError(res, err as Error);
  }
}
