// apps/web/src/api/settings.ts
// Settings API endpoints

import { apiClient } from './client';
import type { UserSettings, HouseholdSettings } from '../types';

export const settingsApi = {
  // =============================================================================
  // User Settings
  // =============================================================================

  /** GET /api/settings/user - Get current user's settings/preferences */
  getUserSettings(): Promise<{ user: UserSettings }> {
    return apiClient['get']('/settings/user', { params: undefined });
  },

  /** PUT /api/settings/user - Update user preferences (nickname, email, color, theme, accentColor) */
  updateUserSettings(
    data: Partial<{
      nickname: string | null;
      email: string | null;
      color: string | null;
      theme: string | null;
      accentColor: string | null;
    }>,
  ): Promise<{ success: boolean }> {
    return apiClient['put']('/settings/user', data);
  },

  /** POST /api/settings/password - Change own password (settings flow) */
  changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
    return apiClient['post']('/settings/password', { currentPassword, newPassword });
  },

  /** POST /api/settings/avatar - Upload avatar (base64) */
  updateAvatar(avatarUrl: string): Promise<{ success: boolean }> {
    return apiClient['post']('/settings/avatar', { avatarUrl });
  },

  /** DELETE /api/settings/avatar - Remove avatar */
  removeAvatar(): Promise<{ success: boolean }> {
    return apiClient['delete']('/settings/avatar', undefined);
  },

  // =============================================================================
  // Household Settings (Admin only)
  // =============================================================================

  /** GET /api/settings/household - Get household config (admin only) */
  getHouseholdSettings(): Promise<{ household: HouseholdSettings }> {
    return apiClient['get']('/settings/household', { params: undefined });
  },

  /** PUT /api/settings/household - Update household config (admin only) */
  updateHouseholdSettings(
    data: Partial<{
      name: string | null;
      brandColor: string | null;
      logoUrl: string | null;
      loginBackground: 'gradient' | 'solid' | 'image' | null;
      loginBackgroundValue: string | null;
      timezone: string | null;
    }>,
  ): Promise<{ success: boolean }> {
    return apiClient['put']('/settings/household', data);
  },

  /** POST /api/settings/household/logo - Upload household logo (admin only) */
  uploadHouseholdLogo(imageData: string): Promise<{ logoUrl: string }> {
    return apiClient['post']('/settings/household/logo', { imageData });
  },

  /** DELETE /api/settings/household/logo - Remove household logo (admin only) */
  removeHouseholdLogo(): Promise<{ success: boolean }> {
    return apiClient['delete']('/settings/household/logo', undefined);
  },

  // =============================================================================
  // Public Branding (no auth required)
  // =============================================================================

  /** GET /api/branding - Get public household branding for login page */
  getBranding(): Promise<{
    name: string | null;
    brandColor: string | null;
    logoUrl: string | null;
    loginBackground: string | null;
    loginBackgroundValue: string | null;
  }> {
    return apiClient['get']('/branding', { params: undefined });
  },
};
