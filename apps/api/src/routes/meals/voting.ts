// apps/api/src/routes/meals/voting.ts
// Meal voting routes

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import { createNotification } from '../messages';
import { queueEmail, getActiveUsersWithEmail } from '../../email/queue';
import {
  getUser,
  success,
  created,
  notFound,
  serverError,
  validationError,
  forbidden,
} from '../../utils';

interface MealPlan {
  id: number;
  date: string;
  status: string;
  votingDeadline: string | null;
}

/**
 * POST /api/meals/:id/open-voting
 * Open voting for a meal plan (admin only)
 */
export async function openVoting(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const mealPlanId = parseInt(req.params.id);
  const { deadline } = req.body;

  if (isNaN(mealPlanId)) {
    return validationError(res, 'Invalid meal plan ID');
  }

  try {
    const [mealPlan] = await q<MealPlan[]>(`SELECT id, date, status FROM meal_plans WHERE id = ?`, [
      mealPlanId,
    ]);

    if (!mealPlan) {
      return notFound(res, 'Meal plan not found');
    }

    if (mealPlan.status === 'finalized') {
      return validationError(res, 'Cannot open voting for a finalized meal');
    }

    await q(
      `UPDATE meal_plans SET
        status = 'voting',
        votingDeadline = ?,
        recipeId = NULL,
        customMealName = NULL,
        isFendForYourself = 0
      WHERE id = ?`,
      [deadline || null, mealPlanId],
    );

    await logAudit({
      action: 'meal.voting.open',
      result: 'ok',
      actorId: user.id,
      details: { mealPlanId, deadline },
    });

    // Notify all users about voting
    const allUsers = await q<{ id: number }[]>(`SELECT id FROM users WHERE id != ?`, [user.id]);

    for (const u of allUsers) {
      await createNotification({
        userId: u.id,
        type: 'meal',
        title: 'Meal voting is open!',
        body: `Vote for what you want for dinner on ${mealPlan.date}`,
        link: `/meals/${mealPlan.date}`,
        relatedId: mealPlanId,
        relatedType: 'meal',
      });
    }

    // Send email notifications
    const activeUsers = await getActiveUsersWithEmail();
    for (const recipient of activeUsers) {
      if (recipient.id !== user.id) {
        await queueEmail({
          userId: recipient.id,
          toEmail: recipient.email,
          template: 'VOTING_OPENED',
          variables: {
            userName: recipient.displayName,
            mealDate: mealPlan.date,
            deadline: deadline || 'soon',
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
 * POST /api/meals/:id/suggestions
 * Add a meal suggestion for voting (any user)
 */
export async function addSuggestion(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const mealPlanId = parseInt(req.params.id);
  const { recipeId, customMealName } = req.body;

  if (isNaN(mealPlanId)) {
    return validationError(res, 'Invalid meal plan ID');
  }

  if (!recipeId && !customMealName) {
    return validationError(res, 'Must specify a recipe or custom meal name');
  }

  try {
    // Verify meal plan exists and is in voting status
    const [mealPlan] = await q<MealPlan[]>(
      `SELECT id, status, votingDeadline FROM meal_plans WHERE id = ?`,
      [mealPlanId],
    );

    if (!mealPlan) {
      return notFound(res, 'Meal plan not found');
    }

    if (mealPlan.status !== 'voting') {
      return validationError(res, 'Voting is not open for this meal');
    }

    // Check if deadline has passed
    if (mealPlan.votingDeadline && new Date(mealPlan.votingDeadline) < new Date()) {
      return validationError(res, 'Voting deadline has passed');
    }

    // Check if user already suggested this recipe/meal
    const [existing] = await q<{ id: number }[]>(
      `SELECT id FROM meal_suggestions
       WHERE mealPlanId = ?
         AND (
           (recipeId IS NOT NULL AND recipeId = ?)
           OR (customMealName IS NOT NULL AND customMealName = ?)
         )`,
      [mealPlanId, recipeId || null, customMealName || null],
    );

    if (existing) {
      return validationError(res, 'This meal has already been suggested');
    }

    const result: any = await q(
      `INSERT INTO meal_suggestions (mealPlanId, recipeId, customMealName, suggestedBy)
       VALUES (?, ?, ?, ?)`,
      [mealPlanId, recipeId || null, customMealName || null, user.id],
    );

    await logAudit({
      action: 'meal.suggestion.add',
      result: 'ok',
      actorId: user.id,
      details: { mealPlanId, suggestionId: result.insertId, recipeId, customMealName },
    });

    return created(res, { id: result.insertId });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * DELETE /api/meals/:id/suggestions/:suggestionId
 * Remove a meal suggestion (admin or owner)
 */
export async function deleteSuggestion(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const mealPlanId = parseInt(req.params.id);
  const suggestionId = parseInt(req.params.suggestionId);

  if (isNaN(mealPlanId) || isNaN(suggestionId)) {
    return validationError(res, 'Invalid meal plan or suggestion ID');
  }

  try {
    // Verify ownership or admin
    const [suggestion] = await q<{ id: number; suggestedBy: number | null }[]>(
      `SELECT id, suggestedBy FROM meal_suggestions WHERE id = ? AND mealPlanId = ?`,
      [suggestionId, mealPlanId],
    );

    if (!suggestion) {
      return notFound(res, 'Suggestion not found');
    }

    if (user.roleId !== 'admin' && suggestion.suggestedBy !== user.id) {
      return forbidden(res, 'You can only delete your own suggestions');
    }

    await q(`DELETE FROM meal_suggestions WHERE id = ?`, [suggestionId]);

    await logAudit({
      action: 'meal.suggestion.delete',
      result: 'ok',
      actorId: user.id,
      details: { mealPlanId, suggestionId },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/meals/:id/vote
 * Cast a vote for a suggestion (any user)
 * User can only have one vote per meal plan
 */
export async function castVote(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const mealPlanId = parseInt(req.params.id);
  const { suggestionId } = req.body;

  if (isNaN(mealPlanId)) {
    return validationError(res, 'Invalid meal plan ID');
  }

  if (!suggestionId) {
    return validationError(res, 'suggestionId is required');
  }

  try {
    // Verify meal plan is in voting status
    const [mealPlan] = await q<MealPlan[]>(
      `SELECT id, status, votingDeadline FROM meal_plans WHERE id = ?`,
      [mealPlanId],
    );

    if (!mealPlan) {
      return notFound(res, 'Meal plan not found');
    }

    if (mealPlan.status !== 'voting') {
      return validationError(res, 'Voting is not open for this meal');
    }

    // Check if deadline has passed
    if (mealPlan.votingDeadline && new Date(mealPlan.votingDeadline) < new Date()) {
      return validationError(res, 'Voting deadline has passed');
    }

    // Verify suggestion exists and belongs to this meal plan
    const [suggestion] = await q<{ id: number }[]>(
      `SELECT id FROM meal_suggestions WHERE id = ? AND mealPlanId = ?`,
      [suggestionId, mealPlanId],
    );

    if (!suggestion) {
      return notFound(res, 'Suggestion not found');
    }

    // Remove any existing vote for this meal plan
    await q(
      `DELETE mv FROM meal_votes mv
       JOIN meal_suggestions ms ON mv.mealSuggestionId = ms.id
       WHERE ms.mealPlanId = ? AND mv.userId = ?`,
      [mealPlanId, user.id],
    );

    // Cast new vote
    await q(`INSERT INTO meal_votes (mealSuggestionId, userId) VALUES (?, ?)`, [
      suggestionId,
      user.id,
    ]);

    await logAudit({
      action: 'meal.vote.cast',
      result: 'ok',
      actorId: user.id,
      details: { mealPlanId, suggestionId },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * DELETE /api/meals/:id/vote/:suggestionId
 * Remove a vote (any user)
 */
export async function removeVote(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const mealPlanId = parseInt(req.params.id);
  const suggestionId = parseInt(req.params.suggestionId);

  if (isNaN(mealPlanId) || isNaN(suggestionId)) {
    return validationError(res, 'Invalid meal plan or suggestion ID');
  }

  try {
    // Verify meal plan is in voting status
    const [mealPlan] = await q<MealPlan[]>(
      `SELECT id, status, votingDeadline FROM meal_plans WHERE id = ?`,
      [mealPlanId],
    );

    if (!mealPlan) {
      return notFound(res, 'Meal plan not found');
    }

    if (mealPlan.status !== 'voting') {
      return validationError(res, 'Voting is not open for this meal');
    }

    // Check if deadline has passed
    if (mealPlan.votingDeadline && new Date(mealPlan.votingDeadline) < new Date()) {
      return validationError(res, 'Voting deadline has passed');
    }

    await q(`DELETE FROM meal_votes WHERE mealSuggestionId = ? AND userId = ?`, [
      suggestionId,
      user.id,
    ]);

    await logAudit({
      action: 'meal.vote.remove',
      result: 'ok',
      actorId: user.id,
      details: { mealPlanId, suggestionId },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/meals/voting-reminders
 * Send reminders for meals with voting deadlines in the next 24 hours
 * This can be called by a cron job or external scheduler
 */
export async function sendVotingReminders(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  // Only admins can trigger reminders
  if (user.roleId !== 'admin') {
    return forbidden(res, 'Admin access required');
  }

  try {
    // Find meals with voting deadline in the next 24 hours
    const mealsWithDeadline = await q<{ id: number; date: string; votingDeadline: string }[]>(
      `SELECT id, date, votingDeadline
       FROM meal_plans
       WHERE status = 'voting'
         AND votingDeadline IS NOT NULL
         AND votingDeadline > NOW()
         AND votingDeadline <= DATE_ADD(NOW(), INTERVAL 24 HOUR)`,
    );

    if (mealsWithDeadline.length === 0) {
      return success(res, { success: true, reminders: 0 });
    }

    // Get all users
    const allUsers = await q<{ id: number; displayName: string }[]>(
      `SELECT id, displayName FROM users WHERE active = 1`,
    );

    let reminderCount = 0;

    for (const meal of mealsWithDeadline) {
      // Get suggestions for this meal
      const suggestions = await q<{ id: number }[]>(
        `SELECT id FROM meal_suggestions WHERE mealPlanId = ?`,
        [meal.id],
      );

      const suggestionIds = suggestions.map((s) => s.id);

      // Find users who haven't voted yet
      for (const u of allUsers) {
        // Check if user has voted for any suggestion on this meal
        const [hasVoted] = await q<{ count: number }[]>(
          `SELECT COUNT(*) as count
           FROM meal_votes
           WHERE mealSuggestionId IN (${suggestionIds.length > 0 ? suggestionIds.map(() => '?').join(',') : '0'})
             AND userId = ?`,
          [...suggestionIds, u.id],
        );

        if (!hasVoted || hasVoted.count === 0) {
          // User hasn't voted - send reminder
          await createNotification({
            userId: u.id,
            type: 'meal',
            title: 'Voting closes soon!',
            body: `Don't forget to vote for dinner on ${meal.date}`,
            link: `/meals?date=${meal.date}`,
            relatedId: meal.id,
            relatedType: 'meal',
          });
          reminderCount++;
        }
      }
    }

    // Also send email reminders to users who haven't voted
    const activeUsersEmail = await getActiveUsersWithEmail();
    for (const meal of mealsWithDeadline) {
      const suggestions = await q<{ id: number }[]>(
        `SELECT id FROM meal_suggestions WHERE mealPlanId = ?`,
        [meal.id],
      );
      const suggestionIds = suggestions.map((s) => s.id);

      for (const recipient of activeUsersEmail) {
        const [hasVoted] = await q<{ count: number }[]>(
          `SELECT COUNT(*) as count FROM meal_votes
           WHERE mealSuggestionId IN (${suggestionIds.length > 0 ? suggestionIds.map(() => '?').join(',') : '0'})
             AND userId = ?`,
          [...suggestionIds, recipient.id],
        );

        if (!hasVoted || hasVoted.count === 0) {
          await queueEmail({
            userId: recipient.id,
            toEmail: recipient.email,
            template: 'VOTING_OPENED',
            variables: {
              userName: recipient.displayName,
              mealDate: meal.date,
              deadline: 'less than 24 hours',
            },
          });
        }
      }
    }

    await logAudit({
      action: 'meal.voting.reminders',
      result: 'ok',
      actorId: user.id,
      details: { mealsCount: mealsWithDeadline.length, reminders: reminderCount },
    });

    return success(res, { success: true, reminders: reminderCount });
  } catch (err) {
    return serverError(res, err as Error);
  }
}
