// apps/api/src/routes/meals/index.ts
// Meals routes - central export

// Recipes
export {
  getRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  approveRecipe,
  rejectRecipe,
} from './recipes';

// Recipe Ingredients
export {
  addIngredient,
  updateIngredient,
  deleteIngredient,
  reorderIngredients,
} from './ingredients';

// Meal Plans
export {
  getMealPlans,
  getMealPlan,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  setFendForYourself,
  finalizeMealPlan,
} from './plans';

// Voting
export {
  openVoting,
  addSuggestion,
  deleteSuggestion,
  castVote,
  removeVote,
  sendVotingReminders,
} from './voting';

// Shopping Suggestions
export {
  getShoppingSuggestions,
  generateShoppingSuggestions,
  addShoppingSuggestion,
  dismissShoppingSuggestion,
  bulkAddShoppingSuggestions,
} from './shopping';
