// apps/web/src/context/ThemeContext.tsx
// Theme context with full theme system support and backend persistence
// CSS generation utilities extracted to themeCssGenerator.ts

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type {
  Theme as ThemeDefinition,
  ThemeListItem,
  ThemeColors,
} from '../types/theme';
import { DEFAULT_COLORS_LIGHT, DEFAULT_COLORS_DARK } from '../types/theme';
import * as themesApi from '../api/themes';
import {
  buildCssVariables,
  applyCssVariables,
  applyLcarsMode,
} from './themeCssGenerator';

// Local ThemeMode type (subset of the API type which also includes 'auto')
type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  // Legacy API (backward compatible)
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  accentColor: string;
  setTheme: (theme: ThemeMode) => void;
  setAccentColor: (color: string) => void;

  // New theme system
  activeTheme: ThemeDefinition | null;
  activeThemeId: string | null;
  themes: ThemeListItem[];
  loading: boolean;
  setActiveTheme: (themeId: string) => Promise<void>;
  loadThemes: () => Promise<void>;

  // CSS variables
  cssVariables: Record<string, string>;

  // Resolved colors based on mode
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// HabiTrack Green as default accent
const DEFAULT_ACCENT = '#3cb371';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Legacy state (backward compatible)
  // Start with localStorage value or 'light' as default (not 'system') to prevent flash
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('habitrack-theme') as ThemeMode | null;
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        return saved;
      }
    }
    return 'light'; // Default to light instead of system to prevent dark flash
  });
  const [accentColor, setAccentColorState] = useState(DEFAULT_ACCENT);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // New theme system state
  const [activeTheme, setActiveThemeState] = useState<ThemeDefinition | null>(null);
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
  const [themes, setThemes] = useState<ThemeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cssVariables, setCssVariables] = useState<Record<string, string>>({});

  // Load initial accent and theme ID from localStorage
  useEffect(() => {
    let savedAccent = localStorage.getItem('habitrack-accent');
    const savedThemeId = localStorage.getItem('habitrack-theme-id');

    // Migrate old purple accent color to HabiTrack green
    if (savedAccent === '#8b5cf6' || savedAccent === '#a78bfa') {
      savedAccent = '#3cb371';
      localStorage.setItem('habitrack-accent', savedAccent);
    }

    // Theme mode is already loaded in initial state
    if (savedAccent) setAccentColorState(savedAccent);
    if (savedThemeId) setActiveThemeId(savedThemeId);
  }, []);

  // Load themes from API
  const loadThemes = useCallback(async () => {
    try {
      setLoading(true);
      const themeList = await themesApi.listThemes();
      setThemes(themeList);
    } catch (error) {
      console.error('Failed to load themes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user preferences and themes on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [prefs, themeList] = await Promise.all([
          themesApi.getUserThemePreferences().catch(() => null),
          themesApi.listThemes().catch(() => []),
        ]);

        setThemes(themeList);

        if (prefs) {
          // Map 'auto' to 'system' for local state
          if (prefs.mode) {
            const mappedMode = prefs.mode === 'auto' ? 'system' : prefs.mode as ThemeMode;
            setModeState(mappedMode);
            // Sync localStorage with API value
            localStorage.setItem('habitrack-theme', mappedMode);
          }
          if (prefs.themeId) {
            setActiveThemeId(prefs.themeId);
            // Load the full theme
            const theme = await themesApi.getTheme(prefs.themeId).catch(() => null);
            if (theme) {
              setActiveThemeState(theme);
              // Use theme's accent color
              if (theme.colorsLight.accent) {
                setAccentColorState(theme.colorsLight.accent);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to load theme preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Resolve system theme and apply dark/light class
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateResolvedTheme = () => {
      const resolved = mode === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : mode;
      setResolvedTheme(resolved);

      // Apply to document
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(resolved);
    };

    updateResolvedTheme();
    mediaQuery.addEventListener('change', updateResolvedTheme);

    return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
  }, [mode]);

  // Build and apply CSS variables when theme/mode/accent changes
  useEffect(() => {
    const vars = buildCssVariables(activeTheme, resolvedTheme, accentColor);
    setCssVariables(vars);
    applyCssVariables(vars);
    applyLcarsMode(activeTheme);
  }, [activeTheme, resolvedTheme, accentColor]);

  // Get current colors based on mode
  const colors = activeTheme
    ? (resolvedTheme === 'dark' ? activeTheme.colorsDark : activeTheme.colorsLight)
    : (resolvedTheme === 'dark' ? DEFAULT_COLORS_DARK : DEFAULT_COLORS_LIGHT);

  // Backend persistence helper
  const updateUserSettings = async (payload: Record<string, unknown>) => {
    try {
      await fetch('/api/settings/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
    } catch {
      // ignore network errors
    }
  };

  // Legacy setTheme (mode)
  const setTheme = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('habitrack-theme', newMode);

    // Save to both old and new endpoints
    updateUserSettings({ theme: newMode }).catch(() => {});
    themesApi.setThemeMode(newMode).catch(() => {});
  }, []);

  // Legacy setAccentColor
  const setAccentColor = useCallback((color: string) => {
    setAccentColorState(color);
    localStorage.setItem('habitrack-accent', color);
    updateUserSettings({ accentColor: color }).catch(() => {});
  }, []);

  // New: Set active theme
  const setActiveTheme = useCallback(async (themeId: string) => {
    try {
      setActiveThemeId(themeId);
      localStorage.setItem('habitrack-theme-id', themeId);

      // Load full theme details
      const theme = await themesApi.getTheme(themeId);
      setActiveThemeState(theme);

      // Update accent color from theme
      if (theme.colorsLight.accent) {
        setAccentColorState(theme.colorsLight.accent);
        localStorage.setItem('habitrack-accent', theme.colorsLight.accent);
      }

      // Persist to backend
      await themesApi.applyTheme(themeId);
    } catch (error) {
      console.error('Failed to set active theme:', error);
      throw error;
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        // Legacy API
        theme: mode,
        resolvedTheme,
        accentColor,
        setTheme,
        setAccentColor,
        // New theme system
        activeTheme,
        activeThemeId,
        themes,
        loading,
        setActiveTheme,
        loadThemes,
        // CSS variables and colors
        cssVariables,
        colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
