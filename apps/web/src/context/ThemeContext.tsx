// apps/web/src/context/ThemeContext.tsx
// Theme context with full theme system support and backend persistence

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Theme as ThemeDefinition, ThemeListItem, ThemeColors } from '../types/theme';
import { DEFAULT_COLORS_LIGHT, DEFAULT_COLORS_DARK } from '../types/theme';
import * as themesApi from '../api/themes';

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

const DEFAULT_ACCENT = '#8b5cf6';

/**
 * Convert theme colors to CSS variables
 */
function colorsToCssVariables(colors: ThemeColors, prefix = ''): Record<string, string> {
  const vars: Record<string, string> = {};
  const p = prefix ? `${prefix}-` : '';

  vars[`--${p}color-primary`] = colors.primary;
  vars[`--${p}color-primary-foreground`] = colors.primaryForeground;
  vars[`--${p}color-secondary`] = colors.secondary;
  vars[`--${p}color-secondary-foreground`] = colors.secondaryForeground;
  vars[`--${p}color-accent`] = colors.accent;
  vars[`--${p}color-accent-foreground`] = colors.accentForeground;
  vars[`--${p}color-background`] = colors.background;
  vars[`--${p}color-foreground`] = colors.foreground;
  vars[`--${p}color-card`] = colors.card;
  vars[`--${p}color-card-foreground`] = colors.cardForeground;
  vars[`--${p}color-muted`] = colors.muted;
  vars[`--${p}color-muted-foreground`] = colors.mutedForeground;
  vars[`--${p}color-border`] = colors.border;
  vars[`--${p}color-destructive`] = colors.destructive;
  vars[`--${p}color-destructive-foreground`] = colors.destructiveForeground;
  vars[`--${p}color-success`] = colors.success;
  vars[`--${p}color-success-foreground`] = colors.successForeground;
  vars[`--${p}color-warning`] = colors.warning;
  vars[`--${p}color-warning-foreground`] = colors.warningForeground;

  return vars;
}

/**
 * Build all CSS variables from a theme
 */
function buildCssVariables(
  theme: ThemeDefinition | null,
  resolvedMode: 'light' | 'dark',
  accentColor: string
): Record<string, string> {
  const vars: Record<string, string> = {};

  // Base accent color (legacy support)
  vars['--accent-color'] = accentColor;
  const hex = accentColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  vars['--accent-color-rgb'] = `${r}, ${g}, ${b}`;

  if (!theme) {
    // Use defaults when no theme is loaded
    const defaultColors = resolvedMode === 'dark' ? DEFAULT_COLORS_DARK : DEFAULT_COLORS_LIGHT;
    Object.assign(vars, colorsToCssVariables(defaultColors));
    return vars;
  }

  // Layout variables
  vars['--layout-type'] = theme.layout.type;
  vars['--sidebar-width'] = `${theme.layout.sidebarWidth || 256}px`;
  vars['--header-height'] = `${theme.layout.headerHeight || 64}px`;
  vars['--nav-style'] = theme.layout.navStyle;

  // Colors based on resolved mode
  const colors = resolvedMode === 'dark' ? theme.colorsDark : theme.colorsLight;
  Object.assign(vars, colorsToCssVariables(colors));

  // Typography
  vars['--font-family'] = theme.typography.fontFamily;
  if (theme.typography.fontFamilyHeading) {
    vars['--font-family-heading'] = theme.typography.fontFamilyHeading;
  }
  vars['--font-size-base'] = `${theme.typography.baseFontSize}px`;

  const lineHeightMap = { compact: '1.4', normal: '1.5', relaxed: '1.75' };
  vars['--line-height'] = lineHeightMap[theme.typography.lineHeight] || '1.5';

  // UI settings
  const radiusMap = { none: '0', small: '0.25rem', medium: '0.5rem', large: '1rem' };
  vars['--radius-base'] = radiusMap[theme.ui.borderRadius] || '0.5rem';

  const shadowMap = {
    none: 'none',
    subtle: '0 1px 2px rgba(0,0,0,0.05)',
    medium: '0 4px 6px rgba(0,0,0,0.1)',
    strong: '0 10px 15px rgba(0,0,0,0.15)',
  };
  vars['--shadow-base'] = shadowMap[theme.ui.shadowIntensity] || 'none';

  // Sidebar
  if (theme.sidebar) {
    if (theme.sidebar.backgroundType === 'solid' && theme.sidebar.backgroundColor) {
      vars['--sidebar-bg'] = theme.sidebar.backgroundColor;
    } else if (theme.sidebar.backgroundType === 'gradient') {
      vars['--sidebar-bg'] = `linear-gradient(180deg, ${theme.sidebar.gradientFrom}, ${theme.sidebar.gradientTo})`;
    }
    if (theme.sidebar.textColor) {
      vars['--sidebar-text'] = theme.sidebar.textColor;
    }
    if (theme.sidebar.imageUrl) {
      vars['--sidebar-image'] = `url(${theme.sidebar.imageUrl})`;
      vars['--sidebar-image-opacity'] = String(theme.sidebar.imageOpacity ?? 30);
    }
    if (theme.sidebar.blur) {
      vars['--sidebar-blur'] = `${theme.sidebar.blur}px`;
    }
  }

  // Page background
  if (theme.pageBackground.type === 'solid' && theme.pageBackground.color) {
    vars['--page-bg'] = theme.pageBackground.color;
  } else if (theme.pageBackground.type === 'gradient') {
    vars['--page-bg'] = `linear-gradient(180deg, ${theme.pageBackground.gradientFrom}, ${theme.pageBackground.gradientTo})`;
  } else if (theme.pageBackground.type === 'image' && theme.pageBackground.imageUrl) {
    vars['--page-bg-image'] = `url(${theme.pageBackground.imageUrl})`;
  }
  if (theme.pageBackground.pattern && theme.pageBackground.pattern !== 'none') {
    vars['--page-bg-pattern'] = theme.pageBackground.pattern;
  }

  return vars;
}

/**
 * Apply CSS variables to the document
 */
function applyCssVariables(vars: Record<string, string>) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

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
    const savedAccent = localStorage.getItem('habitrack-accent');
    const savedThemeId = localStorage.getItem('habitrack-theme-id');

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
