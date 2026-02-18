// apps/web/src/context/css/specialModes.ts
// CSS variable generators and DOM manipulators for special theme modes:
// - Login page styling (background, card, branding)
// - Kiosk mode styling (background, buttons, text)
// - LCARS mode styling (Star Trek LCARS UI — corner styles, color schemes)
// - Element-level custom CSS injection

import type {
  Theme as ThemeDefinition,
  ExtendedTheme,
  LoginPageStyle,
  LcarsMode,
  KioskStyle,
  ThemeableElement,
} from '../../types/theme';
import { LCARS_COLORS } from '../../types/theme';
import { resolveImageUrl } from './utils';
import { elementStyleToCssVariables, ELEMENT_CSS_SELECTORS } from './elementVariables';

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
