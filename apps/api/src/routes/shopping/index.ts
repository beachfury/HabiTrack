// apps/api/src/routes/shopping/index.ts
// Shopping routes - central export

// Categories & Stores
export {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getStores,
  createStore,
  requestStore,
  getStoreRequests,
  approveStoreRequest,
  denyStoreRequest,
} from './stores';

// Catalog Items
export {
  getCatalogItems,
  getCatalogItem,
  getCatalogItemPrices,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  setCatalogItemPrice,
} from './catalog';

// Shopping List
export {
  getShoppingList,
  addToList,
  updateListItem,
  removeFromList,
  markPurchased,
  // Requests, History, Analytics
  getRequests,
  createRequest,
  approveRequest,
  denyRequest,
  getHistory,
  getAnalytics,
} from './list';

// Suggestions
export { getSuggestions, addAllSuggestions, addSuggestion } from './suggestions';
