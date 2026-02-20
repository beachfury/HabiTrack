// apps/web/src/context/css/index.ts
// Main entry point for the theme CSS generation system.
// Assembles buildCssVariables and applyCssVariables from the focused sub-modules,
// and re-exports all public API functions.

import type {
  Theme as ThemeDefinition,
  ThemeColors,
  ExtendedTheme,
  ThemeableElement,
} from '../../types/theme';
import { DEFAULT_COLORS_LIGHT, DEFAULT_COLORS_DARK } from '../../types/theme';

import { resolveImageUrl } from './utils';
import { colorsToCssVariables } from './colorVariables';
import { elementStyleToCssVariables } from './elementVariables';
import {
  loginPageToCssVariables,
  kioskToCssVariables,
  lcarsToCssVariables,
  applyLcarsMode,
  applyElementCustomCss,
} from './specialModes';
import {
  getAnimationClassesFromCustomCSS,
  getPageAnimationClasses,
  getSidebarAnimationClasses,
} from './animationClasses';

// Re-export everything for the public API
export { resolveImageUrl, applyOpacityToColor, SHADOW_MAP, API_BASE } from './utils';
export { colorsToCssVariables } from './colorVariables';
export {
  elementStyleToCssVariables,
  ELEMENT_PREFIX_MAP,
  ELEMENT_CSS_SELECTORS,
} from './elementVariables';
export {
  loginPageToCssVariables,
  kioskToCssVariables,
  lcarsToCssVariables,
  applyLcarsMode,
  applyElementCustomCss,
} from './specialModes';
export {
  getAnimationClassesFromCustomCSS,
  getPageAnimationClasses,
  getSidebarAnimationClasses,
} from './animationClasses';

// ---- Element variable tracking (module-level state) ----

// Track previously applied element-specific CSS variables
let previousElementVars: Set<string> = new Set();

// List of element-specific CSS variable prefixes that need to be cleared when not present
const ELEMENT_VAR_PREFIXES = [
  '--card-', '--widget-', '--sidebar-', '--header-', '--page-', '--modal-', '--input-',
  '--btn-primary-', '--btn-secondary-', '--login-', '--kiosk-',
  // Home page elements
  '--home-title-', '--home-welcome-', '--home-stats-', '--home-chores-', '--home-events-', '--home-weather-', '--home-leaderboard-', '--home-meals-', '--home-shopping-', '--home-earnings-', '--home-family-', '--home-announcements-', '--home-page-',
  // Calendar page elements
  '--calendar-title-', '--calendar-grid-', '--calendar-meal-', '--calendar-user-', '--calendar-page-',
  // Chores page elements
  '--chores-task-', '--chores-paid-', '--chores-page-',
  // Shopping page elements
  '--shopping-filter-', '--shopping-list-', '--shopping-page-',
  // Messages page elements
  '--messages-announcements-', '--messages-chat-', '--messages-page-',
  // Settings page elements
  '--settings-nav-', '--settings-content-', '--settings-page-',
  // Store page elements
  '--store-page-',
  // Paid Chores page elements
  '--paidchores-page-',
  // Family page elements
  '--family-page-',
  // Budget page elements
  '--budget-page-',
  // Meals page elements
  '--meals-page-',
  // Recipes page elements
  '--recipes-page-',
];

/**
 * Apply CSS variables to the document
 * Also clears element-specific variables that are no longer present
 */
export function applyCssVariables(vars: Record<string, string>) {
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
 * Build all CSS variables from a theme
 */
export function buildCssVariables(
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

    // Auto-set semi-transparent borders for cards/widgets when page background is customized
    // This prevents gray borders from showing on dark/custom backgrounds
    const pageBackgroundElements: Record<string, { cards: string[]; widgets: string[] }> = {
      'home-background': {
        cards: ['home-chores', 'home-events', 'home-welcome', 'home-leaderboard', 'home-family', 'home-announcements'],
        widgets: ['home-stats', 'home-weather', 'home-meals', 'home-shopping', 'home-earnings'],
      },
      'calendar-background': {
        cards: ['calendar-grid', 'calendar-user'],
        widgets: ['calendar-meal'],
      },
      'chores-background': {
        cards: ['chores-task', 'chores-paid'],
        widgets: [],
      },
      'shopping-background': {
        cards: ['shopping-list'],
        widgets: ['shopping-filter'],
      },
      'messages-background': {
        cards: ['messages-announcements', 'messages-chat'],
        widgets: [],
      },
      'settings-background': {
        cards: ['settings-nav', 'settings-content'],
        widgets: [],
      },
    };

    for (const [bgElement, elements] of Object.entries(pageBackgroundElements)) {
      const bgStyle = extTheme.elementStyles[bgElement as ThemeableElement];
      const hasCustomBg = bgStyle && (bgStyle.backgroundColor || bgStyle.backgroundGradient || bgStyle.backgroundImage || bgStyle.customCSS);

      if (hasCustomBg) {
        // Set semi-transparent borders for cards and widgets on this page (if not explicitly set)
        for (const cardPrefix of elements.cards) {
          if (!vars[`--${cardPrefix}-border`]) {
            vars[`--${cardPrefix}-border`] = 'rgba(255,255,255,0.15)';
          }
        }
        for (const widgetPrefix of elements.widgets) {
          if (!vars[`--${widgetPrefix}-border`]) {
            vars[`--${widgetPrefix}-border`] = 'rgba(255,255,255,0.15)';
          }
        }
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

  // Apply kiosk styles
  if (extTheme.kioskStyle) {
    Object.assign(vars, kioskToCssVariables(extTheme.kioskStyle));
  }

  return vars;
}

/**
 * Get resolved colors for a theme and mode
 */
export function getResolvedColors(
  theme: ThemeDefinition | null,
  resolvedMode: 'light' | 'dark'
): ThemeColors {
  if (theme) {
    return resolvedMode === 'dark' ? theme.colorsDark : theme.colorsLight;
  }
  return resolvedMode === 'dark' ? DEFAULT_COLORS_DARK : DEFAULT_COLORS_LIGHT;
}
