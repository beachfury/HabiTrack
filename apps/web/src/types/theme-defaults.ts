// apps/web/src/types/theme-defaults.ts
// Default theme values and presets

import type {
  ThemeColors,
  ThemeLayout,
  ThemeTypography,
  ThemeUI,
  ThemeIcons,
  ThemePageBackground,
  ThemeSidebar,
} from './theme-core';

import type { ElementStyle, LoginPageStyle, LcarsMode } from './theme-extended';

// ============================================
// Default Color Palettes
// ============================================

export const DEFAULT_COLORS_LIGHT: ThemeColors = {
  primary: '#3cb371',           // HabiTrack Green
  primaryForeground: '#ffffff',
  secondary: '#f3f4f6',
  secondaryForeground: '#3d4f5f', // HabiTrack Navy
  accent: '#3cb371',            // HabiTrack Green
  accentForeground: '#ffffff',
  background: '#ffffff',
  foreground: '#3d4f5f',        // HabiTrack Navy
  card: '#ffffff',
  cardForeground: '#3d4f5f',    // HabiTrack Navy
  muted: '#f3f4f6',
  mutedForeground: '#6b7280',
  border: '#e5e7eb',
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',
  success: '#22c55e',
  successForeground: '#ffffff',
  warning: '#f59e0b',
  warningForeground: '#1f2937',
};

export const DEFAULT_COLORS_DARK: ThemeColors = {
  primary: '#4fd693',           // Lighter green for dark mode
  primaryForeground: '#1a2e26',
  secondary: '#374151',
  secondaryForeground: '#f9fafb',
  accent: '#4fd693',            // Lighter green for dark mode
  accentForeground: '#1a2e26',
  background: '#1a2530',        // Navy-tinted dark background
  foreground: '#f9fafb',
  card: '#243340',              // Navy-tinted card
  cardForeground: '#f9fafb',
  muted: '#2d3e4e',             // Navy-tinted muted
  mutedForeground: '#9ca3af',
  border: '#3d4f5f',            // HabiTrack Navy as border
  destructive: '#f87171',
  destructiveForeground: '#1f2937',
  success: '#4ade80',
  successForeground: '#1f2937',
  warning: '#fbbf24',
  warningForeground: '#1f2937',
};

// ============================================
// Default Settings
// ============================================

export const DEFAULT_LAYOUT: ThemeLayout = {
  type: 'sidebar-left',
  sidebarWidth: 256,
  navStyle: 'icons-text',
};

export const DEFAULT_TYPOGRAPHY: ThemeTypography = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  baseFontSize: 16,
  lineHeight: 'normal',
  fontWeight: 'normal',
};

export const DEFAULT_UI: ThemeUI = {
  borderRadius: 'large',
  shadowIntensity: 'subtle',
};

export const DEFAULT_ICONS: ThemeIcons = {
  style: 'outline',
};

export const DEFAULT_PAGE_BACKGROUND: ThemePageBackground = {
  type: 'solid',
  color: undefined,
};

export const DEFAULT_SIDEBAR: ThemeSidebar = {
  backgroundType: 'solid',
  backgroundColor: undefined,
  textColor: undefined,
};

// ============================================
// Extended Theme Defaults
// ============================================

export const DEFAULT_ELEMENT_STYLE: ElementStyle = {
  backgroundColor: undefined,
  borderRadius: 12,
  borderWidth: 1,
  boxShadow: 'subtle',
};

export const DEFAULT_CARD_STYLE: ElementStyle = {
  backgroundColor: undefined, // Uses theme's card color
  borderRadius: 12,
  borderWidth: 1,
  borderColor: undefined, // Uses theme's border color
  boxShadow: 'subtle',
  padding: '16px',
};

export const DEFAULT_WIDGET_STYLE: ElementStyle = {
  backgroundColor: undefined, // Uses theme's muted color
  borderRadius: 8,
  borderWidth: 0,
  boxShadow: 'none',
  padding: '12px',
};

export const DEFAULT_BUTTON_STYLE: ElementStyle = {
  borderRadius: 8,
  padding: '8px 16px',
  fontWeight: 'medium',
};

export const DEFAULT_LOGIN_PAGE: LoginPageStyle = {
  backgroundType: 'gradient',
  gradientFrom: '#3d4f5f',  // HabiTrack Navy
  gradientTo: '#1a2530',    // Dark Navy
  gradientDirection: 'to bottom right',
};

export const DEFAULT_LCARS_MODE: LcarsMode = {
  enabled: false,
  cornerStyle: 'rounded',
  borderStyle: 'standard',
};
