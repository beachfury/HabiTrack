// apps/web/src/components/themes/PreviewPages/styleUtils.ts
// Shared utility functions for building element styles in preview pages

import type { CSSProperties } from 'react';
import type { ElementStyle } from '../../../types/theme';

// Helper to resolve image URLs - converts relative API paths to full URLs
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
function resolveImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/')) {
    return `${API_BASE}${url}`;
  }
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
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6 || hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      return color;
    }

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // For named colors or other formats, use color-mix
  return `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent)`;
}

// Shadow preset values
export const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  subtle: '0 1px 3px rgba(0,0,0,0.08)',
  medium: '0 4px 6px rgba(0,0,0,0.1)',
  strong: '0 10px 15px rgba(0,0,0,0.15)',
};

// Border radius preset values
export const RADIUS_MAP: Record<string, string> = {
  none: '0',
  small: '4px',
  medium: '8px',
  large: '16px',
};

// Font weight mapping
const FONT_WEIGHT_MAP: Record<string, number> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

/**
 * Parse CSS string to React CSSProperties object
 * Handles custom CSS from the Advanced tab
 */
export function parseCustomCssToStyle(css: string): CSSProperties {
  const style: Record<string, string> = {};

  // Split by semicolons, handling edge cases
  const declarations = css.split(';').filter(d => d.trim());

  for (const declaration of declarations) {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex === -1) continue;

    const property = declaration.slice(0, colonIndex).trim();
    const value = declaration.slice(colonIndex + 1).trim();

    if (!property || !value) continue;

    // Convert kebab-case to camelCase for React
    const camelProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    style[camelProperty] = value;
  }

  return style as CSSProperties;
}

/**
 * Build a complete style object from ElementStyle with all properties applied
 */
export function buildElementStyle(
  elementStyle: ElementStyle,
  fallbackBg: string,
  fallbackBorder: string,
  fallbackRadius: string,
  fallbackShadow: string,
  fallbackTextColor?: string
): CSSProperties {
  const style: CSSProperties = {};

  // Background - handle gradient, image, or solid color
  // Apply background opacity directly to colors (not to the element itself, which would affect children)
  const bgOpacity = elementStyle.backgroundOpacity;
  const hasCustomOpacity = bgOpacity !== undefined && bgOpacity < 1;

  if (elementStyle.backgroundGradient) {
    const { from, to, direction } = elementStyle.backgroundGradient;
    if (hasCustomOpacity) {
      const fromWithOpacity = applyOpacityToColor(from, bgOpacity);
      const toWithOpacity = applyOpacityToColor(to, bgOpacity);
      style.background = `linear-gradient(${direction || 'to bottom'}, ${fromWithOpacity}, ${toWithOpacity})`;
    } else {
      style.background = `linear-gradient(${direction || 'to bottom'}, ${from}, ${to})`;
    }
  } else if (elementStyle.backgroundImage) {
    const resolvedUrl = resolveImageUrl(elementStyle.backgroundImage);
    if (resolvedUrl) {
      style.backgroundImage = `url(${resolvedUrl})`;
    }
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
    // Also set a fallback background color (with opacity if set)
    const bgColor = elementStyle.backgroundColor || fallbackBg;
    style.backgroundColor = hasCustomOpacity ? applyOpacityToColor(bgColor, bgOpacity) : bgColor;
  } else if (elementStyle.backgroundColor) {
    style.backgroundColor = hasCustomOpacity
      ? applyOpacityToColor(elementStyle.backgroundColor, bgOpacity)
      : elementStyle.backgroundColor;
  } else {
    style.backgroundColor = hasCustomOpacity
      ? applyOpacityToColor(fallbackBg, bgOpacity)
      : fallbackBg;
  }

  // Note: backgroundOpacity is now applied directly to colors above, not to the element

  // Text styling
  if (elementStyle.textColor) {
    style.color = elementStyle.textColor;
  } else if (fallbackTextColor) {
    style.color = fallbackTextColor;
  }

  if (elementStyle.textSize) {
    style.fontSize = `${elementStyle.textSize}px`;
  }

  if (elementStyle.fontWeight) {
    style.fontWeight = FONT_WEIGHT_MAP[elementStyle.fontWeight] || 400;
  }

  if (elementStyle.fontFamily) {
    style.fontFamily = elementStyle.fontFamily;
  }

  // Border
  const borderWidth = elementStyle.borderWidth ?? 1;
  const borderColor = elementStyle.borderColor || fallbackBorder;
  const borderStyleValue = elementStyle.borderStyle || 'solid';
  if (borderWidth > 0 && borderStyleValue !== 'none') {
    style.border = `${borderWidth}px ${borderStyleValue} ${borderColor}`;
  } else if (borderStyleValue === 'none' || borderWidth === 0) {
    style.border = 'none';
  }

  // Border radius
  style.borderRadius = elementStyle.borderRadius !== undefined
    ? `${elementStyle.borderRadius}px`
    : fallbackRadius;

  // Shadow
  if (elementStyle.boxShadow) {
    style.boxShadow = SHADOW_MAP[elementStyle.boxShadow] || elementStyle.boxShadow;
  } else {
    style.boxShadow = fallbackShadow;
  }

  // Padding
  if (elementStyle.padding) {
    style.padding = elementStyle.padding;
  }

  // Blur (backdrop-filter)
  if (elementStyle.blur) {
    style.backdropFilter = `blur(${elementStyle.blur}px)`;
  }

  // Element opacity (overrides background opacity if both set)
  if (elementStyle.opacity !== undefined) {
    style.opacity = elementStyle.opacity;
  }

  // Transform effects
  const transforms: string[] = [];
  if (elementStyle.scale !== undefined && elementStyle.scale !== 1) {
    transforms.push(`scale(${elementStyle.scale})`);
  }
  if (elementStyle.rotate !== undefined && elementStyle.rotate !== 0) {
    transforms.push(`rotate(${elementStyle.rotate}deg)`);
  }
  if (elementStyle.skewX !== undefined && elementStyle.skewX !== 0) {
    transforms.push(`skewX(${elementStyle.skewX}deg)`);
  }
  if (elementStyle.skewY !== undefined && elementStyle.skewY !== 0) {
    transforms.push(`skewY(${elementStyle.skewY}deg)`);
  }
  if (transforms.length > 0) {
    style.transform = transforms.join(' ');
  }

  // Filter effects
  const filters: string[] = [];
  if (elementStyle.saturation !== undefined && elementStyle.saturation !== 100) {
    filters.push(`saturate(${elementStyle.saturation}%)`);
  }
  if (elementStyle.grayscale !== undefined && elementStyle.grayscale !== 0) {
    filters.push(`grayscale(${elementStyle.grayscale}%)`);
  }
  if (filters.length > 0) {
    style.filter = filters.join(' ');
  }

  // Glow effect (add to box-shadow)
  if (elementStyle.glowColor && elementStyle.glowSize !== undefined && elementStyle.glowSize > 0) {
    const existingShadow = style.boxShadow && style.boxShadow !== 'none' ? `${style.boxShadow}, ` : '';
    style.boxShadow = `${existingShadow}0 0 ${elementStyle.glowSize}px ${elementStyle.glowColor}`;
  }

  // Add transition for hover effects
  style.transition = 'transform 0.2s ease, opacity 0.2s ease, filter 0.2s ease';

  // Apply custom CSS (from Advanced tab) - overrides other properties
  if (elementStyle.customCSS) {
    const customStyles = parseCustomCssToStyle(elementStyle.customCSS);
    Object.assign(style, customStyles);
  }

  return style;
}

/**
 * Build page background style with fallback to global page-background
 * Returns both the style and info about whether it has custom styling
 */
export function buildPageBackgroundStyle(
  pageStyle: ElementStyle | undefined,
  globalPageStyle: ElementStyle | undefined,
  fallbackBg: string
): { style: CSSProperties; hasCustomStyle: boolean; backgroundImageUrl?: string; customCSS?: string } {
  const style: CSSProperties = {
    position: 'relative',
  };

  // Use page-specific style if it has any background properties OR customCSS, else fall back to global
  const effectiveStyle = (pageStyle && (
    pageStyle.backgroundColor ||
    pageStyle.backgroundGradient ||
    pageStyle.backgroundImage ||
    pageStyle.customCSS
  )) ? pageStyle : globalPageStyle;

  const hasCustomStyle = !!(effectiveStyle && (
    effectiveStyle.backgroundColor ||
    effectiveStyle.backgroundGradient ||
    effectiveStyle.backgroundImage ||
    effectiveStyle.customCSS
  ));

  let backgroundImageUrl: string | undefined;

  if (effectiveStyle) {
    if (effectiveStyle.backgroundGradient) {
      const { from, to, direction } = effectiveStyle.backgroundGradient;
      style.background = `linear-gradient(${direction || 'to bottom'}, ${from}, ${to})`;
    } else if (effectiveStyle.backgroundImage) {
      backgroundImageUrl = resolveImageUrl(effectiveStyle.backgroundImage);
      // Background image will be rendered via ::before pseudo-element
      // Set a fallback color
      style.backgroundColor = effectiveStyle.backgroundColor || fallbackBg;
    } else if (effectiveStyle.backgroundColor) {
      style.backgroundColor = effectiveStyle.backgroundColor;
    } else {
      style.backgroundColor = fallbackBg;
    }

    // Apply custom CSS (from Advanced tab) - overrides other properties
    if (effectiveStyle.customCSS) {
      const customStyles = parseCustomCssToStyle(effectiveStyle.customCSS);
      Object.assign(style, customStyles);
    }
  } else {
    style.backgroundColor = fallbackBg;
  }

  return { style, hasCustomStyle, backgroundImageUrl, customCSS: effectiveStyle?.customCSS };
}

/**
 * Build style for button elements
 */
export function buildButtonStyle(
  elementStyle: ElementStyle,
  fallbackBg: string,
  fallbackText: string,
  fallbackBorder: string,
  fallbackRadius: string
): CSSProperties {
  // Apply background opacity directly to colors
  const bgOpacity = elementStyle.backgroundOpacity;
  const hasCustomOpacity = bgOpacity !== undefined && bgOpacity < 1;

  const bgColor = elementStyle.backgroundColor || fallbackBg;
  const style: CSSProperties = {
    backgroundColor: hasCustomOpacity ? applyOpacityToColor(bgColor, bgOpacity) : bgColor,
    color: elementStyle.textColor || fallbackText,
    borderRadius: elementStyle.borderRadius !== undefined
      ? `${elementStyle.borderRadius}px`
      : fallbackRadius,
  };

  // Background gradient for buttons
  if (elementStyle.backgroundGradient) {
    const { from, to, direction } = elementStyle.backgroundGradient;
    if (hasCustomOpacity) {
      const fromWithOpacity = applyOpacityToColor(from, bgOpacity);
      const toWithOpacity = applyOpacityToColor(to, bgOpacity);
      style.background = `linear-gradient(${direction || 'to bottom'}, ${fromWithOpacity}, ${toWithOpacity})`;
    } else {
      style.background = `linear-gradient(${direction || 'to bottom'}, ${from}, ${to})`;
    }
  }

  // Border
  const borderWidth = elementStyle.borderWidth;
  if (borderWidth !== undefined && borderWidth > 0) {
    const borderColor = elementStyle.borderColor || fallbackBorder;
    const borderStyleValue = elementStyle.borderStyle || 'solid';
    style.border = `${borderWidth}px ${borderStyleValue} ${borderColor}`;
  } else if (fallbackBorder && fallbackBorder !== 'transparent') {
    style.border = `1px solid ${fallbackBorder}`;
  }

  // Shadow
  if (elementStyle.boxShadow) {
    style.boxShadow = SHADOW_MAP[elementStyle.boxShadow] || elementStyle.boxShadow;
  }

  // Effects
  if (elementStyle.opacity !== undefined) {
    style.opacity = elementStyle.opacity;
  }

  if (elementStyle.blur) {
    style.backdropFilter = `blur(${elementStyle.blur}px)`;
  }

  // Transform effects
  const transforms: string[] = [];
  if (elementStyle.scale !== undefined && elementStyle.scale !== 1) {
    transforms.push(`scale(${elementStyle.scale})`);
  }
  if (elementStyle.rotate !== undefined && elementStyle.rotate !== 0) {
    transforms.push(`rotate(${elementStyle.rotate}deg)`);
  }
  if (elementStyle.skewX !== undefined && elementStyle.skewX !== 0) {
    transforms.push(`skewX(${elementStyle.skewX}deg)`);
  }
  if (elementStyle.skewY !== undefined && elementStyle.skewY !== 0) {
    transforms.push(`skewY(${elementStyle.skewY}deg)`);
  }
  if (transforms.length > 0) {
    style.transform = transforms.join(' ');
  }

  // Filter effects
  const filters: string[] = [];
  if (elementStyle.saturation !== undefined && elementStyle.saturation !== 100) {
    filters.push(`saturate(${elementStyle.saturation}%)`);
  }
  if (elementStyle.grayscale !== undefined && elementStyle.grayscale !== 0) {
    filters.push(`grayscale(${elementStyle.grayscale}%)`);
  }
  if (filters.length > 0) {
    style.filter = filters.join(' ');
  }

  // Glow effect (add to box-shadow)
  if (elementStyle.glowColor && elementStyle.glowSize !== undefined && elementStyle.glowSize > 0) {
    const existingShadow = style.boxShadow && style.boxShadow !== 'none' ? `${style.boxShadow}, ` : '';
    style.boxShadow = `${existingShadow}0 0 ${elementStyle.glowSize}px ${elementStyle.glowColor}`;
  }

  // Add transition for hover effects
  style.transition = 'all 0.15s ease';

  // Apply custom CSS (from Advanced tab) - overrides other properties
  if (elementStyle.customCSS) {
    const customStyles = parseCustomCssToStyle(elementStyle.customCSS);
    Object.assign(style, customStyles);
  }

  return style;
}
