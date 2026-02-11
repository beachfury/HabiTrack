// apps/web/src/types/meals.ts
// Types for dinner planning, recipes, and meal voting

export type RecipeStatus = 'pending' | 'approved' | 'rejected';
export type RecipeDifficulty = 'easy' | 'medium' | 'hard';
export type MealPlanStatus = 'planned' | 'voting' | 'finalized';
export type ShoppingSuggestionStatus = 'pending' | 'added' | 'dismissed';

// ============================================
// RECIPES
// ============================================

export interface RecipeIngredient {
  id: number;
  recipeId: number;
  name: string;
  catalogItemId: number | null;
  quantity: number;
  unit: string | null;
  notes: string | null;
  sortOrder: number;
}

export interface Recipe {
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
  tags: string[];
  status: RecipeStatus;
  createdBy: number | null;
  createdByName: string | null;
  approvedBy: number | null;
  approvedByName: string | null;
  approvedAt: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  ingredients?: RecipeIngredient[];
}

export interface CreateRecipeData {
  name: string;
  description?: string;
  instructions?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings?: number;
  difficulty?: RecipeDifficulty;
  imageUrl?: string;
  sourceUrl?: string;
  sourceType?: 'manual' | 'url' | 'imported';
  tags?: string[];
  ingredients?: CreateIngredientData[];
}

export interface UpdateRecipeData extends Partial<CreateRecipeData> {
  active?: boolean;
}

export interface CreateIngredientData {
  name: string;
  catalogItemId?: number;
  quantity?: number;
  unit?: string;
  notes?: string;
  sortOrder?: number;
}

export interface UpdateIngredientData extends Partial<CreateIngredientData> {}

// ============================================
// MEAL PLANNING
// ============================================

export interface MealPlan {
  id: number;
  date: string; // YYYY-MM-DD
  mealType: 'dinner';
  recipeId: number | null;
  recipe: Recipe | null;
  customMealName: string | null;
  isFendForYourself: boolean;
  ffyMessage: string | null;
  status: MealPlanStatus;
  votingDeadline: string | null;
  suggestions?: MealSuggestion[];
  suggestionCount?: number;
  finalizedBy: number | null;
  finalizedByName: string | null;
  finalizedAt: string | null;
  notes: string | null;
  createdBy: number | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMealPlanData {
  date: string;
  mealType?: 'dinner';
  recipeId?: number;
  customMealName?: string;
  isFendForYourself?: boolean;
  ffyMessage?: string;
  status?: MealPlanStatus;
  votingDeadline?: string;
  notes?: string;
}

export interface UpdateMealPlanData extends Partial<CreateMealPlanData> {}

// ============================================
// VOTING
// ============================================

export interface MealSuggestion {
  id: number;
  mealPlanId: number;
  recipeId: number | null;
  recipe: Recipe | null;
  customMealName: string | null;
  suggestedBy: number | null;
  suggestedByName: string | null;
  voteCount: number;
  hasVoted: boolean; // Current user has voted for this
  createdAt: string;
}

export interface CreateSuggestionData {
  recipeId?: number;
  customMealName?: string;
}

// ============================================
// SHOPPING INTEGRATION
// ============================================

export interface MealShoppingSuggestion {
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
  status: ShoppingSuggestionStatus;
  addedToListId: number | null;
  addedBy: number | null;
  addedAt: string | null;
}

// ============================================
// SETTINGS
// ============================================

export interface DinnerPlannerSettings {
  enabled: boolean;
  planningDaysAhead: number; // Max 30
  weeklyVotingEnabled: boolean;
  defaultVotingDeadline: string; // e.g., "friday-18:00"
  householdSize: number;
  ffyMessages: string[];
}

export const DEFAULT_DINNER_SETTINGS: DinnerPlannerSettings = {
  enabled: true,
  planningDaysAhead: 7,
  weeklyVotingEnabled: false,
  defaultVotingDeadline: 'friday-18:00',
  householdSize: 4,
  ffyMessages: [
    "🍕 You're on your own tonight!",
    "🎲 Chef's choice - your choice!",
    "🏠 Raid the fridge!",
    "🍿 Snack attack authorized!",
    "🥡 Takeout? Leftovers? You decide!",
  ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getDifficultyLabel = (difficulty: RecipeDifficulty): string => {
  switch (difficulty) {
    case 'easy':
      return 'Easy';
    case 'medium':
      return 'Medium';
    case 'hard':
      return 'Hard';
    default:
      return 'Medium';
  }
};

export const getDifficultyStyle = (difficulty: RecipeDifficulty) => {
  switch (difficulty) {
    case 'easy':
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
        color: 'var(--color-success)',
      };
    case 'hard':
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-destructive) 15%, transparent)',
        color: 'var(--color-destructive)',
      };
    default: // medium
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
        color: 'var(--color-warning)',
      };
  }
};

export const formatCookTime = (prepMinutes: number | null, cookMinutes: number | null): string => {
  const total = (prepMinutes || 0) + (cookMinutes || 0);
  if (total === 0) return '';
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const getMealStatusLabel = (status: MealPlanStatus): string => {
  switch (status) {
    case 'planned':
      return 'Planned';
    case 'voting':
      return 'Voting Open';
    case 'finalized':
      return 'Finalized';
    default:
      return status;
  }
};

export const getMealStatusStyle = (status: MealPlanStatus) => {
  switch (status) {
    case 'voting':
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
        color: 'var(--color-primary)',
      };
    case 'finalized':
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
        color: 'var(--color-success)',
      };
    default: // planned
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-muted-foreground) 15%, transparent)',
        color: 'var(--color-muted-foreground)',
      };
  }
};
