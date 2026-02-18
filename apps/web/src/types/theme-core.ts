// apps/web/src/types/theme-core.ts
// Core theme type definitions

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
export type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold';

export interface ThemeTypography {
  fontFamily: string;
  fontFamilyHeading?: string;
  baseFontSize: number; // 14, 16, 18
  lineHeight: LineHeight;
  fontWeight?: FontWeight; // Default body font weight
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
// User Preferences
// ============================================
export type ThemeMode = 'light' | 'dark' | 'system' | 'auto';

// Import extended types for full Theme interface
import type { ThemeableElement, ElementStyle, WidgetStyleOverride, LoginPageStyle, LcarsMode, KioskStyle } from './theme-extended';

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

  // Extended theme fields (element-level customization)
  elementStyles?: Partial<Record<ThemeableElement, ElementStyle>>;
  widgetOverrides?: WidgetStyleOverride[];
  loginPage?: LoginPageStyle;
  lcarsMode?: LcarsMode;
  kioskStyle?: KioskStyle;

  // Metadata
  createdBy: number;
  isPublic: boolean;
  isApprovedForKids: boolean;
  isDefault: boolean;
  isSystemTheme?: boolean; // If true, cannot be edited (HabiTrack Classic)
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

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
  isSystemTheme?: boolean;
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

  // Extended theme fields
  elementStyles?: Partial<Record<ThemeableElement, ElementStyle>>;
  widgetOverrides?: WidgetStyleOverride[];
  loginPage?: LoginPageStyle;
  lcarsMode?: LcarsMode;
  kioskStyle?: KioskStyle;
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
