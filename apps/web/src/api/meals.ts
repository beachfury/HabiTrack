// apps/web/src/api/meals.ts
// Meals / Dinner Planner API endpoints

import { apiClient } from './client';
import type {
  Recipe,
  RecipeIngredient,
  MealPlan,
  MealSuggestion,
  MealShoppingSuggestion,
  CreateRecipeData,
  UpdateRecipeData,
  CreateIngredientData,
  UpdateIngredientData,
  CreateMealPlanData,
  UpdateMealPlanData,
  CreateSuggestionData,
  RecipeStatus,
  RecipeDifficulty,
} from '../types/meals';

export const mealsApi = {
  // =============================================================================
  // Recipes
  // =============================================================================
  getRecipes(params?: {
    status?: RecipeStatus;
    search?: string;
    difficulty?: RecipeDifficulty;
    tag?: string;
  }): Promise<{ recipes: Recipe[] }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.difficulty) searchParams.set('difficulty', params.difficulty);
    if (params?.tag) searchParams.set('tag', params.tag);
    const query = searchParams.toString();
    return apiClient['get'](`/recipes${query ? `?${query}` : ''}`, { params: undefined });
  },

  getRecipe(id: number): Promise<{ recipe: Recipe & { ingredients: RecipeIngredient[] } }> {
    return apiClient['get'](`/recipes/${id}`, { params: undefined });
  },

  createRecipe(data: CreateRecipeData): Promise<{ id: number; status: RecipeStatus }> {
    return apiClient['post']('/recipes', data);
  },

  updateRecipe(id: number, data: UpdateRecipeData): Promise<{ success: boolean }> {
    return apiClient['put'](`/recipes/${id}`, data);
  },

  deleteRecipe(id: number): Promise<{ success: boolean }> {
    return apiClient['delete'](`/recipes/${id}`, undefined);
  },

  approveRecipe(id: number): Promise<{ success: boolean }> {
    return apiClient['post'](`/recipes/${id}/approve`, {});
  },

  rejectRecipe(id: number, reason?: string): Promise<{ success: boolean }> {
    return apiClient['post'](`/recipes/${id}/reject`, { reason });
  },

  // =============================================================================
  // Recipe Ingredients
  // =============================================================================
  addIngredient(recipeId: number, data: CreateIngredientData): Promise<{ id: number }> {
    return apiClient['post'](`/recipes/${recipeId}/ingredients`, data);
  },

  updateIngredient(
    recipeId: number,
    ingredientId: number,
    data: UpdateIngredientData,
  ): Promise<{ success: boolean }> {
    return apiClient['put'](`/recipes/${recipeId}/ingredients/${ingredientId}`, data);
  },

  deleteIngredient(recipeId: number, ingredientId: number): Promise<{ success: boolean }> {
    return apiClient['delete'](`/recipes/${recipeId}/ingredients/${ingredientId}`, undefined);
  },

  reorderIngredients(recipeId: number, ingredientIds: number[]): Promise<{ success: boolean }> {
    return apiClient['post'](`/recipes/${recipeId}/ingredients/reorder`, { ingredientIds });
  },

  // =============================================================================
  // Recipe Images
  // =============================================================================
  uploadRecipeImage(
    recipeId: number,
    image: string,
    mimeType: string,
  ): Promise<{ success: boolean; imageUrl: string }> {
    return apiClient['post'](`/upload/recipe/${recipeId}`, { image, mimeType });
  },

  deleteRecipeImage(recipeId: number): Promise<{ success: boolean }> {
    return apiClient['delete'](`/upload/recipe/${recipeId}`, undefined);
  },

  // =============================================================================
  // Meal Plans
  // =============================================================================
  getMealPlans(params: {
    startDate: string;
    endDate: string;
  }): Promise<{ mealPlans: MealPlan[] }> {
    const searchParams = new URLSearchParams();
    searchParams.set('startDate', params.startDate);
    searchParams.set('endDate', params.endDate);
    return apiClient['get'](`/meals?${searchParams.toString()}`, { params: undefined });
  },

  getMealPlan(date: string): Promise<{ mealPlan: MealPlan & { suggestions: MealSuggestion[] } }> {
    return apiClient['get'](`/meals/${date}`, { params: undefined });
  },

  createMealPlan(data: CreateMealPlanData): Promise<{ id: number }> {
    return apiClient['post']('/meals', data);
  },

  updateMealPlan(id: number, data: UpdateMealPlanData): Promise<{ success: boolean }> {
    return apiClient['put'](`/meals/${id}`, data);
  },

  deleteMealPlan(id: number): Promise<{ success: boolean }> {
    return apiClient['delete'](`/meals/${id}`, undefined);
  },

  setFendForYourself(id: number, message?: string): Promise<{ success: boolean }> {
    return apiClient['post'](`/meals/${id}/ffy`, { message });
  },

  finalizeMealPlan(
    id: number,
    options?: { overrideRecipeId?: number; overrideCustomName?: string },
  ): Promise<{ success: boolean }> {
    return apiClient['post'](`/meals/${id}/finalize`, options || {});
  },

  // =============================================================================
  // Voting
  // =============================================================================
  openVoting(mealPlanId: number, deadline?: string): Promise<{ success: boolean }> {
    return apiClient['post'](`/meals/${mealPlanId}/open-voting`, { deadline });
  },

  addSuggestion(mealPlanId: number, data: CreateSuggestionData): Promise<{ id: number }> {
    return apiClient['post'](`/meals/${mealPlanId}/suggestions`, data);
  },

  deleteSuggestion(mealPlanId: number, suggestionId: number): Promise<{ success: boolean }> {
    return apiClient['delete'](`/meals/${mealPlanId}/suggestions/${suggestionId}`, undefined);
  },

  castVote(mealPlanId: number, suggestionId: number): Promise<{ success: boolean }> {
    return apiClient['post'](`/meals/${mealPlanId}/vote`, { suggestionId });
  },

  removeVote(mealPlanId: number, suggestionId: number): Promise<{ success: boolean }> {
    return apiClient['delete'](`/meals/${mealPlanId}/vote/${suggestionId}`, undefined);
  },

  // =============================================================================
  // Shopping Suggestions
  // =============================================================================
  getShoppingSuggestions(status?: string): Promise<{ suggestions: MealShoppingSuggestion[] }> {
    const query = status ? `?status=${status}` : '';
    return apiClient['get'](`/meals/shopping-suggestions${query}`, { params: undefined });
  },

  generateShoppingSuggestions(
    mealPlanId: number,
    householdSize?: number,
  ): Promise<{ success: boolean; count: number }> {
    return apiClient['post'](`/meals/${mealPlanId}/shopping-suggestions/generate`, {
      householdSize,
    });
  },

  addShoppingSuggestion(
    suggestionId: number,
    useScaledQuantity?: boolean,
  ): Promise<{ success: boolean; addedToListId: number | null }> {
    return apiClient['post'](`/meals/shopping-suggestions/${suggestionId}/add`, {
      useScaledQuantity,
    });
  },

  dismissShoppingSuggestion(suggestionId: number): Promise<{ success: boolean }> {
    return apiClient['post'](`/meals/shopping-suggestions/${suggestionId}/dismiss`, {});
  },

  bulkAddShoppingSuggestions(
    suggestionIds: number[],
    useScaledQuantity?: boolean,
  ): Promise<{ success: boolean; addedCount: number }> {
    return apiClient['post']('/meals/shopping-suggestions/bulk-add', {
      suggestionIds,
      useScaledQuantity,
    });
  },
};
