// apps/web/src/types/shopping.ts
// Shopping-related types

export type ListType = 'need' | 'want';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type SuggestionType = 'overdue' | 'due_soon' | 'popular' | 'frequently_bought' | 'low_stock';

// Confidence level colors for badges
export const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  high: 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-300',
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

// List type colors
export const LIST_TYPE_COLORS: Record<ListType, string> = {
  need: 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300',
  want: 'bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-300',
};

export interface ShoppingCategory {
  id: number;
  name: string;
  color: string;
  isDefault: boolean;
}

export interface ShoppingStore {
  id: number;
  name: string;
  isDefault: boolean;
}

export interface CatalogItem {
  id: number;
  name: string;
  brand: string | null;
  sizeText: string | null;
  categoryId: number | null;
  categoryName: string | null;
  imageUrl: string | null;
  lowestPrice: number | null;
  active: boolean;
}

export interface CatalogItemPrice {
  storeId: number;
  storeName: string;
  price: number;
  unit: string | null;
  observedAt: string;
}

export interface ShoppingListItem {
  id: number;
  catalogItemId: number;
  itemName: string;
  brand: string | null;
  sizeText: string | null;
  categoryId: number | null;
  categoryName: string | null;
  imageUrl: string | null;
  listType: ListType;
  quantity: number;
  storeId: number | null;
  storeName: string | null;
  storePrice: number | null;
  lowestPrice: number | null;
  purchasedToday: boolean;
}

export interface ShoppingRequest {
  imageKey: any;
  id: number;
  name: string;
  brand: string | null;
  categoryId: number | null;
  categoryName: string | null;
  imageUrl: string | null;
  requestType: ListType;
  status: 'pending' | 'approved' | 'denied';
  requestedBy: number;
  requestedByName: string;
  reviewedBy: number | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
}

export interface Suggestion {
  catalogItemId: number;
  itemName: string;
  brand: string | null;
  imageUrl: string | null;
  categoryName: string | null;
  confidence: ConfidenceLevel;
  reason: string;
  daysSinceLast: number | null;
  avgInterval: number | null;
  // Enhanced prediction fields
  suggestedQuantity: number;
  suggestedStoreId: number | null;
  suggestedStoreName: string | null;
  bestPrice: number | null;
  suggestionType: SuggestionType;
}

export interface SuggestionsResponse {
  suggestions: Suggestion[];
  dueThisWeek: Suggestion[];
  stats: SuggestionStats;
}

export interface SuggestionStats {
  totalSuggestions: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  dueThisWeekCount: number;
}

export interface StoreRequest {
  id: number;
  name: string;
  status: 'pending' | 'approved' | 'denied';
  requestedBy: number;
  requestedByName: string;
  createdAt: string;
}

export interface AnalyticsData {
  totalSpent: number;
  purchaseCount: number;
  categorySpending: Array<{
    categoryName: string;
    total: number;
    count: number;
  }>;
}

export interface PurchaseHistory {
  id: number;
  purchasedAt: string;
  itemName: string;
  brand: string | null;
  categoryName: string | null;
  storeName: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  purchasedByName: string | null;
}

export interface ShoppingTotals {
  needsOnly: number;
  needsPlusWants: number;
}

export interface AddToListData {
  catalogItemId: number;
  storeId?: number | null;
  listType?: ListType;
  quantity?: number;
}

export interface CreateCatalogItemData {
  name: string;
  brand?: string;
  sizeText?: string;
  categoryId?: number;
  imageUrl?: string;
  prices?: Array<{ storeId: number; price: number }>;
}

export interface CreateShoppingRequestData {
  name: string;
  brand?: string;
  category?: string;
  packageSize?: string;
  imageKey?: string;
  requestType?: ListType;
}

export interface ApproveRequestData {
  catalogItemId?: number;
  name?: string;
  brand?: string;
  categoryId?: number;
  addToList?: boolean;
}
