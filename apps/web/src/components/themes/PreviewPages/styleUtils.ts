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
  if (elementStyle.backgroundGradient) {
    const { from, to, direction } = elementStyle.backgroundGradient;
    style.background = `linear-gradient(${direction || 'to bottom'}, ${from}, ${to})`;
  } else if (elementStyle.backgroundImage) {
    const resolvedUrl = resolveImageUrl(elementStyle.backgroundImage);
    if (resolvedUrl) {
      style.backgroundImage = `url(${resolvedUrl})`;
    }
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
    // Also set a fallback background color
    style.backgroundColor = elementStyle.backgroundColor || fallbackBg;
  } else if (elementStyle.backgroundColor) {
    style.backgroundColor = elementStyle.backgroundColor;
  } else {
    style.backgroundColor = fallbackBg;
  }

  // Background opacity (applies a semi-transparent layer)
  if (elementStyle.backgroundOpacity !== undefined && elementStyle.backgroundOpacity < 1) {
    // For elements with background opacity, we need to handle it differently
    // Using opacity on the whole element would affect children too
    // Instead, we track this for potential use with pseudo-elements
    style.opacity = elementStyle.backgroundOpacity;
  }

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
): { style: CSSProperties; hasCustomStyle: boolean; backgroundImageUrl?: string } {
  const style: CSSProperties = {
    position: 'relative',
  };

  // Use page-specific style if it has any background properties, else fall back to global
  const effectiveStyle = (pageStyle && (
    pageStyle.backgroundColor ||
    pageStyle.backgroundGradient ||
    pageStyle.backgroundImage
  )) ? pageStyle : globalPageStyle;

  const hasCustomStyle = !!(effectiveStyle && (
    effectiveStyle.backgroundColor ||
    effectiveStyle.backgroundGradient ||
    effectiveStyle.backgroundImage
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
  } else {
    style.backgroundColor = fallbackBg;
  }

  return { style, hasCustomStyle, backgroundImageUrl };
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
  const style: CSSProperties = {
    backgroundColor: elementStyle.backgroundColor || fallbackBg,
    color: elementStyle.textColor || fallbackText,
    borderRadius: elementStyle.borderRadius !== undefined
      ? `${elementStyle.borderRadius}px`
      : fallbackRadius,
  };

  // Background gradient for buttons
  if (elementStyle.backgroundGradient) {
    const { from, to, direction } = elementStyle.backgroundGradient;
    style.background = `linear-gradient(${direction || 'to bottom'}, ${from}, ${to})`;
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

  return style;
}
