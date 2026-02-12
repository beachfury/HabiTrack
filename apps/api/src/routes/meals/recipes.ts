// apps/api/src/routes/meals/recipes.ts
// Recipe CRUD and approval routes

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import { createNotification } from '../messages';
import { queueEmail, getUserEmail, getActiveUsersWithEmail } from '../../email/queue';
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

type RecipeStatus = 'pending' | 'approved' | 'rejected';
type RecipeDifficulty = 'easy' | 'medium' | 'hard';

interface Recipe {
  id: number;
  name: string;
  description: string | null;
  instructions: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  servings: number;
  difficulty: RecipeDifficulty;
  imageUrl: string | null;
  sourceUrl: string | null;
  sourceType: 'manual' | 'url' | 'imported';
  tags: string | null;
  status: RecipeStatus;
  createdBy: number | null;
  createdByName: string | null;
  approvedBy: number | null;
  approvedByName: string | null;
  approvedAt: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RecipeIngredient {
  id: number;
  recipeId: number;
  name: string;
  catalogItemId: number | null;
  quantity: number;
  unit: string | null;
  notes: string | null;
  sortOrder: number;
}

/**
 * GET /api/recipes
 * Get all recipes - approved for all users, pending/rejected visible to admins
 */
export async function getRecipes(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { status, search, difficulty, tag } = req.query;

  try {
    let sql = `
      SELECT
        r.id, r.name, r.description, r.instructions,
        r.prepTimeMinutes, r.cookTimeMinutes, r.servings, r.difficulty,
        r.imageUrl, r.sourceUrl, r.sourceType, r.tags,
        r.status, r.createdBy, uc.displayName as createdByName,
        r.approvedBy, ua.displayName as approvedByName,
        r.approvedAt, r.active, r.createdAt, r.updatedAt
      FROM recipes r
      LEFT JOIN users uc ON r.createdBy = uc.id
      LEFT JOIN users ua ON r.approvedBy = ua.id
      WHERE r.active = 1
    `;
    const params: any[] = [];

    // Non-admins can only see approved recipes or their own pending recipes
    if (user.roleId !== 'admin') {
      sql += ` AND (r.status = 'approved' OR r.createdBy = ?)`;
      params.push(user.id);
    } else if (status && isValidEnum(status as string, ['pending', 'approved', 'rejected'])) {
      // Admins can filter by status
      sql += ` AND r.status = ?`;
      params.push(status);
    }

    // Search by name
    if (search && typeof search === 'string') {
      sql += ` AND r.name LIKE ?`;
      params.push(`%${search}%`);
    }

    // Filter by difficulty
    if (difficulty && isValidEnum(difficulty as string, ['easy', 'medium', 'hard'])) {
      sql += ` AND r.difficulty = ?`;
      params.push(difficulty);
    }

    // Filter by tag (JSON contains)
    if (tag && typeof tag === 'string') {
      sql += ` AND JSON_CONTAINS(r.tags, ?)`;
      params.push(JSON.stringify(tag));
    }

    sql += ` ORDER BY r.name`;

    const recipes = await q<Recipe[]>(sql, params);

    // Parse tags JSON for each recipe
    const parsedRecipes = recipes.map((recipe) => ({
      ...recipe,
      tags: recipe.tags ? JSON.parse(recipe.tags) : [],
    }));

    return success(res, { recipes: parsedRecipes });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * GET /api/recipes/:id
 * Get a single recipe with ingredients
 */
export async function getRecipe(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const recipeId = parseInt(req.params.id);

  if (isNaN(recipeId)) {
    return validationError(res, 'Invalid recipe ID');
  }

  try {
    const [recipe] = await q<Recipe[]>(
      `SELECT
        r.id, r.name, r.description, r.instructions,
        r.prepTimeMinutes, r.cookTimeMinutes, r.servings, r.difficulty,
        r.imageUrl, r.sourceUrl, r.sourceType, r.tags,
        r.status, r.createdBy, uc.displayName as createdByName,
        r.approvedBy, ua.displayName as approvedByName,
        r.approvedAt, r.active, r.createdAt, r.updatedAt
      FROM recipes r
      LEFT JOIN users uc ON r.createdBy = uc.id
      LEFT JOIN users ua ON r.approvedBy = ua.id
      WHERE r.id = ? AND r.active = 1`,
      [recipeId],
    );

    if (!recipe) {
      return notFound(res, 'Recipe not found');
    }

    // Check permissions - non-admins can only view approved recipes or their own
    if (user.roleId !== 'admin' && recipe.status !== 'approved' && recipe.createdBy !== user.id) {
      return forbidden(res, 'You do not have permission to view this recipe');
    }

    // Get ingredients
    const ingredients = await q<RecipeIngredient[]>(
      `SELECT
        id, recipeId, name, catalogItemId, quantity, unit, notes, sortOrder
      FROM recipe_ingredients
      WHERE recipeId = ?
      ORDER BY sortOrder, id`,
      [recipeId],
    );

    return success(res, {
      recipe: {
        ...recipe,
        tags: recipe.tags ? JSON.parse(recipe.tags) : [],
        ingredients,
      },
    });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/recipes
 * Create a new recipe (any user, goes to pending for non-admin)
 */
export async function createRecipe(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const {
    name,
    description,
    instructions,
    prepTimeMinutes,
    cookTimeMinutes,
    servings = 4,
    difficulty = 'medium',
    imageUrl,
    sourceUrl,
    sourceType = 'manual',
    tags = [],
    ingredients = [],
  } = req.body;

  if (!isValidString(name, 2)) {
    return validationError(res, 'Recipe name is required (min 2 characters)');
  }

  if (!isValidEnum(difficulty, ['easy', 'medium', 'hard'])) {
    return validationError(res, 'Invalid difficulty');
  }

  if (!isValidEnum(sourceType, ['manual', 'url', 'imported'])) {
    return validationError(res, 'Invalid source type');
  }

  // Admin recipes are auto-approved
  const status = user.roleId === 'admin' ? 'approved' : 'pending';
  const isAdmin = user.roleId === 'admin';

  try {
    const result: any = await q(
      `INSERT INTO recipes (
        name, description, instructions, prepTimeMinutes, cookTimeMinutes,
        servings, difficulty, imageUrl, sourceUrl, sourceType, tags,
        status, createdBy, approvedBy, approvedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${isAdmin ? 'NOW()' : 'NULL'})`,
      [
        name.trim(),
        description || null,
        instructions || null,
        prepTimeMinutes || null,
        cookTimeMinutes || null,
        servings,
        difficulty,
        imageUrl || null,
        sourceUrl || null,
        sourceType,
        Array.isArray(tags) ? JSON.stringify(tags) : null,
        status,
        user.id,
        isAdmin ? user.id : null,
      ],
    );

    const recipeId = result.insertId;

    // Add ingredients if provided
    if (ingredients.length > 0) {
      const ingredientValues = ingredients.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
      const ingredientParams = ingredients.flatMap((ing: any, index: number) => [
        recipeId,
        ing.name,
        ing.catalogItemId || null,
        ing.quantity || 1,
        ing.unit || null,
        ing.notes || null,
        ing.sortOrder ?? index,
      ]);

      await q(
        `INSERT INTO recipe_ingredients (recipeId, name, catalogItemId, quantity, unit, notes, sortOrder)
        VALUES ${ingredientValues}`,
        ingredientParams,
      );
    }

    await logAudit({
      action: 'recipe.create',
      result: 'ok',
      actorId: user.id,
      details: { recipeId, name: name.trim(), status },
    });

    // If pending, notify admins
    if (status === 'pending') {
      // Get admin users to notify
      const admins = await q<{ id: number; email: string | null; displayName: string }[]>(
        `SELECT id, email, displayName FROM users WHERE roleId = 'admin' AND id != ? AND active = 1`,
        [user.id],
      );

      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: 'meal',
          title: 'New recipe pending approval',
          body: `${user.displayName} submitted "${name.trim()}" for approval`,
          link: '/recipes',
          relatedId: recipeId,
          relatedType: 'recipe',
        });

        // Send email to admin
        if (admin.email) {
          await queueEmail({
            userId: admin.id,
            toEmail: admin.email,
            template: 'RECIPE_STATUS',
            variables: {
              userName: admin.displayName,
              recipeName: name.trim(),
              status: 'submitted for approval',
              message: `${user.displayName} has submitted a new recipe for your approval.`,
            },
          });
        }
      }
    }

    return created(res, { id: recipeId, status });
  } catch (err) {
    console.error('[createRecipe] Error:', err);
    return serverError(res, err as Error);
  }
}

/**
 * PUT /api/recipes/:id
 * Update a recipe (admin or owner if pending)
 */
export async function updateRecipe(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const recipeId = parseInt(req.params.id);

  if (isNaN(recipeId)) {
    return validationError(res, 'Invalid recipe ID');
  }

  // Check permissions
  const [recipe] = await q<Recipe[]>(`SELECT * FROM recipes WHERE id = ? AND active = 1`, [
    recipeId,
  ]);

  if (!recipe) {
    return notFound(res, 'Recipe not found');
  }

  // Only admin can edit approved recipes, owner can edit pending
  if (user.roleId !== 'admin') {
    if (recipe.status !== 'pending' || recipe.createdBy !== user.id) {
      return forbidden(res, 'You can only edit your own pending recipes');
    }
  }

  const {
    name,
    description,
    instructions,
    prepTimeMinutes,
    cookTimeMinutes,
    servings,
    difficulty,
    imageUrl,
    sourceUrl,
    sourceType,
    tags,
    active,
    ingredients,
  } = req.body;

  try {
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      if (!isValidString(name, 2)) {
        return validationError(res, 'Recipe name is required (min 2 characters)');
      }
      updates.push('name = ?');
      params.push(name.trim());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description || null);
    }
    if (instructions !== undefined) {
      updates.push('instructions = ?');
      params.push(instructions || null);
    }
    if (prepTimeMinutes !== undefined) {
      updates.push('prepTimeMinutes = ?');
      params.push(prepTimeMinutes || null);
    }
    if (cookTimeMinutes !== undefined) {
      updates.push('cookTimeMinutes = ?');
      params.push(cookTimeMinutes || null);
    }
    if (servings !== undefined) {
      updates.push('servings = ?');
      params.push(servings);
    }
    if (difficulty !== undefined) {
      if (!isValidEnum(difficulty, ['easy', 'medium', 'hard'])) {
        return validationError(res, 'Invalid difficulty');
      }
      updates.push('difficulty = ?');
      params.push(difficulty);
    }
    if (imageUrl !== undefined) {
      updates.push('imageUrl = ?');
      params.push(imageUrl || null);
    }
    if (sourceUrl !== undefined) {
      updates.push('sourceUrl = ?');
      params.push(sourceUrl || null);
    }
    if (sourceType !== undefined) {
      if (!isValidEnum(sourceType, ['manual', 'url', 'imported'])) {
        return validationError(res, 'Invalid source type');
      }
      updates.push('sourceType = ?');
      params.push(sourceType);
    }
    if (tags !== undefined) {
      updates.push('tags = ?');
      params.push(Array.isArray(tags) ? JSON.stringify(tags) : null);
    }
    if (active !== undefined && user.roleId === 'admin') {
      updates.push('active = ?');
      params.push(active ? 1 : 0);
    }

    // Update recipe fields if any
    if (updates.length > 0) {
      params.push(recipeId);
      await q(`UPDATE recipes SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Update ingredients if provided - replace all existing ingredients
    if (ingredients !== undefined && Array.isArray(ingredients)) {
      // Delete existing ingredients
      await q(`DELETE FROM recipe_ingredients WHERE recipeId = ?`, [recipeId]);

      // Insert new ingredients if any
      if (ingredients.length > 0) {
        const ingredientValues = ingredients.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
        const ingredientParams = ingredients.flatMap((ing: any, index: number) => [
          recipeId,
          ing.name,
          ing.catalogItemId || null,
          ing.quantity || 1,
          ing.unit || null,
          ing.notes || null,
          ing.sortOrder ?? index,
        ]);

        await q(
          `INSERT INTO recipe_ingredients (recipeId, name, catalogItemId, quantity, unit, notes, sortOrder)
          VALUES ${ingredientValues}`,
          ingredientParams,
        );
      }
    }

    await logAudit({
      action: 'recipe.update',
      result: 'ok',
      actorId: user.id,
      details: { recipeId, updates: req.body },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * DELETE /api/recipes/:id
 * Soft delete a recipe (admin only)
 */
export async function deleteRecipe(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const recipeId = parseInt(req.params.id);

  if (isNaN(recipeId)) {
    return validationError(res, 'Invalid recipe ID');
  }

  try {
    await q(`UPDATE recipes SET active = 0 WHERE id = ?`, [recipeId]);

    await logAudit({
      action: 'recipe.delete',
      result: 'ok',
      actorId: user.id,
      details: { recipeId },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/recipes/:id/approve
 * Approve a pending recipe (admin only)
 */
export async function approveRecipe(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const recipeId = parseInt(req.params.id);

  if (isNaN(recipeId)) {
    return validationError(res, 'Invalid recipe ID');
  }

  try {
    const [recipe] = await q<Recipe[]>(
      `SELECT id, name, createdBy FROM recipes WHERE id = ? AND status = 'pending'`,
      [recipeId],
    );

    if (!recipe) {
      return notFound(res, 'Pending recipe not found');
    }

    await q(
      `UPDATE recipes SET status = 'approved', approvedBy = ?, approvedAt = NOW() WHERE id = ?`,
      [user.id, recipeId],
    );

    await logAudit({
      action: 'recipe.approve',
      result: 'ok',
      actorId: user.id,
      details: { recipeId },
    });

    // Notify the creator
    if (recipe.createdBy && recipe.createdBy !== user.id) {
      await createNotification({
        userId: recipe.createdBy,
        type: 'meal',
        title: 'Recipe approved!',
        body: `Your recipe "${recipe.name}" has been approved and is now in the recipe book`,
        link: `/recipes/${recipeId}`,
        relatedId: recipeId,
        relatedType: 'recipe',
      });

      // Send email notification
      const creatorEmail = await getUserEmail(recipe.createdBy);
      if (creatorEmail) {
        const [creatorInfo] = await q<Array<{ displayName: string }>>(
          'SELECT displayName FROM users WHERE id = ?',
          [recipe.createdBy],
        );
        await queueEmail({
          userId: recipe.createdBy,
          toEmail: creatorEmail,
          template: 'RECIPE_STATUS',
          variables: {
            userName: creatorInfo?.displayName || 'there',
            recipeName: recipe.name,
            status: 'approved',
            message: 'Your recipe is now available in the family recipe book!',
          },
        });
      }
    }

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/recipes/:id/reject
 * Reject a pending recipe (admin only)
 */
export async function rejectRecipe(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const recipeId = parseInt(req.params.id);
  const { reason } = req.body;

  if (isNaN(recipeId)) {
    return validationError(res, 'Invalid recipe ID');
  }

  try {
    const [recipe] = await q<Recipe[]>(
      `SELECT id, name, createdBy FROM recipes WHERE id = ? AND status = 'pending'`,
      [recipeId],
    );

    if (!recipe) {
      return notFound(res, 'Pending recipe not found');
    }

    await q(`UPDATE recipes SET status = 'rejected' WHERE id = ?`, [recipeId]);

    await logAudit({
      action: 'recipe.reject',
      result: 'ok',
      actorId: user.id,
      details: { recipeId, reason },
    });

    // Notify the creator
    if (recipe.createdBy && recipe.createdBy !== user.id) {
      await createNotification({
        userId: recipe.createdBy,
        type: 'meal',
        title: 'Recipe not approved',
        body: reason
          ? `Your recipe "${recipe.name}" was not approved: ${reason}`
          : `Your recipe "${recipe.name}" was not approved`,
        link: '/recipes',
        relatedId: recipeId,
        relatedType: 'recipe',
      });

      // Send email notification
      const creatorEmail = await getUserEmail(recipe.createdBy);
      if (creatorEmail) {
        const [creatorInfo] = await q<Array<{ displayName: string }>>(
          'SELECT displayName FROM users WHERE id = ?',
          [recipe.createdBy],
        );
        await queueEmail({
          userId: recipe.createdBy,
          toEmail: creatorEmail,
          template: 'RECIPE_STATUS',
          variables: {
            userName: creatorInfo?.displayName || 'there',
            recipeName: recipe.name,
            status: 'not approved',
            message: reason || 'Please review and resubmit if you would like.',
          },
        });
      }
    }

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}
