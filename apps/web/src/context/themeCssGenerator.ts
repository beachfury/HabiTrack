// apps/web/src/context/themeCssGenerator.ts
// Thin re-export barrel file. All CSS generation logic has been split into
// focused modules under ./css/. This file preserves the original import path
// for backwards compatibility.

export {
  // Utilities
  resolveImageUrl,
  applyOpacityToColor,
  SHADOW_MAP,
  API_BASE,
  // Color variables
  colorsToCssVariables,
  // Element variables
  elementStyleToCssVariables,
  ELEMENT_PREFIX_MAP,
  ELEMENT_CSS_SELECTORS,
  // Special modes
  loginPageToCssVariables,
  kioskToCssVariables,
  lcarsToCssVariables,
  applyLcarsMode,
  applyElementCustomCss,
  // Animation classes
  getAnimationClassesFromCustomCSS,
  getPageAnimationClasses,
  getSidebarAnimationClasses,
  // Core functions
  applyCssVariables,
  buildCssVariables,
  getResolvedColors,
} from './css/index';
