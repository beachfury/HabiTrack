// apps/web/src/context/css/utils.ts
// Shared utility functions for theme CSS generation:
// - resolveImageUrl: converts relative API paths to full URLs
// - applyOpacityToColor: applies opacity to any CSS color format
// - API_BASE: the resolved API base URL

// Helper to resolve image URLs - converts relative API paths to full URLs
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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
export function applyOpacityToColor(color: string, opacity: number): string {
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
