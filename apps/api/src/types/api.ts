// apps/api/src/types/api.ts
// Shared API request/response types

// =============================================================================
// COMMON
// =============================================================================
export interface ApiError {
  code: string;
  message?: string;
  details?: Record<string, any>;
}

export interface ApiResponse<T = void> {
  data?: T;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// =============================================================================
// AUTH
// =============================================================================
export interface LoginRequest {
  userId?: number;
  email?: string;
  secret: string;
}

export interface LoginResponse {
  success: boolean;
  user?: {
    id: number;
    displayName: string;
    role: string;
  };
}

export interface RegisterRequest {
  userId: number;
  secret: string;
}

export interface ChangePasswordRequest {
  oldSecret: string;
  newSecret: string;
}

export interface ForgotPasswordRequest {
  userId: number;
}

export interface ResetPasswordRequest {
  userId: number;
  code: string;
  newSecret: string;
}

export interface PinLoginRequest {
  userId: number;
  pin: string;
}

export interface SessionInfo {
  valid: boolean;
  userId?: number;
  role?: string;
  expiresAt?: Date;
}

// =============================================================================
// USER
// =============================================================================
export interface UserInfo {
  id: number;
  displayName: string;
  nickname?: string | null;
  email?: string | null;
  role: string;
  color?: string | null;
  avatarUrl?: string | null;
  theme?: string | null;
  accentColor?: string | null;
}

export interface UserSettings {
  id: number;
  displayName: string;
  nickname?: string | null;
  email?: string | null;
  color?: string | null;
  theme?: string | null;
  accentColor?: string | null;
  avatarUrl?: string | null;
}

export interface UpdateUserSettingsRequest {
  nickname?: string | null;
  email?: string | null;
  color?: string | null;
  theme?: string | null;
  accentColor?: string | null;
}

// =============================================================================
// FAMILY
// =============================================================================
export interface FamilyMember {
  id: number;
  displayName: string;
  nickname?: string | null;
  email?: string | null;
  role: string;
  color?: string | null;
  active: boolean;
  hasPassword: boolean;
  hasPin: boolean;
  createdAt: Date;
}

export interface CreateMemberRequest {
  displayName: string;
  nickname?: string;
  email?: string;
  role: 'admin' | 'member' | 'kid';
  color?: string;
  password?: string;
  pin?: string;
}

export interface UpdateMemberRequest {
  displayName?: string;
  nickname?: string | null;
  email?: string | null;
  role?: 'admin' | 'member' | 'kid';
  color?: string | null;
  active?: boolean;
}

// =============================================================================
// CALENDAR
// =============================================================================
export interface CalendarEvent {
  id: number;
  title: string;
  description?: string | null;
  start: Date;
  end?: Date | null;
  allDay: boolean;
  color?: string | null;
  location?: string | null;
  createdBy: number;
  createdByName: string;
  assignedTo?: number | null;
  assignedToName?: string | null;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color?: string;
  location?: string;
  assignedTo?: number;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string | null;
  start?: string;
  end?: string | null;
  allDay?: boolean;
  color?: string | null;
  location?: string | null;
  assignedTo?: number | null;
}

// =============================================================================
// CHORES
// =============================================================================
export interface ChoreCategory {
  id: number;
  name: string;
  icon?: string | null;
  color?: string | null;
  sortOrder: number;
}

export interface Chore {
  id: number;
  title: string;
  description?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  categoryColor?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  estimatedMinutes?: number | null;
  recurrenceType: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrenceInterval: number;
  recurrenceDays?: string | null;
  dueTime?: string | null;
  assignedTo?: number | null;
  assignedToName?: string | null;
  requireApproval: boolean;
  active: boolean;
}

export interface ChoreInstance {
  id: number;
  choreId: number;
  title: string;
  description?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  categoryColor?: string | null;
  difficulty: string;
  points: number;
  estimatedMinutes?: number | null;
  dueDate: string;
  dueTime?: string | null;
  assignedTo?: number | null;
  assignedToName?: string | null;
  status: 'pending' | 'completed' | 'approved' | 'rejected' | 'skipped';
  completedAt?: string | null;
  completedBy?: number | null;
  completedByName?: string | null;
  pointsAwarded?: number | null;
  requireApproval: boolean;
}

export interface CreateChoreRequest {
  title: string;
  description?: string;
  categoryId?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
  estimatedMinutes?: number;
  recurrenceType?: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrenceInterval?: number;
  recurrenceDays?: string;
  dueTime?: string;
  assignedTo?: number;
  requireApproval?: boolean;
  startDate?: string;
}

export interface ChoreStats {
  totalPoints: number;
  currentStreak: number;
  thisWeek: number;
  thisMonth: number;
  completionRate: number;
}

export interface LeaderboardEntry {
  userId: number;
  displayName: string;
  nickname?: string | null;
  color?: string | null;
  totalPoints: number;
  completedCount: number;
  streak: number;
}

// =============================================================================
// SHOPPING
// =============================================================================
export interface ShoppingCategory {
  id: number;
  name: string;
}

export interface Store {
  id: number;
  name: string;
}

export interface CatalogItem {
  id: number;
  name: string;
  brand?: string | null;
  sizeText?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  imageUrl?: string | null;
  lowestPrice?: number | null;
  lowestPriceStore?: string | null;
}

export interface ItemPrice {
  storeId: number;
  storeName: string;
  price: number;
  unit?: string | null;
  observedAt: string;
}

export interface ShoppingListItem {
  id: number;
  catalogItemId: number;
  itemName: string;
  brand?: string | null;
  sizeText?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  imageUrl?: string | null;
  listType: 'need' | 'want';
  quantity: number;
  storeId?: number | null;
  storeName?: string | null;
  storePrice?: number | null;
  lowestPrice?: number | null;
  purchasedToday: boolean;
}

export interface ShoppingTotals {
  needsOnly: number;
  needsPlusWants: number;
}

export interface Suggestion {
  catalogItemId: number;
  itemName: string;
  brand?: string | null;
  imageUrl?: string | null;
  categoryName?: string | null;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  daysSinceLast: number;
  avgInterval: number;
}

export interface StoreRequest {
  id: number;
  name: string;
  status: 'pending' | 'approved' | 'denied';
  requestedBy: number;
  requestedByName: string;
  createdAt: string;
}

// =============================================================================
// MESSAGES
// =============================================================================
export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  read: boolean;
  createdAt: Date;
}

export interface CreateNotificationParams {
  userId: number;
  type: string;
  title: string;
  body?: string;
  link?: string;
  relatedId?: number;
  relatedType?: string;
}

// =============================================================================
// HOUSEHOLD
// =============================================================================
export interface HouseholdSettings {
  id: number;
  name?: string | null;
  brandColor?: string | null;
  logoUrl?: string | null;
  loginBackground?: string | null;
  loginBackgroundValue?: string | null;
  timezone?: string | null;
}

export interface UpdateHouseholdRequest {
  name?: string | null;
  brandColor?: string | null;
  logoUrl?: string | null;
  loginBackground?: string | null;
  loginBackgroundValue?: string | null;
  timezone?: string | null;
}
