// apps/web/src/context/ThemeContext.tsx
// Theme context with full theme system support and backend persistence

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type {
  Theme as ThemeDefinition,
  ThemeListItem,
  ThemeColors,
  ExtendedTheme,
  ElementStyle,
  ThemeableElement,
  LoginPageStyle,
  LcarsMode,
} from '../types/theme';
import { DEFAULT_COLORS_LIGHT, DEFAULT_COLORS_DARK, LCARS_COLORS } from '../types/theme';
import * as themesApi from '../api/themes';

// Helper to resolve image URLs - converts relative API paths to full URLs
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
function resolveImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  // If it starts with /, it's a relative API path - prepend the API base
  if (url.startsWith('/')) {
    return `${API_BASE}${url}`;
  }
  // Already an absolute URL
  return url;
}

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

/**
 * Map shadow presets to CSS values
 */
const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  subtle: '0 1px 2px rgba(0,0,0,0.05)',
  medium: '0 4px 6px rgba(0,0,0,0.1)',
  strong: '0 10px 15px rgba(0,0,0,0.15)',
};

/**
 * Convert ElementStyle to CSS variables for a specific element type
 */
function elementStyleToCssVariables(
  elementType: ThemeableElement,
  style: ElementStyle
): Record<string, string> {
  const vars: Record<string, string> = {};
  const prefix = elementType.replace('-', '-');

  // Map element types to their CSS variable prefixes
  const prefixMap: Record<ThemeableElement, string> = {
    'page-background': 'page',
    'sidebar': 'sidebar',
    'header': 'header',
    'card': 'card',
    'widget': 'widget',
    'button-primary': 'btn-primary',
    'button-secondary': 'btn-secondary',
    'modal': 'modal',
    'input': 'input',
    'login-page': 'login',
    // Page-specific backgrounds
    'dashboard-background': 'dashboard-page',
    'calendar-background': 'calendar-page',
    'chores-background': 'chores-page',
    'shopping-background': 'shopping-page',
    'messages-background': 'messages-page',
    'settings-background': 'settings-page',
    'budget-background': 'budget-page',
    'meals-background': 'meals-page',
    'recipes-background': 'recipes-page',
    // Dashboard page specific elements
    'dashboard-stats-widget': 'dashboard-stats',
    'dashboard-chores-card': 'dashboard-chores',
    'dashboard-events-card': 'dashboard-events',
    'dashboard-weather-widget': 'dashboard-weather',
    // Calendar page specific elements
    'calendar-grid': 'calendar-grid',
    'calendar-meal-widget': 'calendar-meal',
    'calendar-user-card': 'calendar-user',
    // Chores page specific elements
    'chores-task-card': 'chores-task',
    'chores-paid-card': 'chores-paid',
    // Shopping page specific elements
    'shopping-filter-widget': 'shopping-filter',
    'shopping-list-card': 'shopping-list',
    // Messages page specific elements
    'messages-announcements-card': 'messages-announcements',
    'messages-chat-card': 'messages-chat',
    // Settings page specific elements
    'settings-nav-card': 'settings-nav',
    'settings-content-card': 'settings-content',
  };

  const p = prefixMap[elementType] || prefix;

  // Background
  if (style.backgroundColor) {
    vars[`--${p}-bg`] = style.backgroundColor;
  }

  if (style.backgroundGradient) {
    const dir = style.backgroundGradient.direction || 'to bottom';
    vars[`--${p}-bg`] = `linear-gradient(${dir}, ${style.backgroundGradient.from}, ${style.backgroundGradient.to})`;
  }

  if (style.backgroundImage) {
    const resolvedUrl = resolveImageUrl(style.backgroundImage);
    if (resolvedUrl) {
      vars[`--${p}-bg-image`] = `url(${resolvedUrl})`;
    }
  }

  if (style.backgroundOpacity !== undefined) {
    vars[`--${p}-bg-opacity`] = String(style.backgroundOpacity);
  }

  // Text
  if (style.textColor) {
    vars[`--${p}-text`] = style.textColor;
  }

  if (style.textSize) {
    vars[`--${p}-font-size`] = `${style.textSize}px`;
  }

  if (style.fontWeight) {
    const weightMap: Record<string, string> = {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    };
    vars[`--${p}-font-weight`] = weightMap[style.fontWeight] || '400';
  }

  if (style.fontFamily) {
    vars[`--${p}-font-family`] = style.fontFamily;
  }

  // Border
  if (style.borderColor) {
    vars[`--${p}-border`] = style.borderColor;
  }

  if (style.borderWidth !== undefined) {
    vars[`--${p}-border-width`] = `${style.borderWidth}px`;
  }

  if (style.borderRadius !== undefined) {
    vars[`--${p}-radius`] = `${style.borderRadius}px`;
  }

  // Effects
  if (style.boxShadow) {
    const shadow = SHADOW_MAP[style.boxShadow] || style.boxShadow;
    vars[`--${p}-shadow`] = shadow;
  }

  // Spacing
  if (style.padding) {
    vars[`--${p}-padding`] = style.padding;
  }

  // Store custom CSS in a variable (applied via JS)
  if (style.customCSS) {
    vars[`--${p}-custom-css`] = style.customCSS;
  }

  return vars;
}

/**
 * Convert LoginPageStyle to CSS variables
 */
function loginPageToCssVariables(loginPage: LoginPageStyle): Record<string, string> {
  const vars: Record<string, string> = {};

  // Background
  if (loginPage.backgroundType === 'solid' && loginPage.backgroundColor) {
    vars['--login-bg'] = loginPage.backgroundColor;
  } else if (loginPage.backgroundType === 'gradient') {
    const dir = loginPage.gradientDirection || 'to bottom right';
    vars['--login-bg'] = `linear-gradient(${dir}, ${loginPage.gradientFrom || '#3d4f5f'}, ${loginPage.gradientTo || '#1a2530'})`;
  } else if (loginPage.backgroundType === 'image' && loginPage.imageUrl) {
    const resolvedUrl = resolveImageUrl(loginPage.imageUrl);
    if (resolvedUrl) {
      vars['--login-bg-image'] = `url(${resolvedUrl})`;
    }
    if (loginPage.imageOpacity !== undefined) {
      vars['--login-bg-opacity'] = String(loginPage.imageOpacity);
    }
  }

  // Card styling
  if (loginPage.cardStyle) {
    Object.assign(vars, elementStyleToCssVariables('login-page', loginPage.cardStyle));
  }

  // Branding
  if (loginPage.logoUrl) {
    const resolvedUrl = resolveImageUrl(loginPage.logoUrl);
    if (resolvedUrl) {
      vars['--login-logo'] = `url(${resolvedUrl})`;
    }
  }

  if (loginPage.logoSize) {
    vars['--login-logo-size'] = `${loginPage.logoSize}px`;
  }

  if (loginPage.brandColor) {
    vars['--login-brand-color'] = loginPage.brandColor;
  }

  return vars;
}

/**
 * Convert LCARS mode settings to CSS variables
 */
function lcarsToCssVariables(lcarsMode: LcarsMode): Record<string, string> {
  const vars: Record<string, string> = {};

  vars['--lcars-enabled'] = lcarsMode.enabled ? '1' : '0';
  vars['--lcars-corner-style'] = lcarsMode.cornerStyle;

  if (lcarsMode.colorScheme) {
    vars['--lcars-primary'] = lcarsMode.colorScheme.primary;
    vars['--lcars-secondary'] = lcarsMode.colorScheme.secondary;
    vars['--lcars-tertiary'] = lcarsMode.colorScheme.tertiary;
    vars['--lcars-background'] = lcarsMode.colorScheme.background;
  } else {
    // Use default LCARS colors
    vars['--lcars-primary'] = LCARS_COLORS.gold;
    vars['--lcars-secondary'] = LCARS_COLORS.purple;
    vars['--lcars-tertiary'] = LCARS_COLORS.salmon;
    vars['--lcars-background'] = LCARS_COLORS.black;
  }

  return vars;
}

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

  // Font weight
  const fontWeightMap = { normal: '400', medium: '500', semibold: '600', bold: '700' };
  vars['--font-weight'] = fontWeightMap[theme.typography.fontWeight || 'normal'] || '400';

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
      const resolvedUrl = resolveImageUrl(theme.sidebar.imageUrl);
      if (resolvedUrl) {
        vars['--sidebar-image'] = `url(${resolvedUrl})`;
      }
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
    const resolvedUrl = resolveImageUrl(theme.pageBackground.imageUrl);
    if (resolvedUrl) {
      vars['--page-bg-image'] = `url(${resolvedUrl})`;
    }
  }
  if (theme.pageBackground.pattern && theme.pageBackground.pattern !== 'none') {
    vars['--page-bg-pattern'] = theme.pageBackground.pattern;
  }

  // Extended theme: Element-level customization
  const extTheme = theme as ExtendedTheme;

  // Apply element styles
  if (extTheme.elementStyles) {
    for (const [elementType, style] of Object.entries(extTheme.elementStyles)) {
      if (style) {
        Object.assign(vars, elementStyleToCssVariables(elementType as ThemeableElement, style));
      }
    }
  }

  // Apply login page styles
  if (extTheme.loginPage) {
    Object.assign(vars, loginPageToCssVariables(extTheme.loginPage));
  }

  // Apply LCARS mode
  if (extTheme.lcarsMode) {
    Object.assign(vars, lcarsToCssVariables(extTheme.lcarsMode));
  }

  return vars;
}

// Track previously applied element-specific CSS variables
let previousElementVars: Set<string> = new Set();

// List of element-specific CSS variable prefixes that need to be cleared when not present
const ELEMENT_VAR_PREFIXES = [
  '--card-', '--widget-', '--sidebar-', '--header-', '--page-', '--modal-', '--input-',
  '--btn-primary-', '--btn-secondary-', '--login-',
  '--calendar-grid-', '--calendar-meal-', '--calendar-user-',
];

/**
 * Apply CSS variables to the document
 * Also clears element-specific variables that are no longer present
 */
function applyCssVariables(vars: Record<string, string>) {
  const root = document.documentElement;
  const currentElementVars = new Set<string>();

  // Apply new variables
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);

    // Track element-specific variables
    if (ELEMENT_VAR_PREFIXES.some(prefix => key.startsWith(prefix))) {
      currentElementVars.add(key);
    }
  }

  // Remove element-specific variables that were previously set but aren't in the new set
  // This handles cases where element styles are reset (e.g., text color removed)
  for (const varName of previousElementVars) {
    if (!currentElementVars.has(varName)) {
      root.style.removeProperty(varName);
    }
  }

  // Update the tracking set
  previousElementVars = currentElementVars;
}

/**
 * Apply LCARS mode class to document
 */
function applyLcarsMode(theme: ThemeDefinition | null) {
  const extTheme = theme as ExtendedTheme | null;
  const root = document.documentElement;

  if (extTheme?.lcarsMode?.enabled) {
    root.classList.add('lcars-mode');

    // Apply corner style class
    root.classList.remove('lcars-corner-rounded', 'lcars-corner-sharp', 'lcars-corner-curve');
    root.classList.add(`lcars-corner-${extTheme.lcarsMode.cornerStyle}`);

    // Apply global custom CSS if provided
    if (extTheme.lcarsMode.customCSS) {
      let styleEl = document.getElementById('lcars-custom-css');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'lcars-custom-css';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = extTheme.lcarsMode.customCSS;
    }
  } else {
    root.classList.remove('lcars-mode', 'lcars-corner-rounded', 'lcars-corner-sharp', 'lcars-corner-curve');

    // Remove custom CSS
    const styleEl = document.getElementById('lcars-custom-css');
    if (styleEl) {
      styleEl.remove();
    }
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
