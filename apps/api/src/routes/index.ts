// apps/api/src/routes/index.ts
// Central routes export - organized by feature

// Feature modules
export * as chores from './chores';
export * as shopping from './shopping';
export * as auth from './auth';
export * as calendar from './calendar';
export * as family from './family';
export * as settings from './settings';
export * as messages from './messages';
export * as admin from './admin';
export * as meals from './meals';

// Standalone routes
export * as bootstrap from './bootstrap';
export * as permissions from './permissions';
export * as upload from './upload';

// Re-export for easy access
export {
  // Chore categories
  getCategories as getChoreCategories,
  createCategory as createChoreCategory,
  updateCategory as updateChoreCategory,
  deleteCategory as deleteChoreCategory,
  // Chore definitions
  getChores,
  getChore,
  createChore,
  updateChore,
  deleteChore,
  hardDeleteChore,
  // Chore instances
  getInstances as getChoreInstances,
  completeInstance as completeChoreInstance,
  approveInstance as approveChoreInstance,
  rejectInstance as rejectChoreInstance,
  skipInstance as skipChoreInstance,
  reassignInstance as reassignChoreInstance,
  // Chore stats
  getStats as getChoreStats,
  getLeaderboard as getChoreLeaderboard,
  adjustPoints,
} from './chores';

export {
  // Shopping categories
  getCategories as getShoppingCategories,
  createCategory as createShoppingCategory,
  updateCategory as updateShoppingCategory,
  deleteCategory as deleteShoppingCategory,
  // Stores
  getStores,
  createStore,
  requestStore,
  getStoreRequests,
  approveStoreRequest,
  denyStoreRequest,
  // Catalog
  getCatalogItems,
  getCatalogItem,
  getCatalogItemPrices,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  setCatalogItemPrice,
  // Shopping list
  getShoppingList,
  addToList,
  updateListItem,
  removeFromList,
  markPurchased,
  // Suggestions
  getSuggestions,
  addAllSuggestions,
  // Requests, History, Analytics
  getRequests,
  createRequest,
  approveRequest,
  denyRequest,
  getHistory,
  getAnalytics,
} from './shopping';
