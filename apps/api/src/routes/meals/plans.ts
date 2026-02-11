// apps/api/src/routes/meals/plans.ts
// Meal planning routes

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import { createNotification } from '../messages';
import {
  getUser,
  isValidString,
  isValidEnum,
  success,
  created,
  notFound,
  serverError,
  validationError,
  forbidden,
} from '../../utils';

type MealPlanStatus = 'planned' | 'voting' | 'finalized';

interface MealPlan {
  id: number;
  date: string;
  mealType: 'dinner';
  recipeId: number | null;
  recipeName: string | null;
  recipeImageUrl: string | null;
  customMealName: string | null;
  isFendForYourself: boolean;
  ffyMessage: string | null;
  status: MealPlanStatus;
  votingDeadline: string | null;
  finalizedBy: number | null;
  finalizedByName: string | null;
  finalizedAt: string | null;
  notes: string | null;
  createdBy: number | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

// Default FFY messages
const DEFAULT_FFY_MESSAGES = [
  "🍕 You're on your own tonight!",
  "🎲 Chef's choice - your choice!",
  "🏠 Raid the fridge!",
  "🍿 Snack attack authorized!",
  "🥡 Takeout? Leftovers? You decide!",
];

function getRandomFFYMessage(): string {
  return DEFAULT_FFY_MESSAGES[Math.floor(Math.random() * DEFAULT_FFY_MESSAGES.length)];
}

/**
 * GET /api/meals
 * Get meal plans for a date range
 */
export async function getMealPlans(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return validationError(res, 'startDate and endDate are required');
  }

  try {
    const rawMealPlans = await q<any[]>(
      `SELECT
        mp.id, DATE_FORMAT(mp.date, '%Y-%m-%d') as date, mp.mealType,
        mp.recipeId, r.name as recipeName, r.imageUrl as recipeImageUrl,
        r.prepTimeMinutes, r.cookTimeMinutes,
        mp.customMealName, mp.isFendForYourself, mp.ffyMessage,
        mp.status, mp.votingDeadline,
        mp.finalizedBy, uf.displayName as finalizedByName, mp.finalizedAt,
        mp.notes, mp.createdBy, uc.displayName as createdByName,
        mp.createdAt, mp.updatedAt,
        (SELECT COUNT(*) FROM meal_suggestions ms WHERE ms.mealPlanId = mp.id) as suggestionCount
      FROM meal_plans mp
      LEFT JOIN recipes r ON mp.recipeId = r.id
      LEFT JOIN users uf ON mp.finalizedBy = uf.id
      LEFT JOIN users uc ON mp.createdBy = uc.id
      WHERE mp.date >= ? AND mp.date <= ?
      ORDER BY mp.date`,
      [startDate, endDate],
    );

    // Transform to include recipe as nested object (for frontend compatibility)
    const mealPlans = rawMealPlans.map((mp) => ({
      id: mp.id,
      date: mp.date,
      mealType: mp.mealType,
      recipeId: mp.recipeId,
      recipe: mp.recipeId
        ? {
            id: mp.recipeId,
            name: mp.recipeName,
            imageUrl: mp.recipeImageUrl,
            prepTimeMinutes: mp.prepTimeMinutes,
            cookTimeMinutes: mp.cookTimeMinutes,
          }
        : null,
      customMealName: mp.customMealName,
      isFendForYourself: mp.isFendForYourself === 1,
      ffyMessage: mp.ffyMessage,
      status: mp.status,
      votingDeadline: mp.votingDeadline,
      finalizedBy: mp.finalizedBy,
      finalizedByName: mp.finalizedByName,
      finalizedAt: mp.finalizedAt,
      notes: mp.notes,
      createdBy: mp.createdBy,
      createdByName: mp.createdByName,
      createdAt: mp.createdAt,
      updatedAt: mp.updatedAt,
      suggestionCount: mp.suggestionCount,
    }));

    return success(res, { mealPlans });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * GET /api/meals/:date
 * Get meal plan for a specific date (with suggestions if voting)
 */
export async function getMealPlan(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { date } = req.params;

  try {
    const [rawMealPlan] = await q<any[]>(
      `SELECT
        mp.id, DATE_FORMAT(mp.date, '%Y-%m-%d') as date, mp.mealType,
        mp.recipeId, r.name as recipeName, r.imageUrl as recipeImageUrl,
        r.prepTimeMinutes, r.cookTimeMinutes,
        mp.customMealName, mp.isFendForYourself, mp.ffyMessage,
        mp.status, mp.votingDeadline,
        mp.finalizedBy, uf.displayName as finalizedByName, mp.finalizedAt,
        mp.notes, mp.createdBy, uc.displayName as createdByName,
        mp.createdAt, mp.updatedAt
      FROM meal_plans mp
      LEFT JOIN recipes r ON mp.recipeId = r.id
      LEFT JOIN users uf ON mp.finalizedBy = uf.id
      LEFT JOIN users uc ON mp.createdBy = uc.id
      WHERE mp.date = ?`,
      [date],
    );

    if (!rawMealPlan) {
      return notFound(res, 'Meal plan not found');
    }

    // Transform to include recipe as nested object
    const mealPlan = {
      id: rawMealPlan.id,
      date: rawMealPlan.date,
      mealType: rawMealPlan.mealType,
      recipeId: rawMealPlan.recipeId,
      recipe: rawMealPlan.recipeId
        ? {
            id: rawMealPlan.recipeId,
            name: rawMealPlan.recipeName,
            imageUrl: rawMealPlan.recipeImageUrl,
            prepTimeMinutes: rawMealPlan.prepTimeMinutes,
            cookTimeMinutes: rawMealPlan.cookTimeMinutes,
          }
        : null,
      customMealName: rawMealPlan.customMealName,
      isFendForYourself: rawMealPlan.isFendForYourself === 1,
      ffyMessage: rawMealPlan.ffyMessage,
      status: rawMealPlan.status,
      votingDeadline: rawMealPlan.votingDeadline,
      finalizedBy: rawMealPlan.finalizedBy,
      finalizedByName: rawMealPlan.finalizedByName,
      finalizedAt: rawMealPlan.finalizedAt,
      notes: rawMealPlan.notes,
      createdBy: rawMealPlan.createdBy,
      createdByName: rawMealPlan.createdByName,
      createdAt: rawMealPlan.createdAt,
      updatedAt: rawMealPlan.updatedAt,
    };

    // If voting is open, include suggestions
    let suggestions: any[] = [];
    if (mealPlan.status === 'voting') {
      const rawSuggestions = await q<any[]>(
        `SELECT
          ms.id, ms.mealPlanId, ms.recipeId,
          r.name as recipeName, r.imageUrl as recipeImageUrl,
          ms.customMealName, ms.suggestedBy, us.displayName as suggestedByName,
          ms.createdAt,
          (SELECT COUNT(*) FROM meal_votes mv WHERE mv.mealSuggestionId = ms.id) as voteCount,
          EXISTS(SELECT 1 FROM meal_votes mv WHERE mv.mealSuggestionId = ms.id AND mv.userId = ?) as hasVoted
        FROM meal_suggestions ms
        LEFT JOIN recipes r ON ms.recipeId = r.id
        LEFT JOIN users us ON ms.suggestedBy = us.id
        WHERE ms.mealPlanId = ?
        ORDER BY voteCount DESC, ms.createdAt`,
        [user.id, mealPlan.id],
      );

      // Transform suggestions to include recipe as nested object
      suggestions = rawSuggestions.map((s) => ({
        id: s.id,
        mealPlanId: s.mealPlanId,
        recipeId: s.recipeId,
        recipe: s.recipeId
          ? {
              id: s.recipeId,
              name: s.recipeName,
              imageUrl: s.recipeImageUrl,
            }
          : null,
        customMealName: s.customMealName,
        suggestedBy: s.suggestedBy,
        suggestedByName: s.suggestedByName,
        voteCount: s.voteCount,
        hasVoted: s.hasVoted === 1,
        createdAt: s.createdAt,
      }));
    }

    return success(res, { mealPlan: { ...mealPlan, suggestions } });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/meals
 * Create a meal plan
 * - Admins can create any type of meal plan
 * - Non-admins can only create meal plans in voting status (to suggest meals)
 */
export async function createMealPlan(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const isAdmin = user.roleId === 'admin';

  const {
    date,
    mealType = 'dinner',
    recipeId,
    customMealName,
    isFendForYourself = false,
    ffyMessage,
    status = 'planned',
    votingDeadline,
    notes,
  } = req.body;

  if (!date) {
    return validationError(res, 'Date is required');
  }

  if (!isValidEnum(mealType, ['dinner'])) {
    return validationError(res, 'Invalid meal type');
  }

  if (!isValidEnum(status, ['planned', 'voting', 'finalized'])) {
    return validationError(res, 'Invalid status');
  }

  // Non-admins can only create meal plans in voting status
  if (!isAdmin && status !== 'voting') {
    return forbidden(res, 'Only admins can create planned meals. You can suggest a meal instead.');
  }

  // Non-admins can't set FFY, finalized, or other special statuses
  if (!isAdmin && (isFendForYourself || status === 'finalized')) {
    return forbidden(res, 'Only admins can set this meal type');
  }

  // Must have either recipe, custom name, FFY, or be in voting mode
  if (!recipeId && !customMealName && !isFendForYourself && status !== 'voting') {
    return validationError(res, 'Must specify a recipe, custom meal name, or Fend For Yourself');
  }

  try {
    // Check if meal plan already exists for this date
    const [existing] = await q<{ id: number }[]>(
      `SELECT id FROM meal_plans WHERE date = ? AND mealType = ?`,
      [date, mealType],
    );

    if (existing) {
      return validationError(res, 'A meal plan already exists for this date');
    }

    const result: any = await q(
      `INSERT INTO meal_plans (
        date, mealType, recipeId, customMealName, isFendForYourself, ffyMessage,
        status, votingDeadline, notes, createdBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        date,
        mealType,
        recipeId || null,
        customMealName || null,
        isFendForYourself ? 1 : 0,
        isFendForYourself ? ffyMessage || getRandomFFYMessage() : null,
        status,
        votingDeadline || null,
        notes || null,
        user.id,
      ],
    );

    await logAudit({
      action: 'meal.plan.create',
      result: 'ok',
      actorId: user.id,
      details: { mealPlanId: result.insertId, date },
    });

    return created(res, { id: result.insertId });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * PUT /api/meals/:id
 * Update a meal plan (admin only)
 */
export async function updateMealPlan(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const mealPlanId = parseInt(req.params.id);

  if (isNaN(mealPlanId)) {
    return validationError(res, 'Invalid meal plan ID');
  }

  const {
    recipeId,
    customMealName,
    isFendForYourself,
    ffyMessage,
    status,
    votingDeadline,
    notes,
  } = req.body;

  try {
    const updates: string[] = [];
    const params: any[] = [];

    if (recipeId !== undefined) {
      updates.push('recipeId = ?');
      params.push(recipeId || null);
    }
    if (customMealName !== undefined) {
      updates.push('customMealName = ?');
      params.push(customMealName || null);
    }
    if (isFendForYourself !== undefined) {
      updates.push('isFendForYourself = ?');
      params.push(isFendForYourself ? 1 : 0);
    }
    if (ffyMessage !== undefined) {
      updates.push('ffyMessage = ?');
      params.push(ffyMessage || null);
    }
    if (status !== undefined) {
      if (!isValidEnum(status, ['planned', 'voting', 'finalized'])) {
        return validationError(res, 'Invalid status');
      }
      updates.push('status = ?');
      params.push(status);
    }
    if (votingDeadline !== undefined) {
      updates.push('votingDeadline = ?');
      params.push(votingDeadline || null);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes || null);
    }

    if (updates.length === 0) {
      return validationError(res, 'No fields to update');
    }

    params.push(mealPlanId);
    await q(`UPDATE meal_plans SET ${updates.join(', ')} WHERE id = ?`, params);

    await logAudit({
      action: 'meal.plan.update',
      result: 'ok',
      actorId: user.id,
      details: { mealPlanId, updates: req.body },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * DELETE /api/meals/:id
 * Delete a meal plan (admin only)
 */
export async function deleteMealPlan(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const mealPlanId = parseInt(req.params.id);

  if (isNaN(mealPlanId)) {
    return validationError(res, 'Invalid meal plan ID');
  }

  try {
    // Cascade delete will remove suggestions and votes
    await q(`DELETE FROM meal_plans WHERE id = ?`, [mealPlanId]);

    await logAudit({
      action: 'meal.plan.delete',
      result: 'ok',
      actorId: user.id,
      details: { mealPlanId },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/meals/:id/ffy
 * Set a meal plan as Fend For Yourself (admin only)
 */
export async function setFendForYourself(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const mealPlanId = parseInt(req.params.id);
  const { message } = req.body;

  if (isNaN(mealPlanId)) {
    return validationError(res, 'Invalid meal plan ID');
  }

  try {
    await q(
      `UPDATE meal_plans SET
        isFendForYourself = 1,
        ffyMessage = ?,
        recipeId = NULL,
        customMealName = NULL,
        status = 'finalized',
        finalizedBy = ?,
        finalizedAt = NOW()
      WHERE id = ?`,
      [message || getRandomFFYMessage(), user.id, mealPlanId],
    );

    await logAudit({
      action: 'meal.plan.ffy',
      result: 'ok',
      actorId: user.id,
      details: { mealPlanId },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * Helper function to auto-generate shopping suggestions for a finalized meal
 * This is called when a meal is finalized with a recipe
 */
async function autoGenerateShoppingSuggestions(
  mealPlanId: number,
  recipeId: number,
  householdSize: number = 4,
): Promise<number> {
  // Get recipe servings for scaling
  const [recipe] = await q<{ servings: number }[]>(`SELECT servings FROM recipes WHERE id = ?`, [
    recipeId,
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
    recipeId,
  ]);

  // Remove existing pending suggestions for this meal (if any)
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

  return ingredients.length;
}

/**
 * POST /api/meals/:id/finalize
 * Finalize a meal plan (admin only)
 * If voting was open, picks the winner or uses override
 * Auto-generates shopping suggestions if meal has a recipe
 */
export async function finalizeMealPlan(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const mealPlanId = parseInt(req.params.id);
  const { overrideRecipeId, overrideCustomName } = req.body;

  if (isNaN(mealPlanId)) {
    return validationError(res, 'Invalid meal plan ID');
  }

  try {
    const [mealPlan] = await q<MealPlan[]>(`SELECT * FROM meal_plans WHERE id = ?`, [mealPlanId]);

    if (!mealPlan) {
      return notFound(res, 'Meal plan not found');
    }

    let recipeId = overrideRecipeId;
    let customMealName = overrideCustomName;

    // If no override and voting was open, get the winning suggestion
    if (!recipeId && !customMealName && mealPlan.status === 'voting') {
      const [winner] = await q<{ recipeId: number | null; customMealName: string | null }[]>(
        `SELECT ms.recipeId, ms.customMealName,
          (SELECT COUNT(*) FROM meal_votes mv WHERE mv.mealSuggestionId = ms.id) as voteCount
        FROM meal_suggestions ms
        WHERE ms.mealPlanId = ?
        ORDER BY voteCount DESC, ms.createdAt
        LIMIT 1`,
        [mealPlanId],
      );

      if (winner) {
        recipeId = winner.recipeId;
        customMealName = winner.customMealName;
      }
    }

    await q(
      `UPDATE meal_plans SET
        status = 'finalized',
        recipeId = ?,
        customMealName = ?,
        finalizedBy = ?,
        finalizedAt = NOW()
      WHERE id = ?`,
      [recipeId || null, customMealName || null, user.id, mealPlanId],
    );

    // Auto-generate shopping suggestions if meal has a recipe
    let suggestionsGenerated = 0;
    if (recipeId) {
      // Get household size (count of active users)
      const [household] = await q<{ count: number }[]>(
        `SELECT COUNT(*) as count FROM users WHERE 1=1`,
      );
      const householdSize = household?.count || 4;

      suggestionsGenerated = await autoGenerateShoppingSuggestions(
        mealPlanId,
        recipeId,
        householdSize,
      );
    }

    await logAudit({
      action: 'meal.plan.finalize',
      result: 'ok',
      actorId: user.id,
      details: { mealPlanId, recipeId, customMealName, suggestionsGenerated },
    });

    // Notify all users about finalized meal
    const allUsers = await q<{ id: number }[]>(`SELECT id FROM users WHERE id != ?`, [user.id]);

    for (const u of allUsers) {
      await createNotification({
        userId: u.id,
        type: 'meal',
        title: 'Dinner is decided!',
        body: `${mealPlan.date}'s dinner has been finalized`,
        link: `/meals/${mealPlan.date}`,
        relatedId: mealPlanId,
        relatedType: 'meal',
      });
    }

    return success(res, { success: true, suggestionsGenerated });
  } catch (err) {
    return serverError(res, err as Error);
  }
}
