// apps/web/src/context/css/elementVariables.ts
// Converts ElementStyle objects into CSS custom properties for per-element theming.
// Includes the element prefix map, CSS selector map, and the elementStyleToCssVariables function.

import type {
  ElementStyle,
  ThemeableElement,
} from '../../types/theme';
import { resolveImageUrl, applyOpacityToColor, SHADOW_MAP } from './utils';

/**
 * Map element types to their CSS variable prefixes
 */
export const ELEMENT_PREFIX_MAP: Record<ThemeableElement, string> = {
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
  'store-background': 'store-page',
  // Home page specific elements
  'home-title': 'home-title',
  'home-welcome-banner': 'home-welcome',
  'home-stats-widget': 'home-stats',
  'home-chores-card': 'home-chores',
  'home-events-card': 'home-events',
  'home-weather-widget': 'home-weather',
  'home-leaderboard-widget': 'home-leaderboard',
  'home-meals-widget': 'home-meals',
  'home-shopping-widget': 'home-shopping',
  'home-earnings-widget': 'home-earnings',
  'home-family-widget': 'home-family',
  'home-announcements-widget': 'home-announcements',
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
 * CSS selectors for each themeable element
 * These map element types to CSS selectors that target them
 */
export const ELEMENT_CSS_SELECTORS: Partial<Record<ThemeableElement, string>> = {
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
  'home-shopping-widget': '.themed-home-shopping, [data-theme-element="home-shopping-widget"]',
  'home-earnings-widget': '.themed-home-earnings, [data-theme-element="home-earnings-widget"]',
  'home-family-widget': '.themed-home-family, [data-theme-element="home-family-widget"]',
  'home-announcements-widget': '.themed-home-announcements, [data-theme-element="home-announcements-widget"]',
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
  // Store page elements
  'store-background': '.themed-store-bg, [data-theme-element="store-background"]',
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
