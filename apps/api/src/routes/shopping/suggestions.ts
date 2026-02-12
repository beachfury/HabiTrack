// apps/api/src/routes/shopping/suggestions.ts
// Smart shopping suggestions based on:
// 1. Purchase patterns (items you buy regularly)
// 2. Popularity (items frequently added to lists)
// 3. Meal planning (ingredients for upcoming meals)

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
  suggestionType: 'overdue' | 'due_soon' | 'popular' | 'meal_ingredient';
  score: number; // Internal ranking score
  // For meal suggestions
  mealDate?: string;
  mealName?: string;
}

/**
 * Core suggestion algorithm - combines multiple data sources
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
  // SOURCE 1: Pattern-based predictions (items purchased 2+ times)
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
  // SOURCE 2: Meal-based suggestions (ingredients for upcoming planned meals)
  // Look at meals planned for the next 7 days that have linked catalog items
  // ==========================================================================
  try {
    const mealIngredients = await q<
      Array<{
        catalogItemId: number;
        itemName: string;
        brand: string | null;
        imageUrl: string | null;
        categoryName: string | null;
        ingredientQuantity: number;
        mealDate: string;
        mealName: string;
      }>
    >(
      `SELECT DISTINCT
        ci.id as catalogItemId,
        ci.name as itemName,
        ci.brand,
        ci.imageUrl,
        sc.name as categoryName,
        ri.quantity as ingredientQuantity,
        mp.date as mealDate,
        COALESCE(r.name, mp.customMealName) as mealName
       FROM meal_plans mp
       JOIN recipes r ON mp.recipeId = r.id
       JOIN recipe_ingredients ri ON ri.recipeId = r.id
       JOIN catalog_items ci ON ri.catalogItemId = ci.id
       LEFT JOIN shopping_categories sc ON ci.categoryId = sc.id
       WHERE mp.date >= CURDATE()
         AND mp.date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
         AND ri.catalogItemId IS NOT NULL
         AND ci.active = 1
       ORDER BY mp.date ASC`,
    );

    for (const item of mealIngredients) {
      if (onListIds.has(item.catalogItemId)) continue;
      // Don't add if already suggested from purchase patterns
      if (suggestions.some((s) => s.catalogItemId === item.catalogItemId)) continue;

      // Get best price
      const [priceInfo] = await q<Array<{ price: number; storeId: number; storeName: string }>>(
        `SELECT ip.price, ip.storeId, s.name as storeName
         FROM item_prices ip
         JOIN stores s ON ip.storeId = s.id
         WHERE ip.catalogItemId = ?
         ORDER BY ip.price ASC
         LIMIT 1`,
        [item.catalogItemId],
      );

      // Calculate days until meal for scoring
      const mealDateObj = new Date(item.mealDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysUntilMeal = Math.ceil(
        (mealDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      suggestions.push({
        catalogItemId: item.catalogItemId,
        itemName: item.itemName,
        brand: item.brand,
        imageUrl: item.imageUrl,
        categoryName: item.categoryName,
        confidence: daysUntilMeal <= 2 ? 'high' : daysUntilMeal <= 4 ? 'medium' : 'low',
        reason: `Needed for "${item.mealName}" on ${new Date(item.mealDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`,
        daysSinceLast: null,
        avgInterval: null,
        suggestedQuantity: item.ingredientQuantity || 1,
        suggestedStoreId: priceInfo?.storeId || null,
        suggestedStoreName: priceInfo?.storeName || null,
        bestPrice: priceInfo?.price || null,
        suggestionType: 'meal_ingredient',
        score: 80 - daysUntilMeal * 10, // Closer meals score higher
        mealDate: item.mealDate,
        mealName: item.mealName,
      });
    }
  } catch {
    // Meal tables may not exist or be empty - that's ok
  }

  // ==========================================================================
  // SOURCE 3: Popular items (frequently added to lists)
  // Only add if we have fewer than 10 suggestions from patterns + meals
  // Uses actual tracked popularity, not random category guessing
  // ==========================================================================
  const patternAndMealCount = suggestions.length;

  if (patternAndMealCount < 10) {
    const limit = 10 - patternAndMealCount;

    // Get already suggested item IDs
    const suggestedIds = suggestions.map((s) => s.catalogItemId);

    try {
      const popularItems = await q<
        Array<{
          catalogItemId: number;
          itemName: string;
          brand: string | null;
          imageUrl: string | null;
          categoryName: string | null;
          addCount30Days: number;
          addCountAllTime: number;
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
          COALESCE(ip2.addCount30Days, 0) as addCount30Days,
          COALESCE(ip2.addCountAllTime, 0) as addCountAllTime,
          (SELECT MIN(ip.price) FROM item_prices ip WHERE ip.catalogItemId = ci.id) as lowestPrice,
          (SELECT s.name FROM item_prices ip3
           JOIN stores s ON ip3.storeId = s.id
           WHERE ip3.catalogItemId = ci.id
           ORDER BY ip3.price ASC LIMIT 1) as storeName,
          (SELECT ip4.storeId FROM item_prices ip4
           WHERE ip4.catalogItemId = ci.id
           ORDER BY ip4.price ASC LIMIT 1) as storeId
         FROM catalog_items ci
         LEFT JOIN shopping_categories sc ON ci.categoryId = sc.id
         LEFT JOIN item_popularity ip2 ON ci.id = ip2.catalogItemId
         WHERE ci.active = 1
           AND COALESCE(ip2.addCount30Days, 0) > 0
         ORDER BY ip2.addCount30Days DESC, ip2.addCountAllTime DESC
         LIMIT ?`,
        [limit + suggestedIds.length], // Get extra in case some are already suggested
      );

      let addedCount = 0;
      for (const item of popularItems) {
        if (addedCount >= limit) break;
        if (onListIds.has(item.catalogItemId)) continue;
        if (suggestedIds.includes(item.catalogItemId)) continue;

        suggestions.push({
          catalogItemId: item.catalogItemId,
          itemName: item.itemName,
          brand: item.brand,
          imageUrl: item.imageUrl,
          categoryName: item.categoryName,
          confidence: item.addCount30Days >= 3 ? 'medium' : 'low',
          reason: `Added ${item.addCount30Days} times recently`,
          daysSinceLast: null,
          avgInterval: null,
          suggestedQuantity: 1,
          suggestedStoreId: item.storeId,
          suggestedStoreName: item.storeName,
          bestPrice: item.lowestPrice,
          suggestionType: 'popular',
          score: 20 + item.addCount30Days * 5, // Base score + popularity bonus
        });
        addedCount++;
      }
    } catch {
      // Popularity tables may not exist yet - that's ok
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
 * Get shopping suggestions based on multiple data sources
 */
export async function getSuggestions(req: Request, res: Response) {
  try {
    const suggestions = await calculateSuggestions();

    // Calculate stats
    const highConfidence = suggestions.filter((s) => s.confidence === 'high').length;
    const mediumConfidence = suggestions.filter((s) => s.confidence === 'medium').length;
    const lowConfidence = suggestions.filter((s) => s.confidence === 'low').length;

    // Due this week = items where (avgInterval - daysSinceLast) <= 7 OR meal_ingredient
    const dueThisWeek = suggestions.filter((s) => {
      if (s.suggestionType === 'meal_ingredient') return true;
      if (s.avgInterval && s.daysSinceLast !== null) {
        const daysUntilDue = s.avgInterval - s.daysSinceLast;
        return daysUntilDue <= 7;
      }
      return false;
    });

    // Group by type for summary
    const byType = {
      overdue: suggestions.filter((s) => s.suggestionType === 'overdue').length,
      dueSoon: suggestions.filter((s) => s.suggestionType === 'due_soon').length,
      mealIngredients: suggestions.filter((s) => s.suggestionType === 'meal_ingredient').length,
      popular: suggestions.filter((s) => s.suggestionType === 'popular').length,
    };

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
        byType,
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
 */
export async function addAllSuggestions(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { confidenceLevel } = req.body; // Optional: 'high', 'medium', or 'all'

  try {
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

        // Track popularity
        try {
          await q(`INSERT INTO item_add_events (catalogItemId, addedBy) VALUES (?, ?)`, [
            item.catalogItemId,
            user.id,
          ]);
          await q(
            `INSERT INTO item_popularity (catalogItemId, addCount30Days, addCount90Days, addCountAllTime, lastAddedAt)
             VALUES (?, 1, 1, 1, NOW(3))
             ON DUPLICATE KEY UPDATE
               addCount30Days = addCount30Days + 1,
               addCount90Days = addCount90Days + 1,
               addCountAllTime = addCountAllTime + 1,
               lastAddedAt = NOW(3)`,
            [item.catalogItemId],
          );
        } catch {
          // Popularity tracking is non-fatal
        }

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

    // Track popularity
    try {
      await q(`INSERT INTO item_add_events (catalogItemId, addedBy) VALUES (?, ?)`, [
        catalogItemId,
        user.id,
      ]);
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
    } catch {
      // Popularity tracking is non-fatal
    }

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

/**
 * Scheduled task: Refresh popularity counts
 * Call this daily to keep 30/90 day counts accurate
 */
export async function refreshPopularityCounts(): Promise<void> {
  try {
    // Recalculate 30-day counts
    await q(`
      UPDATE item_popularity ip
      SET addCount30Days = (
        SELECT COUNT(*) FROM item_add_events iae
        WHERE iae.catalogItemId = ip.catalogItemId
          AND iae.addedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      )
    `);

    // Recalculate 90-day counts
    await q(`
      UPDATE item_popularity ip
      SET addCount90Days = (
        SELECT COUNT(*) FROM item_add_events iae
        WHERE iae.catalogItemId = ip.catalogItemId
          AND iae.addedAt >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      )
    `);

    console.log('[suggestions] Popularity counts refreshed');
  } catch (err) {
    console.error('[suggestions] Failed to refresh popularity counts:', err);
  }
}
