// apps/api/src/routes/meals/shopping.ts
// Meal shopping suggestions routes

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import {
  getUser,
  success,
  created,
  notFound,
  serverError,
  validationError,
} from '../../utils';

interface MealShoppingSuggestion {
  id: number;
  mealPlanId: number;
  mealDate: string;
  mealName: string;
  recipeIngredientId: number | null;
  catalogItemId: number | null;
  name: string;
  quantity: number;
  scaledQuantity: number | null;
  unit: string | null;
  status: 'pending' | 'added' | 'dismissed';
  addedToListId: number | null;
  addedBy: number | null;
  addedAt: string | null;
}

/**
 * GET /api/meals/shopping-suggestions
 * Get all pending shopping suggestions from finalized meals
 */
export async function getShoppingSuggestions(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { status = 'pending' } = req.query;

  try {
    const suggestions = await q<MealShoppingSuggestion[]>(
      `SELECT
        mss.id, mss.mealPlanId, mp.date as mealDate,
        COALESCE(r.name, mp.customMealName, 'Meal') as mealName,
        mss.recipeIngredientId, mss.catalogItemId,
        mss.name, mss.quantity, mss.scaledQuantity, mss.unit,
        mss.status, mss.addedToListId, mss.addedBy, mss.addedAt
      FROM meal_shopping_suggestions mss
      JOIN meal_plans mp ON mss.mealPlanId = mp.id
      LEFT JOIN recipes r ON mp.recipeId = r.id
      WHERE mss.status = ?
      ORDER BY mp.date, mss.name`,
      [status],
    );

    return success(res, { suggestions });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/meals/:id/shopping-suggestions/generate
 * Generate shopping suggestions from a meal's recipe (admin only)
 */
export async function generateShoppingSuggestions(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const mealPlanId = parseInt(req.params.id);
  const { householdSize = 4 } = req.body;

  if (isNaN(mealPlanId)) {
    return validationError(res, 'Invalid meal plan ID');
  }

  try {
    // Get meal plan with recipe
    const [mealPlan] = await q<{ id: number; recipeId: number | null; status: string }[]>(
      `SELECT id, recipeId, status FROM meal_plans WHERE id = ?`,
      [mealPlanId],
    );

    if (!mealPlan) {
      return notFound(res, 'Meal plan not found');
    }

    if (!mealPlan.recipeId) {
      return validationError(res, 'Meal plan has no associated recipe');
    }

    // Get recipe servings for scaling
    const [recipe] = await q<{ servings: number }[]>(`SELECT servings FROM recipes WHERE id = ?`, [
      mealPlan.recipeId,
    ]);

    const scaleFactor = householdSize / (recipe?.servings || 4);

    // Get recipe ingredients
    const ingredients = await q<
      {
        id: number;
        name: string;
        catalogItemId: number | null;
        quantity: number;
        unit: string | null;
      }[]
    >(`SELECT id, name, catalogItemId, quantity, unit FROM recipe_ingredients WHERE recipeId = ?`, [
      mealPlan.recipeId,
    ]);

    // Remove existing pending suggestions for this meal
    await q(`DELETE FROM meal_shopping_suggestions WHERE mealPlanId = ? AND status = 'pending'`, [
      mealPlanId,
    ]);

    // Create new suggestions
    if (ingredients.length > 0) {
      const values = ingredients.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
      const params = ingredients.flatMap((ing) => [
        mealPlanId,
        ing.id,
        ing.catalogItemId,
        ing.name,
        ing.quantity,
        Math.round(ing.quantity * scaleFactor * 100) / 100, // Scaled and rounded
        ing.unit,
      ]);

      await q(
        `INSERT INTO meal_shopping_suggestions
          (mealPlanId, recipeIngredientId, catalogItemId, name, quantity, scaledQuantity, unit)
        VALUES ${values}`,
        params,
      );
    }

    await logAudit({
      action: 'meal.shopping.generate',
      result: 'ok',
      actorId: user.id,
      details: { mealPlanId, ingredientCount: ingredients.length, scaleFactor },
    });

    return success(res, { success: true, count: ingredients.length });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/meals/shopping-suggestions/:id/add
 * Add a shopping suggestion to the shopping list (admin only)
 */
export async function addShoppingSuggestion(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const suggestionId = parseInt(req.params.id);
  const { useScaledQuantity = true } = req.body;

  if (isNaN(suggestionId)) {
    return validationError(res, 'Invalid suggestion ID');
  }

  try {
    const [suggestion] = await q<MealShoppingSuggestion[]>(
      `SELECT * FROM meal_shopping_suggestions WHERE id = ? AND status = 'pending'`,
      [suggestionId],
    );

    if (!suggestion) {
      return notFound(res, 'Suggestion not found or already processed');
    }

    // If catalogItemId exists, add to shopping list
    // Otherwise just mark as added (user would add manually)
    let addedToListId: number | null = null;

    if (suggestion.catalogItemId) {
      // Check if item already in list
      const [existing] = await q<{ id: number }[]>(
        `SELECT id FROM shopping_list WHERE catalogItemId = ? AND active = 1`,
        [suggestion.catalogItemId],
      );

      if (!existing) {
        const quantity = useScaledQuantity
          ? suggestion.scaledQuantity || suggestion.quantity
          : suggestion.quantity;

        const result: any = await q(
          `INSERT INTO shopping_list (catalogItemId, quantity, notes, addedBy)
           VALUES (?, ?, ?, ?)`,
          [
            suggestion.catalogItemId,
            Math.ceil(quantity),
            `From recipe (${suggestion.name})`,
            user.id,
          ],
        );
        addedToListId = result.insertId;
      } else {
        addedToListId = existing.id;
      }
    }

    await q(
      `UPDATE meal_shopping_suggestions
       SET status = 'added', addedToListId = ?, addedBy = ?, addedAt = NOW()
       WHERE id = ?`,
      [addedToListId, user.id, suggestionId],
    );

    await logAudit({
      action: 'meal.shopping.add',
      result: 'ok',
      actorId: user.id,
      details: { suggestionId, addedToListId },
    });

    return success(res, { success: true, addedToListId });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/meals/shopping-suggestions/:id/dismiss
 * Dismiss a shopping suggestion (admin only)
 */
export async function dismissShoppingSuggestion(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const suggestionId = parseInt(req.params.id);

  if (isNaN(suggestionId)) {
    return validationError(res, 'Invalid suggestion ID');
  }

  try {
    await q(
      `UPDATE meal_shopping_suggestions
       SET status = 'dismissed', addedBy = ?, addedAt = NOW()
       WHERE id = ? AND status = 'pending'`,
      [user.id, suggestionId],
    );

    await logAudit({
      action: 'meal.shopping.dismiss',
      result: 'ok',
      actorId: user.id,
      details: { suggestionId },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/meals/shopping-suggestions/bulk-add
 * Add multiple shopping suggestions to the list (admin only)
 */
export async function bulkAddShoppingSuggestions(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { suggestionIds, useScaledQuantity = true } = req.body;

  if (!Array.isArray(suggestionIds) || suggestionIds.length === 0) {
    return validationError(res, 'suggestionIds must be a non-empty array');
  }

  try {
    const suggestions = await q<MealShoppingSuggestion[]>(
      `SELECT * FROM meal_shopping_suggestions
       WHERE id IN (${suggestionIds.map(() => '?').join(',')}) AND status = 'pending'`,
      suggestionIds,
    );

    let addedCount = 0;

    for (const suggestion of suggestions) {
      let addedToListId: number | null = null;

      if (suggestion.catalogItemId) {
        const [existing] = await q<{ id: number }[]>(
          `SELECT id FROM shopping_list WHERE catalogItemId = ? AND active = 1`,
          [suggestion.catalogItemId],
        );

        if (!existing) {
          const quantity = useScaledQuantity
            ? suggestion.scaledQuantity || suggestion.quantity
            : suggestion.quantity;

          const result: any = await q(
            `INSERT INTO shopping_list (catalogItemId, quantity, notes, addedBy)
             VALUES (?, ?, ?, ?)`,
            [
              suggestion.catalogItemId,
              Math.ceil(quantity),
              `From recipe (${suggestion.name})`,
              user.id,
            ],
          );
          addedToListId = result.insertId;
        } else {
          addedToListId = existing.id;
        }
      }

      await q(
        `UPDATE meal_shopping_suggestions
         SET status = 'added', addedToListId = ?, addedBy = ?, addedAt = NOW()
         WHERE id = ?`,
        [addedToListId, user.id, suggestion.id],
      );

      addedCount++;
    }

    await logAudit({
      action: 'meal.shopping.bulk_add',
      result: 'ok',
      actorId: user.id,
      details: { suggestionIds, addedCount },
    });

    return success(res, { success: true, addedCount });
  } catch (err) {
    return serverError(res, err as Error);
  }
}
