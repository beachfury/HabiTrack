// apps/web/src/types/theme.ts
// TypeScript types for the theming system

// ============================================
// Color Scheme
// ============================================
export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
}

// ============================================
// Layout Configuration
// ============================================
export type LayoutType = 'sidebar-left' | 'sidebar-right' | 'top-header' | 'minimal';
export type NavStyle = 'icons-only' | 'icons-text' | 'text-only';

export interface ThemeLayout {
  type: LayoutType;
  sidebarWidth?: number; // 200-320, default 256
  headerHeight?: number; // For top-header, default 64
  navStyle: NavStyle;
}

// ============================================
// Typography Settings
// ============================================
export type LineHeight = 'compact' | 'normal' | 'relaxed';

export interface ThemeTypography {
  fontFamily: string;
  fontFamilyHeading?: string;
  baseFontSize: number; // 14, 16, 18
  lineHeight: LineHeight;
}

// ============================================
// Sidebar/Header Background
// ============================================
export type BackgroundType = 'solid' | 'gradient' | 'image';

export interface ThemeSidebar {
  backgroundType: BackgroundType;
  backgroundColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientDirection?: string;
  imageUrl?: string;
  imageOpacity?: number; // 0-100
  blur?: number; // 0-20
  textColor?: string;
  iconColor?: string;
}

// ============================================
// Page Background
// ============================================
export type PageBackgroundType = 'solid' | 'gradient' | 'image' | 'pattern';
export type PatternType = 'dots' | 'grid' | 'lines' | 'none';

export interface ThemePageBackground {
  type: PageBackgroundType;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientDirection?: string;
  imageUrl?: string;
  imagePosition?: 'cover' | 'contain' | 'tile';
  pattern?: PatternType;
  patternOpacity?: number;
}

// ============================================
// UI Preferences
// ============================================
export type BorderRadius = 'none' | 'small' | 'medium' | 'large';
export type ShadowIntensity = 'none' | 'subtle' | 'medium' | 'strong';

export interface ThemeUI {
  borderRadius: BorderRadius;
  shadowIntensity: ShadowIntensity;
}

// ============================================
// Icon Preferences
// ============================================
export type IconStyle = 'outline' | 'solid';

export interface ThemeIcons {
  style: IconStyle;
  customIconPackUrl?: string;
}

// ============================================
// Full Theme Definition
// ============================================
export interface Theme {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;

  layout: ThemeLayout;
  colorsLight: ThemeColors;
  colorsDark: ThemeColors;
  typography: ThemeTypography;
  sidebar?: ThemeSidebar;
  header?: ThemeSidebar;
  pageBackground: ThemePageBackground;
  ui: ThemeUI;
  icons: ThemeIcons;

  // Metadata
  createdBy: number;
  isPublic: boolean;
  isApprovedForKids: boolean;
  isDefault: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// User Preferences
// ============================================
export type ThemeMode = 'light' | 'dark' | 'system' | 'auto';

export interface UserThemePreferences {
  userId: number;
  themeId: string | null;
  mode: ThemeMode;
  overrides?: Partial<Theme>;
  personalThemes?: Theme[];
  accentColorOverride?: string;
  updatedAt: string;
}

// ============================================
// Theme List Item (simplified for listings)
// ============================================
export interface ThemeListItem {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  primaryColor: string;
  accentColor: string;
  layoutType: LayoutType;
  isDefault: boolean;
  isPublic: boolean;
  isApprovedForKids: boolean;
  usageCount: number;
  createdBy: number;
  createdAt: string;
}

// ============================================
// Create/Update Inputs
// ============================================
export interface CreateThemeInput {
  name: string;
  description?: string;
  thumbnailUrl?: string;
  layout: ThemeLayout;
  colorsLight: ThemeColors;
  colorsDark: ThemeColors;
  typography: ThemeTypography;
  sidebar?: ThemeSidebar;
  header?: ThemeSidebar;
  pageBackground: ThemePageBackground;
  ui: ThemeUI;
  icons: ThemeIcons;
  isPublic?: boolean;
}

export type UpdateThemeInput = Partial<CreateThemeInput>;

// ============================================
// API Response Types
// ============================================
export interface ThemeListResponse {
  themes: Theme[];
}

export interface ThemeResponse {
  theme: Theme;
}

export interface UserThemePreferencesResponse {
  preferences: UserThemePreferences;
  activeTheme: Theme | null;
}

// ============================================
// Default Values
// ============================================
export const DEFAULT_COLORS_LIGHT: ThemeColors = {
  primary: '#8b5cf6',
  primaryForeground: '#ffffff',
  secondary: '#f3f4f6',
  secondaryForeground: '#1f2937',
  accent: '#8b5cf6',
  accentForeground: '#ffffff',
  background: '#f9fafb',
  foreground: '#1f2937',
  card: '#ffffff',
  cardForeground: '#1f2937',
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
  primary: '#a78bfa',
  primaryForeground: '#ffffff',
  secondary: '#374151',
  secondaryForeground: '#f9fafb',
  accent: '#a78bfa',
  accentForeground: '#ffffff',
  background: '#111827',
  foreground: '#f9fafb',
  card: '#1f2937',
  cardForeground: '#f9fafb',
  muted: '#374151',
  mutedForeground: '#9ca3af',
  border: '#374151',
  destructive: '#f87171',
  destructiveForeground: '#1f2937',
  success: '#4ade80',
  successForeground: '#1f2937',
  warning: '#fbbf24',
  warningForeground: '#1f2937',
};

export const DEFAULT_LAYOUT: ThemeLayout = {
  type: 'sidebar-left',
  sidebarWidth: 256,
  navStyle: 'icons-text',
};

export const DEFAULT_TYPOGRAPHY: ThemeTypography = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  baseFontSize: 16,
  lineHeight: 'normal',
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
