// apps/web/src/context/themeCssGenerator.ts
// CSS variable generation utilities for the theme system

import type {
  Theme as ThemeDefinition,
  ThemeColors,
  ExtendedTheme,
  ElementStyle,
  ThemeableElement,
  LoginPageStyle,
  LcarsMode,
  KioskStyle,
} from '../types/theme';
import { DEFAULT_COLORS_LIGHT, DEFAULT_COLORS_DARK, LCARS_COLORS } from '../types/theme';

// Helper to resolve image URLs - converts relative API paths to full URLs
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export function resolveImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  // If it starts with /, it's a relative API path - prepend the API base
  if (url.startsWith('/')) {
    return `${API_BASE}${url}`;
  }
  // Already an absolute URL
  return url;
}

/**
 * Apply opacity to a color value
 * Supports hex (#RGB, #RRGGBB, #RRGGBBAA), rgb(), rgba(), and named colors
 */
function applyOpacityToColor(color: string, opacity: number): string {
  if (opacity >= 1) return color;
  if (opacity <= 0) return 'transparent';

  // If it's already rgba with alpha, modify the alpha
  const rgbaMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/i);
  if (rgbaMatch) {
    const [, r, g, b] = rgbaMatch;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // If it's a hex color
  const hexMatch = color.match(/^#([0-9a-f]{3,8})$/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    let r: number, g: number, b: number;

    if (hex.length === 3) {
      // #RGB -> #RRGGBB
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6 || hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      return color; // Invalid hex, return as-is
    }

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // For named colors or other formats, wrap in color-mix (modern CSS)
  // This allows applying opacity to any CSS color
  return `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent)`;
}

/**
 * Map shadow presets to CSS values
 */
export const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  subtle: '0 1px 2px rgba(0,0,0,0.05)',
  medium: '0 4px 6px rgba(0,0,0,0.1)',
  strong: '0 10px 15px rgba(0,0,0,0.15)',
};

/**
 * Map element types to their CSS variable prefixes
 */
const ELEMENT_PREFIX_MAP: Record<ThemeableElement, string> = {
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
  'kiosk': 'kiosk',
  // Page-specific backgrounds
  'home-background': 'home-page',
  'calendar-background': 'calendar-page',
  'chores-background': 'chores-page',
  'shopping-background': 'shopping-page',
  'messages-background': 'messages-page',
  'settings-background': 'settings-page',
  'budget-background': 'budget-page',
  'meals-background': 'meals-page',
  'recipes-background': 'recipes-page',
  'paidchores-background': 'paidchores-page',
  'family-background': 'family-page',
  // Home page specific elements
  'home-title': 'home-title',
  'home-welcome-banner': 'home-welcome',
  'home-stats-widget': 'home-stats',
  'home-chores-card': 'home-chores',
  'home-events-card': 'home-events',
  'home-weather-widget': 'home-weather',
  'home-leaderboard-widget': 'home-leaderboard',
  'home-meals-widget': 'home-meals',
  // Calendar page specific elements
  'calendar-title': 'calendar-title',
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

/**
 * Convert ElementStyle to CSS variables for a specific element type
 */
export function elementStyleToCssVariables(
  elementType: ThemeableElement,
  style: ElementStyle
): Record<string, string> {
  const vars: Record<string, string> = {};
  const prefix = elementType.replace('-', '-');
  const p = ELEMENT_PREFIX_MAP[elementType] || prefix;

  // Background
  // If backgroundOpacity is set and < 1, apply it directly to the background color
  const bgOpacity = style.backgroundOpacity;
  const hasCustomOpacity = bgOpacity !== undefined && bgOpacity < 1;

  if (style.backgroundColor) {
    if (hasCustomOpacity) {
      vars[`--${p}-bg`] = applyOpacityToColor(style.backgroundColor, bgOpacity);
    } else {
      vars[`--${p}-bg`] = style.backgroundColor;
    }
  } else if (hasCustomOpacity && !style.backgroundGradient && !style.backgroundImage) {
    // If only opacity is set (no color/gradient/image), we need to set a background
    // that respects the opacity. Use color-mix with the card background.
    // Note: This creates a transparent version that lets the page background show through.
    vars[`--${p}-bg`] = `color-mix(in srgb, var(--card-bg) ${Math.round(bgOpacity * 100)}%, transparent)`;
  }

  if (style.backgroundGradient) {
    const dir = style.backgroundGradient.direction || 'to bottom';
    if (hasCustomOpacity) {
      // Apply opacity to both gradient colors
      const fromWithOpacity = applyOpacityToColor(style.backgroundGradient.from, bgOpacity);
      const toWithOpacity = applyOpacityToColor(style.backgroundGradient.to, bgOpacity);
      vars[`--${p}-bg`] = `linear-gradient(${dir}, ${fromWithOpacity}, ${toWithOpacity})`;
    } else {
      vars[`--${p}-bg`] = `linear-gradient(${dir}, ${style.backgroundGradient.from}, ${style.backgroundGradient.to})`;
    }
  }

  if (style.backgroundImage) {
    const resolvedUrl = resolveImageUrl(style.backgroundImage);
    if (resolvedUrl) {
      vars[`--${p}-bg-image`] = `url(${resolvedUrl})`;
    }
  }

  // Still set bg-opacity for background images (used by ::before pseudo-element)
  if (bgOpacity !== undefined) {
    vars[`--${p}-bg-opacity`] = String(bgOpacity);
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

  if (style.borderStyle) {
    vars[`--${p}-border-style`] = style.borderStyle;
  }

  // Effects
  if (style.boxShadow) {
    const shadow = SHADOW_MAP[style.boxShadow] || style.boxShadow;
    vars[`--${p}-shadow`] = shadow;
  }

  if (style.blur !== undefined) {
    vars[`--${p}-blur`] = `${style.blur}px`;
  }

  if (style.opacity !== undefined) {
    vars[`--${p}-opacity`] = String(style.opacity);
  }

  // Transform effects
  if (style.scale !== undefined) {
    vars[`--${p}-scale`] = String(style.scale);
  }

  if (style.rotate !== undefined) {
    vars[`--${p}-rotate`] = `${style.rotate}deg`;
  }

  if (style.skewX !== undefined) {
    vars[`--${p}-skew-x`] = `${style.skewX}deg`;
  }

  if (style.skewY !== undefined) {
    vars[`--${p}-skew-y`] = `${style.skewY}deg`;
  }

  // Glow effect
  if (style.glowColor) {
    vars[`--${p}-glow-color`] = style.glowColor;
  }

  if (style.glowSize !== undefined) {
    vars[`--${p}-glow-size`] = `${style.glowSize}px`;
  }

  // Filters
  if (style.saturation !== undefined) {
    vars[`--${p}-saturation`] = `${style.saturation}%`;
  }

  if (style.grayscale !== undefined) {
    vars[`--${p}-grayscale`] = `${style.grayscale}%`;
  }

  // Hover effects
  if (style.hoverScale !== undefined) {
    vars[`--${p}-hover-scale`] = String(style.hoverScale);
  }

  if (style.hoverOpacity !== undefined) {
    vars[`--${p}-hover-opacity`] = String(style.hoverOpacity);
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
export function loginPageToCssVariables(loginPage: LoginPageStyle): Record<string, string> {
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
 * Convert Kiosk style settings to CSS variables
 */
export function kioskToCssVariables(kioskStyle: KioskStyle): Record<string, string> {
  const vars: Record<string, string> = {};

  // Background gradient
  if (kioskStyle.backgroundGradient) {
    vars['--kiosk-bg-gradient-from'] = kioskStyle.backgroundGradient.from;
    vars['--kiosk-bg-gradient-to'] = kioskStyle.backgroundGradient.to;
  }

  // Solid background
  if (kioskStyle.backgroundType === 'solid' && kioskStyle.backgroundColor) {
    vars['--kiosk-bg-gradient-from'] = kioskStyle.backgroundColor;
    vars['--kiosk-bg-gradient-to'] = kioskStyle.backgroundColor;
  }

  // Background image
  if (kioskStyle.backgroundImage) {
    const resolvedUrl = resolveImageUrl(kioskStyle.backgroundImage);
    if (resolvedUrl) {
      vars['--kiosk-bg-image'] = `url(${resolvedUrl})`;
    }
  }

  // Text colors
  if (kioskStyle.textColor) vars['--kiosk-text'] = kioskStyle.textColor;
  if (kioskStyle.textMutedColor) vars['--kiosk-text-muted'] = kioskStyle.textMutedColor;

  // Button styling
  if (kioskStyle.buttonBgColor) vars['--kiosk-button-bg'] = kioskStyle.buttonBgColor;
  if (kioskStyle.buttonHoverColor) vars['--kiosk-button-hover'] = kioskStyle.buttonHoverColor;
  if (kioskStyle.buttonActiveColor) vars['--kiosk-button-active'] = kioskStyle.buttonActiveColor;
  if (kioskStyle.buttonTextColor) vars['--kiosk-text'] = kioskStyle.buttonTextColor;
  if (kioskStyle.accentColor) vars['--kiosk-accent'] = kioskStyle.accentColor;

  // Error styling
  if (kioskStyle.errorBgColor) vars['--kiosk-error-bg'] = kioskStyle.errorBgColor;
  if (kioskStyle.errorTextColor) vars['--kiosk-error-text'] = kioskStyle.errorTextColor;

  return vars;
}

/**
 * Convert LCARS mode settings to CSS variables
 */
export function lcarsToCssVariables(lcarsMode: LcarsMode): Record<string, string> {
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
export function colorsToCssVariables(colors: ThemeColors, prefix = ''): Record<string, string> {
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
        cards: ['home-chores', 'home-events', 'home-welcome', 'home-leaderboard'],
        widgets: ['home-stats', 'home-weather', 'home-meals'],
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

// Track previously applied element-specific CSS variables
let previousElementVars: Set<string> = new Set();

// List of element-specific CSS variable prefixes that need to be cleared when not present
const ELEMENT_VAR_PREFIXES = [
  '--card-', '--widget-', '--sidebar-', '--header-', '--page-', '--modal-', '--input-',
  '--btn-primary-', '--btn-secondary-', '--login-', '--kiosk-',
  // Home page elements
  '--home-title-', '--home-welcome-', '--home-stats-', '--home-chores-', '--home-events-', '--home-weather-', '--home-leaderboard-', '--home-meals-', '--home-page-',
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
 * Apply LCARS mode class to document
 */
export function applyLcarsMode(theme: ThemeDefinition | null) {
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

/**
 * CSS selectors for each themeable element
 * These map element types to CSS selectors that target them
 */
const ELEMENT_CSS_SELECTORS: Partial<Record<ThemeableElement, string>> = {
  // Global elements
  'page-background': 'body, main, .page-content, [data-theme-element="page-background"]',
  'sidebar': 'aside, .sidebar, [data-theme-element="sidebar"]',
  'header': 'header, .app-header, [data-theme-element="header"]',
  'card': '.themed-card, .bg-white.dark\\:bg-gray-800, .rounded-xl.border, [data-theme-element="card"]',
  'widget': '.themed-widget, .bg-gray-50.dark\\:bg-gray-700, [data-theme-element="widget"]',
  'button-primary': '.themed-btn-primary, button.bg-emerald-600, .btn-primary, [data-theme-element="button-primary"]',
  'button-secondary': '.themed-btn-secondary, button.bg-gray-100, button.bg-gray-200, .btn-secondary, [data-theme-element="button-secondary"]',
  'modal': '.themed-modal, [role="dialog"], .modal, [data-theme-element="modal"]',
  'input': '.themed-input, input:not([type="checkbox"]):not([type="radio"]), textarea, select, [data-theme-element="input"]',
  // Home page elements
  'home-title': '.themed-home-title, [data-theme-element="home-title"]',
  'home-welcome-banner': '.themed-home-welcome, [data-theme-element="home-welcome-banner"]',
  'home-stats-widget': '.themed-home-stats, [data-theme-element="home-stats-widget"]',
  'home-chores-card': '.themed-home-chores, [data-theme-element="home-chores-card"]',
  'home-events-card': '.themed-home-events, [data-theme-element="home-events-card"]',
  'home-weather-widget': '.themed-home-weather, [data-theme-element="home-weather-widget"]',
  'home-leaderboard-widget': '.themed-home-leaderboard, [data-theme-element="home-leaderboard-widget"]',
  'home-meals-widget': '.themed-home-meals, [data-theme-element="home-meals-widget"]',
  'home-background': '.themed-home-bg, [data-theme-element="home-background"]',
  // Calendar page elements
  'calendar-title': '.themed-calendar-title, [data-theme-element="calendar-title"]',
  'calendar-grid': '.themed-calendar-grid, .calendar-grid, [data-theme-element="calendar-grid"]',
  'calendar-meal-widget': '.themed-calendar-meal, .calendar-meal-widget, [data-theme-element="calendar-meal-widget"]',
  'calendar-user-card': '.themed-calendar-user, .calendar-user-card, [data-theme-element="calendar-user-card"]',
  'calendar-background': '.themed-calendar-bg, [data-theme-element="calendar-background"]',
  // Chores page elements
  'chores-task-card': '.themed-chores-task, [data-theme-element="chores-task-card"]',
  'chores-paid-card': '.themed-chores-paid, [data-theme-element="chores-paid-card"]',
  'chores-background': '.themed-chores-bg, [data-theme-element="chores-background"]',
  // Shopping page elements
  'shopping-filter-widget': '.themed-shopping-filter, [data-theme-element="shopping-filter-widget"]',
  'shopping-list-card': '.themed-shopping-list, [data-theme-element="shopping-list-card"]',
  'shopping-background': '.themed-shopping-bg, [data-theme-element="shopping-background"]',
  // Messages page elements
  'messages-announcements-card': '.themed-messages-announcements, [data-theme-element="messages-announcements-card"]',
  'messages-chat-card': '.themed-messages-chat, [data-theme-element="messages-chat-card"]',
  'messages-background': '.themed-messages-bg, [data-theme-element="messages-background"]',
  // Settings page elements
  'settings-nav-card': '.themed-settings-nav, [data-theme-element="settings-nav-card"]',
  'settings-content-card': '.themed-settings-content, [data-theme-element="settings-content-card"]',
  'settings-background': '.themed-settings-bg, [data-theme-element="settings-background"]',
  // Budget page elements
  'budget-background': '.themed-budget-bg, [data-theme-element="budget-background"]',
  // Meals page elements
  'meals-background': '.themed-meals-bg, [data-theme-element="meals-background"]',
  // Recipes page elements
  'recipes-background': '.themed-recipes-bg, [data-theme-element="recipes-background"]',
  // Paid Chores page elements
  'paidchores-background': '.themed-paidchores-bg, [data-theme-element="paidchores-background"]',
  // Family page elements
  'family-background': '.themed-family-bg, [data-theme-element="family-background"]',
};

/**
 * Apply element-level custom CSS from theme
 * Creates a <style> element with CSS rules for each element's customCSS
 */
export function applyElementCustomCss(theme: ThemeDefinition | null) {
  const styleId = 'theme-element-custom-css';
  let styleEl = document.getElementById(styleId);

  const extTheme = theme as ExtendedTheme | null;

  if (!extTheme?.elementStyles) {
    // Remove custom CSS if no theme or no element styles
    if (styleEl) {
      styleEl.remove();
    }
    return;
  }

  // Build CSS rules from element customCSS
  const cssRules: string[] = [];

  for (const [elementType, style] of Object.entries(extTheme.elementStyles)) {
    if (style?.customCSS) {
      const selector = ELEMENT_CSS_SELECTORS[elementType as ThemeableElement];
      if (selector) {
        // Wrap the custom CSS properties in a rule for the selector
        cssRules.push(`${selector} { ${style.customCSS} }`);
      }
    }
  }

  if (cssRules.length === 0) {
    // No custom CSS to apply, remove the style element
    if (styleEl) {
      styleEl.remove();
    }
    return;
  }

  // Create or update the style element
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = cssRules.join('\n');
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

/**
 * Extract animation classes from customCSS string
 * Detects special animation flags like "matrix-rain: true" and returns CSS class names
 */
export function getAnimationClassesFromCustomCSS(customCSS: string | undefined): string {
  if (!customCSS) return '';

  const classes: string[] = [];

  // Matrix rain effect
  if (customCSS.includes('matrix-rain: true') || customCSS.includes('matrix-rain:true')) {
    classes.push('matrix-rain-bg');
    const speedMatch = customCSS.match(/matrix-rain-speed:\s*(slow|normal|fast|veryfast)/i);
    if (speedMatch) {
      classes.push(`matrix-rain-${speedMatch[1].toLowerCase()}`);
    }
  }

  // Snowfall effect
  if (customCSS.includes('snowfall: true') || customCSS.includes('snowfall:true')) {
    classes.push('snowfall-bg');
  }

  // Sparkle effect
  if (customCSS.includes('sparkle: true') || customCSS.includes('sparkle:true')) {
    classes.push('sparkle-bg');
  }

  // Bubbles effect
  if (customCSS.includes('bubbles: true') || customCSS.includes('bubbles:true')) {
    classes.push('bubbles-bg');
  }

  // Embers effect
  if (customCSS.includes('embers: true') || customCSS.includes('embers:true')) {
    classes.push('embers-bg');
  }

  return classes.join(' ');
}

/**
 * Get animation classes for a specific page background element
 * Checks the page-specific background first, then falls back to global page-background
 */
export function getPageAnimationClasses(
  theme: ThemeDefinition | null,
  pageElement: ThemeableElement
): string {
  const extTheme = theme as ExtendedTheme | null;
  if (!extTheme?.elementStyles) return '';

  // Check page-specific background first
  const pageStyle = extTheme.elementStyles[pageElement];
  if (pageStyle?.customCSS) {
    const classes = getAnimationClassesFromCustomCSS(pageStyle.customCSS);
    if (classes) return classes;
  }

  // Fall back to global page-background
  const globalPageStyle = extTheme.elementStyles['page-background'];
  if (globalPageStyle?.customCSS) {
    return getAnimationClassesFromCustomCSS(globalPageStyle.customCSS);
  }

  return '';
}

/**
 * Get animation classes for the sidebar
 */
export function getSidebarAnimationClasses(theme: ThemeDefinition | null): string {
  const extTheme = theme as ExtendedTheme | null;
  if (!extTheme?.elementStyles?.sidebar?.customCSS) return '';

  return getAnimationClassesFromCustomCSS(extTheme.elementStyles.sidebar.customCSS);
}
