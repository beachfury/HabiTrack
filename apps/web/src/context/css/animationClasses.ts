// apps/web/src/context/css/animationClasses.ts
// Animation and visual effect class extraction from customCSS strings.
// Detects special animation flags (matrix-rain, snowfall, sparkle, bubbles, embers)
// and returns corresponding CSS class names for the background effect system.

import type {
  Theme as ThemeDefinition,
  ExtendedTheme,
  ThemeableElement,
} from '../../types/theme';

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
