// apps/api/src/router.ts
// Main Express router - uses modular route handlers

import { Router } from 'express';
import { requireAuth } from './middleware.auth';
import {
  loginRateLimiter,
  bootstrapRateLimiter,
  forgotPasswordRateLimiter,
  writeRateLimiter,
} from './rate-limit';
import { kioskLocalOnly, kioskRestrictions } from './middleware';

// Import from modular routes
import * as auth from './routes/auth';
import * as chores from './routes/chores';
import * as shopping from './routes/shopping';
import * as calendar from './routes/calendar';
import * as family from './routes/family';
import * as settings from './routes/settings';
import * as messages from './routes/messages';
import * as admin from './routes/admin';
import * as bootstrap from './routes/bootstrap';
import * as permissions from './routes/permissions';
import * as upload from './routes/upload';
import * as themeUploads from './routes/uploads';
import colorsRouter from './routes/colors';
import * as themes from './routes/themes';
import * as paidChores from './routes/paid-chores';
import * as dashboard from './routes/dashboard';
import * as budgets from './routes/budgets';
import * as meals from './routes/meals';
import { deleteDirectMessage, deleteConversation } from './routes/messages/direct';
import notificationsRouter from './routes/notifications';
import * as debug from './routes/debug';

const router = Router();

// =============================================================================
// PUBLIC ROUTES (no auth required)
// =============================================================================
router.get('/branding', settings.getBranding);
router.get('/version', debug.getVersion);

// =============================================================================
// DEBUG & DIAGNOSTICS ROUTES (admin only)
// =============================================================================
router.get('/debug/settings', requireAuth('admin'), debug.getDebugSettings);
router.put('/debug/settings', requireAuth('admin'), debug.updateDebugSettings);
router.get('/debug/logs', requireAuth('admin'), debug.getLogs);
router.get('/debug/logs/export', requireAuth('admin'), debug.exportLogsFile);
router.delete('/debug/logs', requireAuth('admin'), debug.clearLogs);
router.get('/debug/logs/file/:filename', requireAuth('admin'), debug.downloadLogFile);
router.get('/debug/system', requireAuth('admin'), debug.getSystemInfo);
router.post('/debug/frontend-errors', requireAuth(), debug.receiveFrontendErrors);

// =============================================================================
// AUTH ROUTES
// =============================================================================
// Session
router.post('/auth/login', loginRateLimiter, auth.postDevLogin);
router.post('/auth/logout', auth.postLogout);
router.get('/me', requireAuth(), auth.getMe);
router.get('/auth/session', auth.checkSession);

// Credentials
router.post('/auth/creds/register', auth.postRegister);
router.post('/auth/creds/login', loginRateLimiter, auth.postCredsLogin);
router.post('/auth/creds/change', requireAuth(), auth.postChangePassword);

// Password Reset
router.post('/auth/creds/forgot', forgotPasswordRateLimiter, auth.postForgotPassword);
router.post('/auth/creds/reset', auth.postResetPassword);

// PIN Auth (KIOSK MODE - LOCAL NETWORK ONLY)
// SECURITY: kioskLocalOnly middleware ensures these endpoints are ONLY accessible from local network
router.get('/auth/pin/users', kioskLocalOnly, auth.getPinUsers);
router.post('/auth/pin/login', kioskLocalOnly, loginRateLimiter, auth.postPinLogin);
router.post('/auth/pin/verify', kioskLocalOnly, auth.verifyPin);

// Onboarding
router.post('/auth/onboard/complete', auth.postOnboardComplete);

// =============================================================================
// BOOTSTRAP ROUTES
// =============================================================================
router.get('/bootstrap/status', bootstrap.getBootstrapStatus);
router.post('/bootstrap', bootstrapRateLimiter, bootstrap.postBootstrap);
router.post('/bootstrap/admin', bootstrapRateLimiter, bootstrap.postBootstrapAdmin);

// =============================================================================
// ADMIN ROUTES
// =============================================================================
router.post('/admin/users', requireAuth('admin'), writeRateLimiter, admin.postAdminCreateUser);
router.get('/admin/impersonate/status', requireAuth(), admin.getImpersonationStatus);
router.post('/admin/impersonate/stop', requireAuth(), admin.stopImpersonation);
router.post('/admin/impersonate/:userId', requireAuth('admin'), admin.startImpersonation);

// =============================================================================
// PERMISSIONS ROUTES
// =============================================================================
router.get('/permissions', requireAuth('admin'), permissions.listPermissions);
router.put('/permissions', requireAuth('admin'), permissions.replacePermissions);
router.post('/permissions/refresh', requireAuth('admin'), permissions.reloadPermissions);

// =============================================================================
// CALENDAR ROUTES
// =============================================================================
router.get('/calendar/events', requireAuth(), calendar.getEvents);
router.get('/calendar/users', requireAuth(), calendar.getCalendarUsers);
router.post('/calendar/events', requireAuth(), writeRateLimiter, calendar.createEvent);
router.put('/calendar/events/:id', requireAuth(), writeRateLimiter, calendar.updateEvent);
router.delete('/calendar/events/:id', requireAuth(), calendar.deleteEvent);

// =============================================================================
// CHORES ROUTES
// =============================================================================
// Categories (specific paths first)
router.get('/chores/categories', requireAuth(), chores.getCategories);
router.post('/chores/categories', requireAuth('admin'), writeRateLimiter, chores.createCategory);
router.patch(
  '/chores/categories/:id',
  requireAuth('admin'),
  writeRateLimiter,
  chores.updateCategory,
);
router.delete('/chores/categories/:id', requireAuth('admin'), chores.deleteCategory);

// Templates (MUST come before /chores/:id to avoid being caught by :id param)
router.get('/chores/templates', requireAuth(), chores.getTemplates);
router.get('/chores/templates/:id', requireAuth(), chores.getTemplate);
router.post('/chores/templates', requireAuth('admin'), writeRateLimiter, chores.createTemplate);
router.put('/chores/templates/:id', requireAuth('admin'), writeRateLimiter, chores.updateTemplate);
router.delete('/chores/templates/:id', requireAuth('admin'), chores.deleteTemplate);
router.post(
  '/chores/templates/:id/apply',
  requireAuth('admin'),
  writeRateLimiter,
  chores.applyTemplate,
);

// Stats & Leaderboard (MUST come before /chores/:id to avoid being caught by :id param)
router.get('/chores/stats', requireAuth(), chores.getStats);
router.get('/chores/leaderboard', requireAuth(), chores.getLeaderboard);
router.post('/chores/points/adjust', requireAuth('admin'), writeRateLimiter, chores.adjustPoints);

// Chore Instances (MUST come before /chores/:id to avoid being caught by :id param)
router.get('/chores/instances', requireAuth(), chores.getInstances);
router.post(
  '/chores/instances/:id/complete',
  requireAuth(),
  writeRateLimiter,
  chores.completeInstance,
);
router.post(
  '/chores/instances/:id/approve',
  requireAuth('admin'),
  writeRateLimiter,
  chores.approveInstance,
);
router.post(
  '/chores/instances/:id/reject',
  requireAuth('admin'),
  writeRateLimiter,
  chores.rejectInstance,
);
router.post(
  '/chores/instances/:id/skip',
  requireAuth('admin'),
  writeRateLimiter,
  chores.skipInstance,
);
router.post(
  '/chores/instances/:id/reassign',
  requireAuth('admin'),
  writeRateLimiter,
  chores.reassignInstance,
);

// Chore Assignments
router.get('/chores/assignments', requireAuth('admin'), chores.getAssignments);
router.delete('/chores/assignments/:id', requireAuth('admin'), chores.deleteAssignment);
router.post(
  '/chores/assignments/bulk-delete',
  requireAuth('admin'),
  writeRateLimiter,
  chores.bulkDeleteAssignments,
);

// Chore Definitions (generic :id routes LAST)
router.get('/chores', requireAuth(), chores.getChores);
router.get('/chores/:id', requireAuth(), chores.getChore);
router.post('/chores', requireAuth('admin'), writeRateLimiter, chores.createChore);
router.put('/chores/:id', requireAuth('admin'), writeRateLimiter, chores.updateChore);
router.post(
  '/chores/:id/regenerate',
  requireAuth('admin'),
  writeRateLimiter,
  chores.regenerateInstances,
);
router.delete('/chores/:id', requireAuth('admin'), chores.deleteChore);
router.delete('/chores/:id/hard', requireAuth('admin'), chores.hardDeleteChore);

// =============================================================================
// SHOPPING ROUTES
// =============================================================================
// Categories & Stores
router.get('/shopping/categories', requireAuth(), shopping.getCategories);
router.post(
  '/shopping/categories',
  requireAuth('admin'),
  writeRateLimiter,
  shopping.createCategory,
);
router.get('/shopping/stores', requireAuth(), shopping.getStores);
router.post('/shopping/stores', requireAuth('admin'), writeRateLimiter, shopping.createStore);
router.post('/shopping/stores/request', requireAuth(), writeRateLimiter, shopping.requestStore);
router.get('/shopping/stores/requests', requireAuth('admin'), shopping.getStoreRequests);
router.post(
  '/shopping/stores/requests/:id/approve',
  requireAuth('admin'),
  writeRateLimiter,
  shopping.approveStoreRequest,
);
router.post(
  '/shopping/stores/requests/:id/deny',
  requireAuth('admin'),
  writeRateLimiter,
  shopping.denyStoreRequest,
);

router.put(
  '/shopping/categories/:id',
  requireAuth('admin'),
  writeRateLimiter,
  shopping.updateCategory,
);

router.delete(
  '/shopping/categories/:id',
  requireAuth('admin'),
  writeRateLimiter,
  shopping.deleteCategory,
);

// Catalog
router.get('/shopping/catalog', requireAuth(), shopping.getCatalogItems);
router.get('/shopping/catalog/:id', requireAuth(), shopping.getCatalogItem);
router.get('/shopping/catalog/:id/prices', requireAuth(), shopping.getCatalogItemPrices);
router.post(
  '/shopping/catalog',
  requireAuth('admin'),
  writeRateLimiter,
  shopping.createCatalogItem,
);
router.put(
  '/shopping/catalog/:id',
  requireAuth('admin'),
  writeRateLimiter,
  shopping.updateCatalogItem,
);
router.delete('/shopping/catalog/:id', requireAuth('admin'), shopping.deleteCatalogItem);
router.post(
  '/shopping/catalog/:id/prices',
  requireAuth(),
  writeRateLimiter,
  shopping.setCatalogItemPrice,
);

// Shopping List
router.get('/shopping/list', requireAuth(), shopping.getShoppingList);
router.post('/shopping/list', requireAuth(), writeRateLimiter, shopping.addToList);
router.put('/shopping/list/:id', requireAuth(), writeRateLimiter, shopping.updateListItem);
router.delete('/shopping/list/:id', requireAuth(), shopping.removeFromList);
router.post('/shopping/list/:id/purchase', requireAuth(), writeRateLimiter, shopping.markPurchased);

// Suggestions
router.get('/shopping/suggestions', requireAuth(), shopping.getSuggestions);
router.post(
  '/shopping/suggestions/add-all',
  requireAuth(),
  writeRateLimiter,
  shopping.addAllSuggestions,
);
router.post(
  '/shopping/suggestions/:id/add',
  requireAuth(),
  writeRateLimiter,
  shopping.addSuggestion,
);

// Shopping Requests (item requests from family members)
router.get('/shopping/requests', requireAuth(), shopping.getRequests);
router.post('/shopping/requests', requireAuth(), writeRateLimiter, shopping.createRequest);
router.post(
  '/shopping/requests/:id/approve',
  requireAuth('admin'),
  writeRateLimiter,
  shopping.approveRequest,
);
router.post(
  '/shopping/requests/:id/deny',
  requireAuth('admin'),
  writeRateLimiter,
  shopping.denyRequest,
);

// Shopping History & Analytics
router.get('/shopping/history', requireAuth(), shopping.getHistory);
router.get('/shopping/analytics', requireAuth(), shopping.getAnalytics);

// =============================================================================
// COLORS ROUTES
// =============================================================================
router.use('/colors', colorsRouter);

// =============================================================================
// THEMES ROUTES
// =============================================================================
router.get('/themes', requireAuth(), themes.listThemes);
router.post('/themes', requireAuth(), writeRateLimiter, themes.createTheme);
// Specific theme routes MUST come before generic :id routes
router.post('/themes/:id/duplicate', requireAuth(), writeRateLimiter, themes.duplicateTheme);
router.put('/themes/:id/kid-approval', requireAuth('admin'), writeRateLimiter, themes.toggleKidApproval);
// Generic :id routes LAST
router.get('/themes/:id', requireAuth(), themes.getTheme);
router.put('/themes/:id', requireAuth(), writeRateLimiter, themes.updateTheme);
router.delete('/themes/:id', requireAuth(), themes.deleteTheme);
router.get('/settings/theme', requireAuth(), themes.getUserThemePreferences);
router.put('/settings/theme', requireAuth(), writeRateLimiter, themes.updateUserThemePreferences);

// =============================================================================
// FAMILY ROUTES
// =============================================================================
router.get('/family/members', requireAuth(), family.getMembers);
router.get('/family/members/:id', requireAuth(), family.getMember);
router.post('/family/members', requireAuth('admin'), writeRateLimiter, family.createMember);
router.put('/family/members/:id', requireAuth('admin'), writeRateLimiter, family.updateMember);
router.delete('/family/members/:id', requireAuth('admin'), family.deleteMember);
router.post(
  '/family/members/:id/password',
  requireAuth('admin'),
  writeRateLimiter,
  family.setPassword,
);
router.post('/family/members/:id/pin', requireAuth('admin'), writeRateLimiter, family.setPin);
router.delete('/family/members/:id/pin', requireAuth('admin'), family.removePin);

// =============================================================================
// SETTINGS ROUTES
// =============================================================================
// User settings
router.get('/settings/user', requireAuth(), settings.getUserSettings);
router.put('/settings/user', requireAuth(), writeRateLimiter, settings.updateUserSettings);
router.post('/settings/password', requireAuth(), writeRateLimiter, settings.changePassword);
router.post('/settings/avatar', requireAuth(), writeRateLimiter, settings.updateAvatar);
router.delete('/settings/avatar', requireAuth(), settings.removeAvatar);

// Household settings (admin)
router.get('/settings/household', requireAuth('admin'), settings.getHouseholdSettings);
router.put(
  '/settings/household',
  requireAuth('admin'),
  writeRateLimiter,
  settings.updateHouseholdSettings,
);
router.post(
  '/settings/household/logo',
  requireAuth('admin'),
  writeRateLimiter,
  settings.updateHouseholdLogo,
);
router.delete('/settings/household/logo', requireAuth('admin'), settings.removeHouseholdLogo);

// =============================================================================
// MESSAGES / NOTIFICATIONS ROUTES
// =============================================================================
router.get('/messages', requireAuth(), messages.getMessages);
router.get('/messages/unread-count', requireAuth(), messages.getUnreadCount);
router.get('/messages/unread-total', requireAuth(), messages.getUnreadTotal);
router.post('/messages/:id/read', requireAuth(), messages.markAsRead);
router.post('/messages/read-all', requireAuth(), messages.markAllAsRead);

// Announcements
router.get('/messages/announcements', requireAuth(), messages.getAnnouncements);
router.post(
  '/messages/announcements',
  requireAuth('admin'),
  writeRateLimiter,
  messages.createAnnouncement,
);
router.post('/messages/announcements/:id/read', requireAuth(), messages.markAnnouncementRead);
router.delete('/messages/announcements/:id', requireAuth('admin'), messages.deleteAnnouncement);

// Direct messages / Conversations
router.get('/messages/conversations', requireAuth(), messages.getConversations);
router.get('/messages/conversations/:userId', requireAuth(), messages.getConversation);
router.post('/messages/send', requireAuth(), writeRateLimiter, messages.sendDirectMessage);
router.delete('/messages/direct/:id', requireAuth(), deleteDirectMessage);
router.delete('/messages/conversations/:userId', requireAuth(), deleteConversation);

// Individual notification delete (must come after specific paths)
router.delete('/messages/:id', requireAuth(), messages.deleteMessage);

// Delete all read notifications (generic path last)
router.delete('/messages', requireAuth(), messages.deleteAllRead);

// =============================================================================
// NOTIFICATION PREFERENCES ROUTES
// =============================================================================
router.use('/notifications', notificationsRouter);

// =============================================================================
// UPLOAD ROUTES
// =============================================================================
router.post('/upload/avatar', requireAuth(), upload.uploadAvatar);
router.delete('/upload/avatar', requireAuth(), upload.deleteAvatar);
router.post('/upload/logo', requireAuth('admin'), upload.uploadLogo);
router.post('/upload/background', requireAuth('admin'), upload.uploadBackground);
router.post('/upload/recipe/:id', requireAuth(), upload.uploadRecipeImage);
router.delete('/upload/recipe/:id', requireAuth(), upload.deleteRecipeImage);
router.get('/uploads', requireAuth('admin'), upload.listUploads);
router.delete('/uploads/:id', requireAuth('admin'), upload.deleteUpload);
router.post('/uploads/:id/select', requireAuth('admin'), upload.selectUpload);

// =============================================================================
// THEME IMAGE UPLOAD ROUTES
// =============================================================================
router.post('/uploads/theme-image', requireAuth(), ...themeUploads.uploadThemeImage);
router.patch('/uploads/theme-image/:id', requireAuth(), themeUploads.updateThemeImage);
router.delete('/uploads/theme-image/:id', requireAuth(), themeUploads.deleteThemeImage);
router.get('/uploads/theme-assets/:themeId', requireAuth(), themeUploads.getThemeAssets);
router.get('/uploads/my-assets', requireAuth(), themeUploads.getMyAssets);
router.get('/uploads/theme-library', requireAuth(), themeUploads.getThemeLibrary);
router.get('/uploads/categories', requireAuth(), themeUploads.getCategories);

// =============================================================================
// PAID CHORES (Chore Race) ROUTES
// =============================================================================
router.get('/paid-chores', requireAuth(), paidChores.listPaidChores);
router.get('/paid-chores/earnings', requireAuth(), paidChores.getEarnings);
router.get('/paid-chores/leaderboard', requireAuth(), paidChores.getEarningsLeaderboard);
router.post('/paid-chores', requireAuth('admin'), writeRateLimiter, paidChores.createPaidChore);
// Specific action routes before :id
router.post('/paid-chores/:id/claim', requireAuth(), writeRateLimiter, paidChores.claimPaidChore);
router.post('/paid-chores/:id/complete', requireAuth(), writeRateLimiter, paidChores.completePaidChore);
router.post('/paid-chores/:id/verify', requireAuth('admin'), writeRateLimiter, paidChores.verifyPaidChore);
router.post('/paid-chores/:id/reject', requireAuth('admin'), writeRateLimiter, paidChores.rejectPaidChore);
// Generic :id routes last
router.get('/paid-chores/:id', requireAuth(), paidChores.getPaidChore);
router.put('/paid-chores/:id', requireAuth('admin'), writeRateLimiter, paidChores.updatePaidChore);
router.delete('/paid-chores/:id', requireAuth('admin'), paidChores.deletePaidChore);

// =============================================================================
// DASHBOARD ROUTES
// =============================================================================
router.get('/dashboard/widgets', requireAuth(), dashboard.getAvailableWidgets);
router.get('/dashboard/layout', requireAuth(), dashboard.getDashboardLayout);
router.put('/dashboard/layout', requireAuth(), writeRateLimiter, dashboard.saveDashboardLayout);
router.post('/dashboard/widgets', requireAuth(), writeRateLimiter, dashboard.addWidget);
router.delete('/dashboard/widgets/:widgetId', requireAuth(), dashboard.removeWidget);
router.put('/dashboard/widgets/:widgetId/config', requireAuth(), writeRateLimiter, dashboard.updateWidgetConfig);
router.post('/dashboard/reset', requireAuth(), writeRateLimiter, dashboard.resetDashboard);
router.get('/dashboard/data', requireAuth(), dashboard.getDashboardData);

// =============================================================================
// BUDGET ROUTES (Admin only)
// =============================================================================
// Categories
router.get('/budgets/categories', requireAuth('admin'), budgets.getCategories);
router.post('/budgets/categories', requireAuth('admin'), writeRateLimiter, budgets.createCategory);
router.put('/budgets/categories/:id', requireAuth('admin'), writeRateLimiter, budgets.updateCategory);
router.delete('/budgets/categories/:id', requireAuth('admin'), budgets.deleteCategory);

// Analytics & Summary (before :id routes)
router.get('/budgets/analytics', requireAuth('admin'), budgets.getAnalytics);
router.get('/budgets/summary', requireAuth('admin'), budgets.getSummary);

// Entries (before :id routes to avoid conflicts)
router.get('/budgets/entries', requireAuth('admin'), budgets.getEntries);
router.post('/budgets/entries', requireAuth('admin'), writeRateLimiter, budgets.createEntry);
router.get('/budgets/entries/:id', requireAuth('admin'), budgets.getEntry);
router.put('/budgets/entries/:id', requireAuth('admin'), writeRateLimiter, budgets.updateEntry);
router.delete('/budgets/entries/:id', requireAuth('admin'), budgets.deleteEntry);

// Budgets (generic :id routes last)
router.get('/budgets', requireAuth('admin'), budgets.getBudgets);
router.post('/budgets', requireAuth('admin'), writeRateLimiter, budgets.createBudget);
router.get('/budgets/:id', requireAuth('admin'), budgets.getBudget);
router.put('/budgets/:id', requireAuth('admin'), writeRateLimiter, budgets.updateBudget);
router.delete('/budgets/:id', requireAuth('admin'), budgets.deleteBudget);
router.get('/budgets/:id/history', requireAuth('admin'), budgets.getBudgetHistory);

// =============================================================================
// MEALS / DINNER PLANNER ROUTES
// =============================================================================
// Recipes - specific routes first
router.get('/recipes', requireAuth(), meals.getRecipes);
router.post('/recipes', requireAuth(), writeRateLimiter, meals.createRecipe);
router.post('/recipes/:id/approve', requireAuth('admin'), writeRateLimiter, meals.approveRecipe);
router.post('/recipes/:id/reject', requireAuth('admin'), writeRateLimiter, meals.rejectRecipe);
router.post('/recipes/:id/ingredients', requireAuth(), writeRateLimiter, meals.addIngredient);
router.post('/recipes/:id/ingredients/reorder', requireAuth(), writeRateLimiter, meals.reorderIngredients);
router.put('/recipes/:id/ingredients/:ingredientId', requireAuth(), writeRateLimiter, meals.updateIngredient);
router.delete('/recipes/:id/ingredients/:ingredientId', requireAuth(), meals.deleteIngredient);
// Recipes - generic :id routes last
router.get('/recipes/:id', requireAuth(), meals.getRecipe);
router.put('/recipes/:id', requireAuth(), writeRateLimiter, meals.updateRecipe);
router.delete('/recipes/:id', requireAuth('admin'), meals.deleteRecipe);

// Meal Plans - specific routes first
router.get('/meals/shopping-suggestions', requireAuth(), meals.getShoppingSuggestions);
router.post('/meals/shopping-suggestions/bulk-add', requireAuth('admin'), writeRateLimiter, meals.bulkAddShoppingSuggestions);
router.post('/meals/shopping-suggestions/:id/add', requireAuth('admin'), writeRateLimiter, meals.addShoppingSuggestion);
router.post('/meals/shopping-suggestions/:id/dismiss', requireAuth('admin'), writeRateLimiter, meals.dismissShoppingSuggestion);
// Voting reminders (for scheduled tasks)
router.post('/meals/voting-reminders', requireAuth('admin'), meals.sendVotingReminders);
// Meal Plans - date-based routes
router.get('/meals', requireAuth(), meals.getMealPlans);
// Anyone can create meal plans, but non-admins can only create in voting status
router.post('/meals', requireAuth(), writeRateLimiter, meals.createMealPlan);
// Meal Plans - :id specific actions
router.post('/meals/:id/open-voting', requireAuth('admin'), writeRateLimiter, meals.openVoting);
router.post('/meals/:id/suggestions', requireAuth(), writeRateLimiter, meals.addSuggestion);
router.delete('/meals/:id/suggestions/:suggestionId', requireAuth(), meals.deleteSuggestion);
router.post('/meals/:id/vote', requireAuth(), writeRateLimiter, meals.castVote);
router.delete('/meals/:id/vote/:suggestionId', requireAuth(), meals.removeVote);
router.post('/meals/:id/ffy', requireAuth('admin'), writeRateLimiter, meals.setFendForYourself);
router.post('/meals/:id/finalize', requireAuth('admin'), writeRateLimiter, meals.finalizeMealPlan);
router.post('/meals/:id/shopping-suggestions/generate', requireAuth('admin'), writeRateLimiter, meals.generateShoppingSuggestions);
// Meal Plans - generic :id routes last
router.get('/meals/:date', requireAuth(), meals.getMealPlan);
router.put('/meals/:id', requireAuth('admin'), writeRateLimiter, meals.updateMealPlan);
router.delete('/meals/:id', requireAuth('admin'), meals.deleteMealPlan);

export default router;
