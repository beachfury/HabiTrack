// apps/web/src/api/index.ts
// Central API export - combines all API modules

import { authApi } from './auth';
import { calendarApi } from './calendar';
import { choresApi } from './chores';
import { familyApi } from './family';
import { mealsApi } from './meals';
import { messagesApi } from './messages';
import { settingsApi } from './settings';
import { shoppingApi } from './shopping';
import { uploadApi } from './upload';

// Re-export types from types/ for backward compatibility
export type { CalendarEvent, CreateEventData } from '../types/calendar';
export type {
  ChoreCategory,
  Chore,
  ChoreInstance,
  CreateChoreData,
  ChoreTemplate,
  LeaderboardEntry,
  ChoreStats,
  Achievement,
} from '../types/chores';
export type {
  User,
  FamilyMember,
  CreateFamilyMemberData,
  UserSettings,
  HouseholdSettings,
  UserOption,
  PinUser,
} from '../types/user';
export type { Message } from '../types/messages';
export type {
  ShoppingCategory,
  ShoppingStore,
  CatalogItem,
  ShoppingListItem,
  ShoppingRequest,
  Suggestion,
} from '../types/shopping';
export type { UploadedFile } from './upload';
export type {
  Recipe,
  RecipeIngredient,
  MealPlan,
  MealSuggestion,
  MealShoppingSuggestion,
  CreateRecipeData,
  UpdateRecipeData,
  CreateMealPlanData,
  RecipeStatus,
  RecipeDifficulty,
  MealPlanStatus,
} from '../types/meals';

// Unified api object
export const api = {
  // Auth
  login: authApi.login,
  logout: authApi.logout,
  getSession: authApi.getSession,
  getPinUsers: authApi.getPinUsers,
  loginWithPin: authApi.loginWithPin,
  changePassword: authApi.changePassword,
  requestPasswordReset: authApi.requestPasswordReset,
  resetPassword: authApi.resetPassword,
  acceptInvite: authApi.acceptInvite,
  checkBootstrap: authApi.checkBootstrap,
  getBootstrapStatus: authApi.checkBootstrap,
  bootstrap: authApi.bootstrap,
  impersonate: authApi.impersonate,
  startImpersonation: authApi.startImpersonation,
  stopImpersonation: authApi.stopImpersonation,
  getImpersonationStatus: authApi.getImpersonationStatus,

  // Calendar
  getCalendarEvents: calendarApi.getEvents,
  getCalendarEvent: calendarApi.getEvent,
  createCalendarEvent: calendarApi.createEvent,
  updateCalendarEvent: calendarApi.updateEvent,
  deleteCalendarEvent: calendarApi.deleteEvent,
  getTodayEvents: calendarApi.getTodayEvents,
  getWeekEvents: calendarApi.getWeekEvents,
  getMonthEvents: calendarApi.getMonthEvents,
  getCalendarUsers: calendarApi.getCalendarUsers,
  getEvents: calendarApi.getEvents,
  createEvent: calendarApi.createEvent,
  updateEvent: calendarApi.updateEvent,
  deleteEvent: calendarApi.deleteEvent,

  // Chores
  getChoreCategories: choresApi.getCategories,
  createChoreCategory: choresApi.createCategory,
  updateChoreCategory: choresApi.updateCategory,
  deleteChoreCategory: choresApi.deleteCategory,
  getChores: choresApi.getChores,
  getChore: choresApi.getChore,
  createChore: choresApi.createChore,
  updateChore: choresApi.updateChore,
  deleteChore: choresApi.deleteChore,
  getChoreInstances: choresApi.getInstances,
  getChoreInstance: choresApi.getInstance,
  completeChore: choresApi.completeChore,
  approveChore: choresApi.approveChore,
  rejectChore: choresApi.rejectChore,
  skipChore: choresApi.skipChore,
  reassignChore: choresApi.reassignChore,
  getChoreAssignments: choresApi.getAssignments,
  deleteChoreAssignment: choresApi.deleteAssignment,
  getChoreStats: choresApi.getStats,
  getChoreLeaderboard: choresApi.getLeaderboard,
  adjustPoints: choresApi.adjustPoints,
  getPointsHistory: choresApi.getPointsHistory,
  getChoreTemplates: choresApi.getTemplates,
  createChoreTemplate: choresApi.createTemplate,
  applyChoreTemplate: choresApi.applyTemplate,
  completeChoreInstance: choresApi.completeChore,
  skipChoreInstance: choresApi.skipChore,

  // Shopping
  getShoppingCategories: shoppingApi.getCategories,
  createShoppingCategory: shoppingApi.createCategory,
  updateShoppingCategory: shoppingApi.updateCategory,
  deleteShoppingCategory: shoppingApi.deleteCategory,
  getShoppingStores: shoppingApi.getStores,
  createShoppingStore: shoppingApi.createStore,
  getStoreRequests: shoppingApi.getStoreRequests,
  requestStore: shoppingApi.requestStore,
  approveStoreRequest: shoppingApi.approveStoreRequest,
  denyStoreRequest: shoppingApi.denyStoreRequest,
  getCatalogItems: shoppingApi.getCatalogItems,
  getCatalogItem: shoppingApi.getCatalogItem,
  getCatalogItemPrices: shoppingApi.getCatalogItemPrices,
  setCatalogItemPrice: shoppingApi.setCatalogItemPrice,
  createCatalogItem: shoppingApi.createCatalogItem,
  updateCatalogItem: shoppingApi.updateCatalogItem,
  deleteCatalogItem: shoppingApi.deleteCatalogItem,
  getShoppingList: shoppingApi.getShoppingList,
  addToShoppingList: shoppingApi.addToShoppingList,
  updateListItem: shoppingApi.updateListItem,
  removeFromShoppingList: shoppingApi.removeFromShoppingList,
  markAsPurchased: shoppingApi.markAsPurchased,
  getShoppingRequests: shoppingApi.getRequests,
  createShoppingRequest: shoppingApi.createRequest,

  // Messages
  getMessages: messagesApi.getMessages,
  getUnreadCount: messagesApi.getUnreadCount,
  getUnreadTotal: messagesApi.getUnreadTotal,
  markMessageAsRead: messagesApi.markAsRead,
  markAllMessagesAsRead: messagesApi.markAllAsRead,
  deleteMessage: messagesApi.deleteMessage,
  deleteAllMessages: messagesApi.deleteMessage,
  getAnnouncements: messagesApi.getAnnouncements,
  createAnnouncement: messagesApi.createAnnouncement,
  markAnnouncementRead: messagesApi.markAnnouncementRead,
  deleteAnnouncement: messagesApi.deleteAnnouncement,
  getConversations: messagesApi.getConversations,
  getConversation: messagesApi.getConversation,
  sendMessage: messagesApi.sendMessage,
  deleteDirectMessage: messagesApi.deleteDirectMessage,
  deleteConversation: messagesApi.deleteConversation,

  // Family
  getFamilyMembers: familyApi.getMembers,
  getFamilyMember: familyApi.getMember,
  createFamilyMember: familyApi.createMember,
  updateFamilyMember: familyApi.updateMember,
  deleteFamilyMember: familyApi.deleteMember,
  reactivateFamilyMember: familyApi.reactivateMember,
  getFamilyUsers: familyApi.getUsers,
  sendFamilyInvite: familyApi.sendInvite,
  resetMemberPassword: familyApi.resetMemberPassword,
  setMemberPin: familyApi.setMemberPin,
  setMemberPassword: familyApi.setMemberPassword,
  removeMemberPin: familyApi.removeMemberPin,
  getUsers: familyApi.getUsers,

  // Settings
  getUserSettings: settingsApi.getUserSettings,
  updateUserSettings: settingsApi.updateUserSettings,
  changeSettingsPassword: settingsApi.changePassword,
  getHouseholdSettings: settingsApi.getHouseholdSettings,
  updateHouseholdSettings: settingsApi.updateHouseholdSettings,
  uploadHouseholdLogo: settingsApi.uploadHouseholdLogo,
  removeHouseholdLogo: settingsApi.removeHouseholdLogo,
  getBranding: settingsApi.getBranding,

  // Upload
  uploadAvatar: uploadApi.uploadAvatar,
  uploadLogo: uploadApi.uploadLogo,
  uploadBackground: uploadApi.uploadBackground,
  deleteAvatar: uploadApi.deleteAvatar,
  listUploads: uploadApi.listUploads,
  deleteUploadedFile: uploadApi.deleteUploadedFile,
  selectUpload: uploadApi.selectUpload,

  // Meals / Dinner Planner
  getRecipes: mealsApi.getRecipes,
  getRecipe: mealsApi.getRecipe,
  createRecipe: mealsApi.createRecipe,
  updateRecipe: mealsApi.updateRecipe,
  deleteRecipe: mealsApi.deleteRecipe,
  approveRecipe: mealsApi.approveRecipe,
  rejectRecipe: mealsApi.rejectRecipe,
  addRecipeIngredient: mealsApi.addIngredient,
  updateRecipeIngredient: mealsApi.updateIngredient,
  deleteRecipeIngredient: mealsApi.deleteIngredient,
  reorderRecipeIngredients: mealsApi.reorderIngredients,
  getMealPlans: mealsApi.getMealPlans,
  getMealPlan: mealsApi.getMealPlan,
  createMealPlan: mealsApi.createMealPlan,
  updateMealPlan: mealsApi.updateMealPlan,
  deleteMealPlan: mealsApi.deleteMealPlan,
  setFendForYourself: mealsApi.setFendForYourself,
  finalizeMealPlan: mealsApi.finalizeMealPlan,
  openMealVoting: mealsApi.openVoting,
  addMealSuggestion: mealsApi.addSuggestion,
  deleteMealSuggestion: mealsApi.deleteSuggestion,
  castMealVote: mealsApi.castVote,
  removeMealVote: mealsApi.removeVote,
  getShoppingSuggestions: mealsApi.getShoppingSuggestions,
  generateShoppingSuggestions: mealsApi.generateShoppingSuggestions,
  addShoppingSuggestion: mealsApi.addShoppingSuggestion,
  dismissShoppingSuggestion: mealsApi.dismissShoppingSuggestion,
  bulkAddShoppingSuggestions: mealsApi.bulkAddShoppingSuggestions,
};

// Export individual APIs
export {
  authApi,
  calendarApi,
  choresApi,
  familyApi,
  mealsApi,
  messagesApi,
  settingsApi,
  shoppingApi,
  uploadApi,
};
