// apps/api/src/routes/meals/ingredients.ts
// Recipe ingredient management routes

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
  forbidden,
} from '../../utils';
import { createLogger } from '../../services/logger';

const log = createLogger('meals');

interface Recipe {
  id: number;
  status: string;
  createdBy: number | null;
}

/**
 * Check if user can edit recipe ingredients
 */
async function canEditRecipe(
  user: { id: number; roleId: string },
  recipeId: number,
): Promise<{ allowed: boolean; recipe: Recipe | null }> {
  const [recipe] = await q<Recipe[]>(
    `SELECT id, status, createdBy FROM recipes WHERE id = ? AND active = 1`,
    [recipeId],
  );

  if (!recipe) {
    return { allowed: false, recipe: null };
  }

  // Admin can always edit
  if (user.roleId === 'admin') {
    return { allowed: true, recipe };
  }

  // Owner can edit if pending
  if (recipe.status === 'pending' && recipe.createdBy === user.id) {
    return { allowed: true, recipe };
  }

  return { allowed: false, recipe };
}

/**
 * POST /api/recipes/:id/ingredients
 * Add an ingredient to a recipe
 */
export async function addIngredient(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const recipeId = parseInt(req.params.id);

  if (isNaN(recipeId)) {
    return validationError(res, 'Invalid recipe ID');
  }

  const { allowed, recipe } = await canEditRecipe(user, recipeId);

  if (!recipe) {
    return notFound(res, 'Recipe not found');
  }

  if (!allowed) {
    return forbidden(res, 'You can only edit your own pending recipes');
  }

  const { name, catalogItemId, quantity = 1, unit, notes, sortOrder } = req.body;

  if (!isValidString(name, 1)) {
    return validationError(res, 'Ingredient name is required');
  }

  try {
    // Get max sort order if not provided
    let order = sortOrder;
    if (order === undefined) {
      const [maxOrder] = await q<{ maxOrder: number }[]>(
        `SELECT COALESCE(MAX(sortOrder), 0) + 1 as maxOrder FROM recipe_ingredients WHERE recipeId = ?`,
        [recipeId],
      );
      order = maxOrder.maxOrder;
    }

    const result: any = await q(
      `INSERT INTO recipe_ingredients (recipeId, name, catalogItemId, quantity, unit, notes, sortOrder)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [recipeId, name.trim(), catalogItemId || null, quantity, unit || null, notes || null, order],
    );

    await logAudit({
      action: 'recipe.ingredient.add',
      result: 'ok',
      actorId: user.id,
      details: { recipeId, ingredientId: result.insertId, name: name.trim() },
    });

    return created(res, { id: result.insertId });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * PUT /api/recipes/:id/ingredients/:ingredientId
 * Update an ingredient
 */
export async function updateIngredient(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const recipeId = parseInt(req.params.id);
  const ingredientId = parseInt(req.params.ingredientId);

  if (isNaN(recipeId) || isNaN(ingredientId)) {
    return validationError(res, 'Invalid recipe or ingredient ID');
  }

  const { allowed, recipe } = await canEditRecipe(user, recipeId);

  if (!recipe) {
    return notFound(res, 'Recipe not found');
  }

  if (!allowed) {
    return forbidden(res, 'You can only edit your own pending recipes');
  }

  const { name, catalogItemId, quantity, unit, notes, sortOrder } = req.body;

  try {
    // Verify ingredient exists and belongs to recipe
    const [ingredient] = await q<{ id: number }[]>(
      `SELECT id FROM recipe_ingredients WHERE id = ? AND recipeId = ?`,
      [ingredientId, recipeId],
    );

    if (!ingredient) {
      return notFound(res, 'Ingredient not found');
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      if (!isValidString(name, 1)) {
        return validationError(res, 'Ingredient name is required');
      }
      updates.push('name = ?');
      params.push(name.trim());
    }
    if (catalogItemId !== undefined) {
      updates.push('catalogItemId = ?');
      params.push(catalogItemId || null);
    }
    if (quantity !== undefined) {
      updates.push('quantity = ?');
      params.push(quantity);
    }
    if (unit !== undefined) {
      updates.push('unit = ?');
      params.push(unit || null);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes || null);
    }
    if (sortOrder !== undefined) {
      updates.push('sortOrder = ?');
      params.push(sortOrder);
    }

    if (updates.length === 0) {
      return validationError(res, 'No fields to update');
    }

    params.push(ingredientId);
    await q(`UPDATE recipe_ingredients SET ${updates.join(', ')} WHERE id = ?`, params);

    await logAudit({
      action: 'recipe.ingredient.update',
      result: 'ok',
      actorId: user.id,
      details: { recipeId, ingredientId, updates: req.body },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * DELETE /api/recipes/:id/ingredients/:ingredientId
 * Remove an ingredient from a recipe
 */
export async function deleteIngredient(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const recipeId = parseInt(req.params.id);
  const ingredientId = parseInt(req.params.ingredientId);

  if (isNaN(recipeId) || isNaN(ingredientId)) {
    return validationError(res, 'Invalid recipe or ingredient ID');
  }

  const { allowed, recipe } = await canEditRecipe(user, recipeId);

  if (!recipe) {
    return notFound(res, 'Recipe not found');
  }

  if (!allowed) {
    return forbidden(res, 'You can only edit your own pending recipes');
  }

  try {
    await q(`DELETE FROM recipe_ingredients WHERE id = ? AND recipeId = ?`, [
      ingredientId,
      recipeId,
    ]);

    await logAudit({
      action: 'recipe.ingredient.delete',
      result: 'ok',
      actorId: user.id,
      details: { recipeId, ingredientId },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/recipes/:id/ingredients/reorder
 * Reorder ingredients
 */
export async function reorderIngredients(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const recipeId = parseInt(req.params.id);

  if (isNaN(recipeId)) {
    return validationError(res, 'Invalid recipe ID');
  }

  const { allowed, recipe } = await canEditRecipe(user, recipeId);

  if (!recipe) {
    return notFound(res, 'Recipe not found');
  }

  if (!allowed) {
    return forbidden(res, 'You can only edit your own pending recipes');
  }

  const { ingredientIds } = req.body;

  if (!Array.isArray(ingredientIds)) {
    return validationError(res, 'ingredientIds must be an array');
  }

  try {
    // Update each ingredient's sort order
    for (let i = 0; i < ingredientIds.length; i++) {
      await q(`UPDATE recipe_ingredients SET sortOrder = ? WHERE id = ? AND recipeId = ?`, [
        i,
        ingredientIds[i],
        recipeId,
      ]);
    }

    await logAudit({
      action: 'recipe.ingredient.reorder',
      result: 'ok',
      actorId: user.id,
      details: { recipeId, ingredientIds },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}
