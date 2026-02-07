// apps/web/src/api/auth.ts
// Authentication API endpoints

import { apiClient } from './client';
import type { User, PinUser, HouseholdSettings } from '../types';

export interface SessionResponse {
  authenticated: boolean;
  user?: User & { impersonatedBy?: number };
  household?: HouseholdSettings;
}

export interface LoginResponse {
  success: boolean;
  user: {
    id: number;
    displayName: string;
    role: string;
  };
}

export const authApi = {
  // Get current session - uses /me endpoint which returns full user data
  async getSession(): Promise<SessionResponse> {
    try {
      const data = await apiClient['get']<{ user: User }>('/me', { params: undefined });
      return {
        authenticated: true,
        user: data.user,
      };
    } catch (error: any) {
      // 401 means not authenticated, which is expected
      if (error.status === 401) {
        return { authenticated: false };
      }
      throw error;
    }
  },

  // Login with email/password - uses /auth/creds/login endpoint
  login(email: string, password: string): Promise<LoginResponse> {
    // Backend expects 'secret' not 'password', and endpoint is /auth/creds/login
    return apiClient['post']('/auth/creds/login', { email, secret: password });
  },

  // Logout
  logout(): Promise<{ success: boolean }> {
    return apiClient['post']('/auth/logout');
  },

  // PIN authentication
  getPinUsers(): Promise<{ users: PinUser[] }> {
    return apiClient['get']<{ users: PinUser[] }>('/auth/pin/users', { params: undefined });
  },

  loginWithPin(userId: number, pin: string): Promise<LoginResponse> {
    return apiClient['post']('/auth/pin/login', { userId, pin });
  },

  // Password management - uses /auth/creds/change endpoint
  changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
    return apiClient['post']('/auth/creds/change', {
      oldSecret: currentPassword,
      newSecret: newPassword,
    });
  },

  // Password reset - uses /auth/creds/forgot endpoint
  requestPasswordReset(email: string): Promise<{ success: boolean }> {
    return apiClient['post']('/auth/creds/forgot', { email });
  },

  // Reset password with token - uses /auth/creds/reset endpoint
  resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
    return apiClient['post']('/auth/creds/reset', { token, newSecret: newPassword });
  },

  // Onboarding (accept invite)
  acceptInvite(
    userId: number,
    token: string,
    password: string,
    displayName?: string,
  ): Promise<{ success: boolean }> {
    return apiClient['post']('/auth/onboard/complete', {
      userId,
      token,
      password,
      displayName,
    });
  },

  // Bootstrap check
  checkBootstrap(): Promise<{ bootstrapped: boolean }> {
    return apiClient['get']<{ bootstrapped: boolean }>('/bootstrap/status', { params: undefined });
  },

  // Bootstrap (initial setup)
  bootstrap(data: {
    householdName: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }): Promise<{ success: boolean }> {
    return apiClient['post']('/bootstrap', data);
  },

  // Impersonation (admin only)
  impersonate(userId: number): Promise<{ success: boolean }> {
    return apiClient['post'](`/admin/impersonate/${userId}`);
  },

  // Alias for AuthContext compatibility
  startImpersonation(userId: number): Promise<{ success: boolean }> {
    return apiClient['post'](`/admin/impersonate/${userId}`);
  },

  stopImpersonation(): Promise<{ success: boolean }> {
    return apiClient['post']('/admin/impersonate/stop');
  },

  getImpersonationStatus(): Promise<{
    impersonating: boolean;
    originalAdmin?: { id: number; displayName: string };
  }> {
    return apiClient['get']('/admin/impersonate/status', { params: undefined });
  },
};
