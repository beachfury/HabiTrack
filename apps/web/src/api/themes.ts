// apps/web/src/api/themes.ts
// Frontend API client for themes

import type {
  Theme,
  ThemeListItem,
  UserThemePreferences,
  CreateThemeInput,
  UpdateThemeInput,
} from '../types/theme';

const API_BASE = '/api';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// =============================================================================
// THEME LIBRARY
// =============================================================================

export interface ListThemesParams {
  filter?: 'all' | 'public' | 'mine' | 'kid-approved';
}

export async function listThemes(params?: ListThemesParams): Promise<ThemeListItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.filter) {
    searchParams.set('filter', params.filter);
  }
  const query = searchParams.toString();
  const response = await fetchApi<{ themes: ThemeListItem[] }>(`/themes${query ? `?${query}` : ''}`);
  return response.themes || [];
}

export async function getTheme(id: string): Promise<Theme> {
  const response = await fetchApi<{ theme: Theme }>(`/themes/${encodeURIComponent(id)}`);
  return response.theme;
}

export async function createTheme(input: CreateThemeInput): Promise<Theme> {
  const response = await fetchApi<{ theme: Theme }>('/themes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.theme;
}

export async function updateTheme(id: string, input: UpdateThemeInput): Promise<Theme> {
  const response = await fetchApi<{ theme: Theme }>(`/themes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return response.theme;
}

export async function deleteTheme(id: string): Promise<void> {
  await fetchApi<void>(`/themes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function duplicateTheme(id: string, name?: string): Promise<Theme> {
  return fetchApi<Theme>(`/themes/${encodeURIComponent(id)}/duplicate`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

// =============================================================================
// USER PREFERENCES
// =============================================================================

export async function getUserThemePreferences(): Promise<UserThemePreferences> {
  return fetchApi<UserThemePreferences>('/settings/theme');
}

export async function updateUserThemePreferences(
  preferences: Partial<UserThemePreferences>
): Promise<UserThemePreferences> {
  return fetchApi<UserThemePreferences>('/settings/theme', {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Apply a theme by updating user preferences
 */
export async function applyTheme(themeId: string): Promise<UserThemePreferences> {
  return updateUserThemePreferences({ themeId });
}

/**
 * Set the theme mode (light/dark/system)
 */
export async function setThemeMode(
  mode: 'light' | 'dark' | 'system'
): Promise<UserThemePreferences> {
  return updateUserThemePreferences({ mode });
}

/**
 * Toggle whether a theme is approved for kids (admin only)
 */
export async function toggleKidApproval(themeId: string, approved: boolean): Promise<Theme> {
  const response = await fetchApi<{ theme: Theme }>(
    `/themes/${encodeURIComponent(themeId)}/kid-approval`,
    {
      method: 'PUT',
      body: JSON.stringify({ approved }),
    }
  );
  return response.theme;
}

// =============================================================================
// IMPORT / EXPORT
// =============================================================================

/**
 * Export a theme as a .habi-theme file (JSON)
 */
export async function exportTheme(themeId: string): Promise<Record<string, unknown>> {
  return fetchApi<Record<string, unknown>>(`/themes/${encodeURIComponent(themeId)}/export`);
}

/**
 * Import a .habi-theme file (admin only)
 */
export async function importTheme(
  data: Record<string, unknown>
): Promise<{ theme: Theme; warnings: string[] }> {
  return fetchApi<{ theme: Theme; warnings: string[] }>('/themes/import', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
