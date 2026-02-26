// apps/api/src/routes/shopping/suggestions.ts
// Smart shopping suggestions based on:
// 1. Purchase patterns (items you buy regularly) — weighted intervals, variance-adjusted confidence
// 2. Meal planning (ingredients for upcoming meals)
// 3. Popular items (frequently purchased, dynamic exclusion window)
// 4. Co-purchase boosting (frequently bought together)
// 5. Trending items (added by multiple users, never purchased)
// + Shopping day detection for score boosting
// + Single-purchase items as low-confidence suggestions

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
  suggestionType: 'overdue' | 'due_soon' | 'popular' | 'meal_ingredient' | 'co_purchase' | 'trending';
  score: number; // Internal ranking score
  // For meal suggestions
  mealDate?: string;
  mealName?: string;
}

// =============================================================================
// HELPER: Get best price info for a catalog item
// =============================================================================
async function getBestPrice(
  catalogItemId: number,
): Promise<{ price: number; storeId: number; storeName: string } | null> {
  const [info] = await q<Array<{ price: number; storeId: number; storeName: string }>>(
    `SELECT ip.price, ip.storeId, s.name as storeName
     FROM item_prices ip
     JOIN stores s ON ip.storeId = s.id
     WHERE ip.catalogItemId = ?
     ORDER BY ip.price ASC
     LIMIT 1`,
    [catalogItemId],
  );
  return info || null;
}

// =============================================================================
// HELPER: Calculate weighted average interval using exponential decay
// More recent intervals get higher weight. Uses last 5 intervals max.
// =============================================================================
function calcWeightedInterval(purchaseDates: string[]): {
  weightedAvg: number;
  stddev: number;
  intervalCount: number;
} {
  if (purchaseDates.length < 2) {
    return { weightedAvg: 0, stddev: 0, intervalCount: 0 };
  }

  // Sort dates ascending (oldest first)
  const sorted = purchaseDates
    .map((d) => new Date(d).getTime())
    .sort((a, b) => a - b);

  // Calculate intervals between consecutive purchases
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const days = (sorted[i] - sorted[i - 1]) / (1000 * 60 * 60 * 24);
    if (days > 0) intervals.push(days);
  }

  if (intervals.length === 0) {
    return { weightedAvg: 0, stddev: 0, intervalCount: 0 };
  }

  // Use last 5 intervals max (most recent patterns)
  const recentIntervals = intervals.slice(-5);

  // Exponential decay weights: most recent interval gets highest weight
  // Weights: [0.1, 0.15, 0.2, 0.25, 0.3] for 5 intervals (newest = 0.3)
  const decayFactor = 0.6; // Each older interval gets 60% the weight of the next newer one
  const n = recentIntervals.length;
  const rawWeights: number[] = [];
  for (let i = 0; i < n; i++) {
    rawWeights.push(Math.pow(decayFactor, n - 1 - i));
  }
  const weightSum = rawWeights.reduce((s, w) => s + w, 0);
  const weights = rawWeights.map((w) => w / weightSum);

  // Weighted average
  let weightedAvg = 0;
  for (let i = 0; i < n; i++) {
    weightedAvg += recentIntervals[i] * weights[i];
  }

  // Standard deviation (unweighted, for variance assessment)
  const mean = recentIntervals.reduce((s, v) => s + v, 0) / n;
  const variance = recentIntervals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
  const stddev = Math.sqrt(variance);

  return { weightedAvg, stddev, intervalCount: intervals.length };
}

// =============================================================================
// HELPER: Calculate weighted average quantity (recent purchases weighted more)
// =============================================================================
function calcWeightedQuantity(quantities: number[]): number {
  if (quantities.length === 0) return 1;
  if (quantities.length === 1) return quantities[0];

  // Last 5 quantities, most recent gets highest weight
  const recent = quantities.slice(-5);
  const decayFactor = 0.6;
  const n = recent.length;
  const rawWeights: number[] = [];
  for (let i = 0; i < n; i++) {
    rawWeights.push(Math.pow(decayFactor, n - 1 - i));
  }
  const weightSum = rawWeights.reduce((s, w) => s + w, 0);

  let weightedQty = 0;
  for (let i = 0; i < n; i++) {
    weightedQty += recent[i] * (rawWeights[i] / weightSum);
  }

  return Math.max(1, Math.round(weightedQty));
}

// =============================================================================
// HELPER: Detect preferred shopping day(s) from purchase history
// Returns a score multiplier (1.0 = no boost, up to 1.3 = shopping day)
// =============================================================================
async function getShoppingDayBoost(): Promise<number> {
  try {
    // Count purchases by day of week over the last 90 days
    const dayStats = await q<Array<{ dayOfWeek: number; purchaseCount: number }>>(
      `SELECT
        DAYOFWEEK(purchasedAt) as dayOfWeek,
        COUNT(*) as purchaseCount
       FROM shopping_purchase_events
       WHERE purchasedAt >= DATE_SUB(NOW(), INTERVAL 90 DAY)
       GROUP BY DAYOFWEEK(purchasedAt)
       ORDER BY purchaseCount DESC`,
    );

    if (dayStats.length === 0) return 1.0;

    const totalPurchases = dayStats.reduce((s, d) => s + d.purchaseCount, 0);
    if (totalPurchases < 5) return 1.0; // Not enough data

    // Find the top shopping day(s) — days with significantly above-average purchases
    const avgPerDay = totalPurchases / 7;
    const topDays = dayStats.filter((d) => d.purchaseCount >= avgPerDay * 1.5);

    if (topDays.length === 0) return 1.0; // No clear pattern

    // Get today's day of week (MySQL DAYOFWEEK: 1=Sunday, 2=Monday, ..., 7=Saturday)
    const today = new Date();
    const todayDow = today.getDay() + 1; // JS: 0=Sunday → MySQL: 1=Sunday

    // Check if today IS a preferred shopping day
    if (topDays.some((d) => d.dayOfWeek === todayDow)) {
      return 1.3; // 30% boost on shopping day
    }

    // Check if tomorrow is a preferred shopping day (prep day boost)
    const tomorrowDow = (todayDow % 7) + 1;
    if (topDays.some((d) => d.dayOfWeek === tomorrowDow)) {
      return 1.15; // 15% boost the day before shopping day
    }

    return 1.0;
  } catch {
    return 1.0; // Fail silently
  }
}

// =============================================================================
// Core suggestion algorithm - combines multiple data sources
// =============================================================================
async function calculateSuggestions(): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];

  // Get items already on the shopping list (to exclude)
  const onList = await q<Array<{ catalogItemId: number }>>(
    `SELECT catalogItemId FROM shopping_list
     WHERE active = 1 AND purchasedAt IS NULL`,
  );
  const onListIds = new Set(onList.map((i) => i.catalogItemId));

  // Get shopping day boost multiplier
  const shoppingDayBoost = await getShoppingDayBoost();

  // ==========================================================================
  // SOURCE 1: Pattern-based predictions (items purchased 2+ times)
  // Uses weighted intervals, variance-adjusted confidence, and exponential decay
  // ==========================================================================
  const patternItemRows = await q<
    Array<{
      catalogItemId: number;
      itemName: string;
      brand: string | null;
      imageUrl: string | null;
      categoryName: string | null;
      purchaseCount: number;
      daysSinceLast: number;
    }>
  >(
    `SELECT
      ci.id as catalogItemId,
      ci.name as itemName,
      ci.brand,
      ci.imageUrl,
      sc.name as categoryName,
      COUNT(spe.id) as purchaseCount,
      DATEDIFF(NOW(), MAX(spe.purchasedAt)) as daysSinceLast
     FROM catalog_items ci
     JOIN shopping_purchase_events spe ON ci.id = spe.catalogItemId
     LEFT JOIN shopping_categories sc ON ci.categoryId = sc.id
     WHERE ci.visibility = 'active'
     GROUP BY ci.id
     HAVING purchaseCount >= 2
     ORDER BY daysSinceLast DESC
     LIMIT 50`,
  );

  for (const item of patternItemRows) {
    if (onListIds.has(item.catalogItemId)) continue;

    // Skip items purchased very recently (today or yesterday)
    if (item.daysSinceLast <= 1) continue;

    // Fetch raw purchase dates and quantities for this item
    const purchaseHistory = await q<Array<{ purchasedAt: string; quantity: number }>>(
      `SELECT purchasedAt, quantity
       FROM shopping_purchase_events
       WHERE catalogItemId = ?
       ORDER BY purchasedAt ASC`,
      [item.catalogItemId],
    );

    const dates = purchaseHistory.map((p) => p.purchasedAt);
    const quantities = purchaseHistory.map((p) => p.quantity || 1);

    // Calculate weighted interval and variance
    const { weightedAvg, stddev, intervalCount } = calcWeightedInterval(dates);

    if (weightedAvg <= 0 || intervalCount === 0) continue;

    // Variance-adjusted confidence: high stddev = less predictable = lower confidence
    const coeffOfVariation = stddev / weightedAvg; // 0 = perfectly regular, >1 = very erratic

    const ratio = item.daysSinceLast / weightedAvg;
    let baseConfidence: 'high' | 'medium' | 'low';
    let suggestionType: 'overdue' | 'due_soon';
    let reason: string;

    if (ratio >= 1.2) {
      baseConfidence = 'high';
      suggestionType = 'overdue';
      reason = `Overdue! Usually buy every ~${Math.round(weightedAvg)} days, last purchased ${item.daysSinceLast} days ago`;
    } else if (ratio >= 0.8) {
      baseConfidence = 'medium';
      suggestionType = 'due_soon';
      reason = `Due soon — usually buy every ~${Math.round(weightedAvg)} days`;
    } else if (ratio >= 0.5) {
      baseConfidence = 'low';
      suggestionType = 'due_soon';
      reason = `Coming up — bought ${item.purchaseCount} times, avg every ~${Math.round(weightedAvg)} days`;
    } else {
      continue; // Not due yet
    }

    // Downgrade confidence for highly variable items
    let confidence = baseConfidence;
    if (coeffOfVariation > 0.6) {
      // Very irregular purchasing pattern — drop confidence one level
      if (confidence === 'high') confidence = 'medium';
      else if (confidence === 'medium') confidence = 'low';
      reason += ` (variable pattern)`;
    } else if (coeffOfVariation > 0.3 && confidence === 'high') {
      // Moderately variable — don't allow high confidence
      confidence = 'medium';
    }

    // Boost confidence for very consistent items with many data points
    if (coeffOfVariation < 0.15 && intervalCount >= 4 && confidence === 'medium') {
      confidence = 'high';
      reason += ` (very consistent)`;
    }

    // Calculate weighted quantity
    const suggestedQuantity = calcWeightedQuantity(quantities);

    // Get best price for this item
    const priceInfo = await getBestPrice(item.catalogItemId);

    // Score: ratio * 100, boosted by shopping day and purchase count consistency
    let score = ratio * 100;
    score *= shoppingDayBoost;

    // Bonus for more data points (more confident predictions)
    if (intervalCount >= 5) score *= 1.1;
    else if (intervalCount >= 3) score *= 1.05;

    suggestions.push({
      catalogItemId: item.catalogItemId,
      itemName: item.itemName,
      brand: item.brand,
      imageUrl: item.imageUrl,
      categoryName: item.categoryName,
      confidence,
      reason,
      daysSinceLast: item.daysSinceLast,
      avgInterval: Math.round(weightedAvg),
      suggestedQuantity,
      suggestedStoreId: priceInfo?.storeId || null,
      suggestedStoreName: priceInfo?.storeName || null,
      bestPrice: priceInfo?.price || null,
      suggestionType,
      score,
    });
  }

  // ==========================================================================
  // SOURCE 1b: Single-purchase items (bought exactly once, 14-45 days ago)
  // Low confidence suggestions — "you bought this once, might need it again"
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
    }>
  >(
    `SELECT
      ci.id as catalogItemId,
      ci.name as itemName,
      ci.brand,
      ci.imageUrl,
      sc.name as categoryName,
      DATEDIFF(NOW(), MAX(spe.purchasedAt)) as daysSinceLast,
      MAX(spe.quantity) as quantity
     FROM catalog_items ci
     JOIN shopping_purchase_events spe ON ci.id = spe.catalogItemId
     LEFT JOIN shopping_categories sc ON ci.categoryId = sc.id
     WHERE ci.visibility = 'active'
     GROUP BY ci.id
     HAVING COUNT(spe.id) = 1
       AND daysSinceLast BETWEEN 14 AND 45
     ORDER BY daysSinceLast ASC
     LIMIT 10`,
  );

  for (const item of singlePurchaseItems) {
    if (onListIds.has(item.catalogItemId)) continue;
    if (suggestions.some((s) => s.catalogItemId === item.catalogItemId)) continue;

    const priceInfo = await getBestPrice(item.catalogItemId);

    suggestions.push({
      catalogItemId: item.catalogItemId,
      itemName: item.itemName,
      brand: item.brand,
      imageUrl: item.imageUrl,
      categoryName: item.categoryName,
      confidence: 'low',
      reason: `Bought once ${item.daysSinceLast} days ago — might need again?`,
      daysSinceLast: item.daysSinceLast,
      avgInterval: null,
      suggestedQuantity: item.quantity || 1,
      suggestedStoreId: priceInfo?.storeId || null,
      suggestedStoreName: priceInfo?.storeName || null,
      bestPrice: priceInfo?.price || null,
      suggestionType: 'due_soon',
      score: 15 * shoppingDayBoost, // Low base score
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
         AND ci.visibility = 'active'
       ORDER BY mp.date ASC`,
    );

    for (const item of mealIngredients) {
      if (onListIds.has(item.catalogItemId)) continue;
      // Don't add if already suggested from purchase patterns
      if (suggestions.some((s) => s.catalogItemId === item.catalogItemId)) continue;

      // Get best price
      const priceInfo = await getBestPrice(item.catalogItemId);

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
        score: (80 - daysUntilMeal * 10) * shoppingDayBoost, // Closer meals score higher
        mealDate: item.mealDate,
        mealName: item.mealName,
      });
    }
  } catch {
    // Meal tables may not exist or be empty - that's ok
  }

  // ==========================================================================
  // SOURCE 3: Popular items (frequently purchased, dynamic exclusion window)
  // Uses each item's own average interval for exclusion instead of hardcoded 7 days
  // Uses weighted quantities from recent purchases
  // Only adds if we have fewer than 15 suggestions from patterns + meals
  // ==========================================================================
  const patternAndMealCount = suggestions.length;

  if (patternAndMealCount < 15) {
    const limit = 15 - patternAndMealCount;

    // Get already suggested item IDs
    const suggestedIds = new Set(suggestions.map((s) => s.catalogItemId));

    try {
      // Fetch popular items with their own purchase interval data
      const popularItems = await q<
        Array<{
          catalogItemId: number;
          itemName: string;
          brand: string | null;
          imageUrl: string | null;
          categoryName: string | null;
          purchaseCount30Days: number;
          purchaseCountAllTime: number;
          daysSinceLast: number;
          avgInterval: number | null;
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
          COUNT(spe.id) as purchaseCount30Days,
          (SELECT COUNT(*) FROM shopping_purchase_events WHERE catalogItemId = ci.id) as purchaseCountAllTime,
          DATEDIFF(NOW(), MAX(spe.purchasedAt)) as daysSinceLast,
          (SELECT AVG(sub.interval_days) FROM (
            SELECT DATEDIFF(
              spe3.purchasedAt,
              (SELECT MAX(spe4.purchasedAt) FROM shopping_purchase_events spe4
               WHERE spe4.catalogItemId = ci.id AND spe4.purchasedAt < spe3.purchasedAt)
            ) as interval_days
            FROM shopping_purchase_events spe3
            WHERE spe3.catalogItemId = ci.id
            HAVING interval_days IS NOT NULL
          ) AS sub) as avgInterval,
          (SELECT MIN(ip.price) FROM item_prices ip WHERE ip.catalogItemId = ci.id) as lowestPrice,
          (SELECT s.name FROM item_prices ip3
           JOIN stores s ON ip3.storeId = s.id
           WHERE ip3.catalogItemId = ci.id
           ORDER BY ip3.price ASC LIMIT 1) as storeName,
          (SELECT ip4.storeId FROM item_prices ip4
           WHERE ip4.catalogItemId = ci.id
           ORDER BY ip4.price ASC LIMIT 1) as storeId
         FROM catalog_items ci
         JOIN shopping_purchase_events spe ON ci.id = spe.catalogItemId
           AND spe.purchasedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         LEFT JOIN shopping_categories sc ON ci.categoryId = sc.id
         WHERE ci.visibility = 'active'
         GROUP BY ci.id
         ORDER BY purchaseCount30Days DESC, purchaseCountAllTime DESC
         LIMIT ?`,
        [limit + suggestedIds.size + 10], // Get extra in case some are filtered out
      );

      let addedCount = 0;
      for (const item of popularItems) {
        if (addedCount >= limit) break;
        if (onListIds.has(item.catalogItemId)) continue;
        if (suggestedIds.has(item.catalogItemId)) continue;

        // Dynamic exclusion window: use the item's own avgInterval
        // If avgInterval is 14 days, exclude if purchased within last ~40% of interval (5.6 days)
        // If no interval data (single purchase), use 7-day default
        const exclusionWindow = item.avgInterval
          ? Math.max(2, Math.round(item.avgInterval * 0.4))
          : 7;

        if (item.daysSinceLast < exclusionWindow) continue; // Recently purchased

        // Get weighted quantity from recent purchases
        const recentQtys = await q<Array<{ quantity: number }>>(
          `SELECT quantity FROM shopping_purchase_events
           WHERE catalogItemId = ?
           ORDER BY purchasedAt DESC
           LIMIT 5`,
          [item.catalogItemId],
        );
        const weightedQty = calcWeightedQuantity(recentQtys.map((r) => r.quantity || 1));

        suggestions.push({
          catalogItemId: item.catalogItemId,
          itemName: item.itemName,
          brand: item.brand,
          imageUrl: item.imageUrl,
          categoryName: item.categoryName,
          confidence: item.purchaseCount30Days >= 3 ? 'medium' : 'low',
          reason: `Purchased ${item.purchaseCount30Days} times in the last 30 days`,
          daysSinceLast: item.daysSinceLast,
          avgInterval: item.avgInterval ? Math.round(item.avgInterval) : null,
          suggestedQuantity: weightedQty,
          suggestedStoreId: item.storeId,
          suggestedStoreName: item.storeName,
          bestPrice: item.lowestPrice,
          suggestionType: 'popular',
          score: (20 + item.purchaseCount30Days * 5) * shoppingDayBoost,
        });
        addedCount++;
      }
    } catch {
      // Purchase events table may not have data yet - that's ok
    }
  }

  // ==========================================================================
  // SOURCE 4: Co-purchase boosting (frequently bought together)
  // If items on the current shopping list are often purchased alongside
  // other items, suggest those companion items
  // ==========================================================================
  try {
    if (onListIds.size > 0) {
      const suggestedIds = new Set(suggestions.map((s) => s.catalogItemId));
      const onListArray = Array.from(onListIds);
      const placeholders = onListArray.map(() => '?').join(',');

      // Find items frequently bought on the same day by the same user
      // as items currently on the shopping list
      const coPurchaseItems = await q<
        Array<{
          catalogItemId: number;
          itemName: string;
          brand: string | null;
          imageUrl: string | null;
          categoryName: string | null;
          coPurchaseCount: number;
          companionItem: string;
        }>
      >(
        `SELECT
          ci.id as catalogItemId,
          ci.name as itemName,
          ci.brand,
          ci.imageUrl,
          sc.name as categoryName,
          COUNT(DISTINCT DATE(spe2.purchasedAt)) as coPurchaseCount,
          (SELECT ci2.name FROM catalog_items ci2
           WHERE ci2.id = spe1.catalogItemId LIMIT 1) as companionItem
         FROM shopping_purchase_events spe1
         JOIN shopping_purchase_events spe2
           ON DATE(spe1.purchasedAt) = DATE(spe2.purchasedAt)
           AND spe1.purchasedBy = spe2.purchasedBy
           AND spe1.catalogItemId != spe2.catalogItemId
         JOIN catalog_items ci ON spe2.catalogItemId = ci.id
         LEFT JOIN shopping_categories sc ON ci.categoryId = sc.id
         WHERE spe1.catalogItemId IN (${placeholders})
           AND ci.visibility = 'active'
           AND spe1.purchasedAt >= DATE_SUB(NOW(), INTERVAL 90 DAY)
         GROUP BY ci.id, spe1.catalogItemId
         HAVING coPurchaseCount >= 2
         ORDER BY coPurchaseCount DESC
         LIMIT 10`,
        onListArray,
      );

      for (const item of coPurchaseItems) {
        if (onListIds.has(item.catalogItemId)) continue;
        if (suggestedIds.has(item.catalogItemId)) continue;

        // Check if already in suggestions list
        if (suggestions.some((s) => s.catalogItemId === item.catalogItemId)) {
          // Boost existing suggestion score instead of adding duplicate
          const existing = suggestions.find((s) => s.catalogItemId === item.catalogItemId);
          if (existing) {
            existing.score *= 1.2; // 20% co-purchase boost
            existing.reason += ` (often bought with ${item.companionItem})`;
          }
          continue;
        }

        const priceInfo = await getBestPrice(item.catalogItemId);

        suggestions.push({
          catalogItemId: item.catalogItemId,
          itemName: item.itemName,
          brand: item.brand,
          imageUrl: item.imageUrl,
          categoryName: item.categoryName,
          confidence: item.coPurchaseCount >= 4 ? 'medium' : 'low',
          reason: `Often bought with ${item.companionItem} (${item.coPurchaseCount} times together)`,
          daysSinceLast: null,
          avgInterval: null,
          suggestedQuantity: 1,
          suggestedStoreId: priceInfo?.storeId || null,
          suggestedStoreName: priceInfo?.storeName || null,
          bestPrice: priceInfo?.price || null,
          suggestionType: 'co_purchase',
          score: (25 + item.coPurchaseCount * 3) * shoppingDayBoost,
        });
        suggestedIds.add(item.catalogItemId);
      }
    }
  } catch {
    // Co-purchase analysis is non-fatal
  }

  // ==========================================================================
  // SOURCE 5: Trending items (added by 2+ different users in last 14 days,
  // but never purchased — might be new items the household wants to try)
  // ==========================================================================
  try {
    const suggestedIds = new Set(suggestions.map((s) => s.catalogItemId));

    const trendingItems = await q<
      Array<{
        catalogItemId: number;
        itemName: string;
        brand: string | null;
        imageUrl: string | null;
        categoryName: string | null;
        addedByUsers: number;
        addCount: number;
      }>
    >(
      `SELECT
        ci.id as catalogItemId,
        ci.name as itemName,
        ci.brand,
        ci.imageUrl,
        sc.name as categoryName,
        COUNT(DISTINCT iae.addedBy) as addedByUsers,
        COUNT(iae.id) as addCount
       FROM catalog_items ci
       JOIN item_add_events iae ON ci.id = iae.catalogItemId
         AND iae.addedAt >= DATE_SUB(NOW(), INTERVAL 14 DAY)
       LEFT JOIN shopping_categories sc ON ci.categoryId = sc.id
       WHERE ci.visibility = 'active'
         AND ci.id NOT IN (
           SELECT DISTINCT catalogItemId FROM shopping_purchase_events
         )
       GROUP BY ci.id
       HAVING addedByUsers >= 2
       ORDER BY addedByUsers DESC, addCount DESC
       LIMIT 5`,
    );

    for (const item of trendingItems) {
      if (onListIds.has(item.catalogItemId)) continue;
      if (suggestedIds.has(item.catalogItemId)) continue;

      const priceInfo = await getBestPrice(item.catalogItemId);

      suggestions.push({
        catalogItemId: item.catalogItemId,
        itemName: item.itemName,
        brand: item.brand,
        imageUrl: item.imageUrl,
        categoryName: item.categoryName,
        confidence: 'low',
        reason: `Trending — added by ${item.addedByUsers} members (${item.addCount} times) recently`,
        daysSinceLast: null,
        avgInterval: null,
        suggestedQuantity: 1,
        suggestedStoreId: priceInfo?.storeId || null,
        suggestedStoreName: priceInfo?.storeName || null,
        bestPrice: priceInfo?.price || null,
        suggestionType: 'trending',
        score: 10 + item.addedByUsers * 5 + item.addCount * 2,
      });
      suggestedIds.add(item.catalogItemId);
    }
  } catch {
    // Trending analysis is non-fatal
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
      coPurchase: suggestions.filter((s) => s.suggestionType === 'co_purchase').length,
      trending: suggestions.filter((s) => s.suggestionType === 'trending').length,
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
