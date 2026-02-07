// apps/web/src/api/shopping.ts
// Shopping API endpoints

import { apiClient } from './client';
import type {
  ShoppingCategory,
  ShoppingStore,
  CatalogItem,
  CatalogItemPrice,
  ShoppingListItem,
  ShoppingRequest,
  Suggestion,
  StoreRequest,
  AnalyticsData,
  PurchaseHistory,
  AddToListData,
  CreateCatalogItemData,
  CreateShoppingRequestData,
  ApproveRequestData,
  ShoppingTotals,
} from '../types';

export const shoppingApi = {
  // =============================================================================
  // Categories
  // =============================================================================
  getCategories(): Promise<{ categories: ShoppingCategory[] }> {
    return apiClient['get']('/shopping/categories', { params: undefined });
  },

  createCategory(name: string, color?: string): Promise<{ id: number }> {
    return apiClient['post']('/shopping/categories', { name, color });
  },

  updateCategory(
    id: number,
    data: { name?: string; color?: string },
  ): Promise<{ success: boolean }> {
    return apiClient['put'](`/shopping/categories/${id}`, data);
  },

  deleteCategory(id: number): Promise<{ success: boolean }> {
    return apiClient['delete'](`/shopping/categories/${id}`, undefined);
  },

  // =============================================================================
  // Stores
  // =============================================================================
  getStores(): Promise<{ stores: ShoppingStore[] }> {
    return apiClient['get']('/shopping/stores', { params: undefined });
  },

  createStore(name: string): Promise<{ id: number }> {
    return apiClient['post']('/shopping/stores', { name });
  },

  getStoreRequests(): Promise<{ requests: StoreRequest[] }> {
    return apiClient['get']('/shopping/stores/requests', { params: undefined });
  },

  requestStore(name: string): Promise<{ id: number }> {
    return apiClient['post']('/shopping/stores/request', { name });
  },

  approveStoreRequest(id: number): Promise<{ success: boolean }> {
    return apiClient['post'](`/shopping/stores/requests/${id}/approve`);
  },

  denyStoreRequest(id: number): Promise<{ success: boolean }> {
    return apiClient['post'](`/shopping/stores/requests/${id}/deny`);
  },

  // =============================================================================
  // Catalog Items
  // =============================================================================
  getCatalogItems(search?: string): Promise<{ items: CatalogItem[] }> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiClient['get'](`/shopping/catalog${params}`, { params: undefined });
  },

  getCatalogItem(id: number): Promise<{ item: CatalogItem }> {
    return apiClient['get'](`/shopping/catalog/${id}`, { params: undefined });
  },

  // FIXED: Now only takes itemId (was incorrectly taking 3 params)
  getCatalogItemPrices(itemId: number): Promise<{ prices: CatalogItemPrice[] }> {
    return apiClient['get'](`/shopping/catalog/${itemId}/prices`, { params: undefined });
  },

  // NEW: Set price for a catalog item at a specific store
  setCatalogItemPrice(
    itemId: number,
    storeId: number,
    price: number,
    unit?: string,
  ): Promise<{ success: boolean }> {
    return apiClient['post'](`/shopping/catalog/${itemId}/prices`, {
      storeId,
      price,
      unit,
    });
  },

  createCatalogItem(data: CreateCatalogItemData): Promise<{ id: number }> {
    return apiClient['post']('/shopping/catalog', data);
  },

  updateCatalogItem(
    id: number,
    data: Partial<CreateCatalogItemData>,
  ): Promise<{ success: boolean }> {
    return apiClient['put'](`/shopping/catalog/${id}`, data);
  },

  deleteCatalogItem(id: number): Promise<{ success: boolean }> {
    return apiClient['delete'](`/shopping/catalog/${id}`, undefined);
  },

  // =============================================================================
  // Shopping List
  // =============================================================================
  getShoppingList(status?: string): Promise<{
    items: ShoppingListItem[];
    totals: ShoppingTotals;
  }> {
    const params = status ? `?status=${status}` : '';
    return apiClient['get'](`/shopping/list${params}`, { params: undefined });
  },

  addToShoppingList(data: AddToListData): Promise<{ id: number }> {
    return apiClient['post']('/shopping/list', data);
  },

  updateListItem(id: number, data: Partial<AddToListData>): Promise<{ success: boolean }> {
    return apiClient['put'](`/shopping/list/${id}`, data);
  },

  removeFromShoppingList(id: number): Promise<{ success: boolean }> {
    return apiClient['delete'](`/shopping/list/${id}`, undefined);
  },

  markAsPurchased(
    id: number,
    data?: { price?: number; storeId?: number },
  ): Promise<{ success: boolean }> {
    return apiClient['post'](`/shopping/list/${id}/purchase`, data || {});
  },

  // =============================================================================
  // Requests (for kids/members to request items)
  // =============================================================================
  getRequests(): Promise<{ requests: ShoppingRequest[] }> {
    return apiClient['get']('/shopping/requests', { params: undefined });
  },

  createRequest(data: CreateShoppingRequestData): Promise<{ id: number }> {
    return apiClient['post']('/shopping/requests', data);
  },

  approveRequest(
    id: number,
    data: ApproveRequestData,
  ): Promise<{ success: boolean; catalogItemId?: number }> {
    return apiClient['post'](`/shopping/requests/${id}/approve`, data);
  },

  denyRequest(id: number): Promise<{ success: boolean }> {
    return apiClient['post'](`/shopping/requests/${id}/deny`);
  },

  // =============================================================================
  // Suggestions (AI predictions)
  // =============================================================================
  getSuggestions(): Promise<{
    suggestions: Suggestion[];
    dueThisWeek: Suggestion[];
    stats: {
      totalSuggestions: number;
      highConfidence: number;
      mediumConfidence: number;
      lowConfidence: number;
      dueThisWeekCount: number;
    };
  }> {
    return apiClient['get']('/shopping/suggestions', { params: undefined });
  },

  addAllSuggestions(
    confidenceLevel?: string,
  ): Promise<{ success: boolean; addedCount: number; message: string }> {
    return apiClient['post']('/shopping/suggestions/add-all', { confidenceLevel });
  },

  addSuggestion(
    catalogItemId: number,
    quantity?: number,
    storeId?: number | null,
  ): Promise<{ id: number; quantity: number; storeId: number | null }> {
    return apiClient['post'](`/shopping/suggestions/${catalogItemId}/add`, { quantity, storeId });
  },

  // =============================================================================
  // Analytics & History
  // =============================================================================
  getAnalytics(days?: number): Promise<AnalyticsData> {
    const params = days ? `?days=${days}` : '';
    return apiClient['get'](`/shopping/analytics${params}`, { params: undefined });
  },

  getHistory(days?: number): Promise<{ purchases: PurchaseHistory[] }> {
    const params = days ? `?days=${days}` : '';
    return apiClient['get'](`/shopping/history${params}`, { params: undefined });
  },

  // =============================================================================
  // Image Upload
  // =============================================================================
  uploadImage(imageData: string, contentType: string): Promise<{ imageKey: string }> {
    return apiClient['post']('/shopping/upload-image', { imageData, contentType });
  },
};
