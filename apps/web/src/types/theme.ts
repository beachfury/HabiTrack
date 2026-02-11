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
  isSystemTheme?: boolean; // If true, cannot be edited (HabiTrack Classic)
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
// SIMPLIFIED THEME (New System)
// ============================================

export type SidebarStyle = 'solid' | 'gradient' | 'image';
export type ThemeRoundness = 'sharp' | 'rounded' | 'pill';
export type ThemeFontSize = 'small' | 'medium' | 'large';

export interface SimpleSidebar {
  style: SidebarStyle;
  color?: string;           // For solid
  gradientFrom?: string;    // For gradient
  gradientTo?: string;
  imageUrl?: string;        // For image
}

export interface SimpleTheme {
  id: string;
  name: string;
  description?: string;

  // Core settings
  mode: 'light' | 'dark';
  primaryColor: string;
  accentColor: string;

  // Sidebar appearance
  sidebar: SimpleSidebar;

  // Style preferences
  roundness: ThemeRoundness;
  fontSize: ThemeFontSize;

  // Metadata
  createdBy?: number;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Default simple theme values - HabiTrack branded
export const DEFAULT_SIMPLE_THEME: Omit<SimpleTheme, 'id' | 'name'> = {
  mode: 'dark',
  primaryColor: '#3cb371',      // HabiTrack Green
  accentColor: '#4fd693',       // Light green accent
  sidebar: {
    style: 'solid',
    color: '#243340',           // Navy-tinted
  },
  roundness: 'rounded',
  fontSize: 'medium',
};

// Pre-built themes - HabiTrack branded
// Note: Custom themes will be created to showcase the theming system capabilities
export const PRESET_THEMES: Array<Omit<SimpleTheme, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>> = [
  {
    name: 'HabiTrack Light',
    description: 'Official HabiTrack light theme with green and navy colors',
    mode: 'light',
    primaryColor: '#3cb371',    // HabiTrack Green
    accentColor: '#3cb371',
    sidebar: { style: 'solid', color: '#ffffff' },
    roundness: 'rounded',
    fontSize: 'medium',
    isPublic: true,
  },
  {
    name: 'HabiTrack Dark',
    description: 'Official HabiTrack dark theme with navy-tinted colors',
    mode: 'dark',
    primaryColor: '#4fd693',    // Light green for dark mode
    accentColor: '#4fd693',
    sidebar: { style: 'solid', color: '#243340' }, // Navy-tinted
    roundness: 'rounded',
    fontSize: 'medium',
    isPublic: true,
  },
];

// ============================================
// EXTENDED THEME SYSTEM (LCARS-Level Customization)
// ============================================

/**
 * All themeable element types in the application.
 * Each element can have its own custom styling.
 *
 * Global elements (apply everywhere unless overridden):
 * - page-background, sidebar, header, card, widget, button-primary, button-secondary, modal, input
 *
 * Page-specific backgrounds (override global page-background for that page):
 * - dashboard-background: Home/Dashboard page
 * - calendar-background: Calendar page
 * - chores-background: Chores page
 * - shopping-background: Shopping page
 * - messages-background: Messages/Notifications page
 * - settings-background: Settings page
 * - budget-background: Budget page
 * - meals-background: Meals page
 * - recipes-background: Recipes page
 *
 * Page-specific elements (override global styles for that page):
 *
 * Dashboard page:
 * - dashboard-stats-widget: Quick stats widgets at top
 * - dashboard-chores-card: Today's chores card
 * - dashboard-events-card: Today's events card
 * - dashboard-weather-widget: Weather widget
 *
 * Calendar page:
 * - calendar-grid: Main calendar card
 * - calendar-meal-widget: Weekly meal planner widget
 * - calendar-user-card: User daily schedule cards
 *
 * Chores page:
 * - chores-task-card: Main chores list card
 * - chores-paid-card: Paid chores/race card
 *
 * Shopping page:
 * - shopping-filter-widget: Category filter bar
 * - shopping-list-card: Main shopping list card
 *
 * Messages page:
 * - messages-announcements-card: Announcements section
 * - messages-chat-card: Direct messages section
 *
 * Settings page:
 * - settings-nav-card: Settings navigation card
 * - settings-content-card: Settings content area
 */
export type ThemeableElement =
  // Global elements
  | 'page-background'
  | 'sidebar'
  | 'header'
  | 'card'
  | 'widget'
  | 'button-primary'
  | 'button-secondary'
  | 'modal'
  | 'input'
  | 'login-page'
  // Page-specific backgrounds
  | 'dashboard-background'
  | 'calendar-background'
  | 'chores-background'
  | 'shopping-background'
  | 'messages-background'
  | 'settings-background'
  | 'budget-background'
  | 'meals-background'
  | 'recipes-background'
  // Dashboard page specific elements
  | 'dashboard-stats-widget'
  | 'dashboard-chores-card'
  | 'dashboard-events-card'
  | 'dashboard-weather-widget'
  // Calendar page specific elements
  | 'calendar-grid'
  | 'calendar-meal-widget'
  | 'calendar-user-card'
  // Chores page specific elements
  | 'chores-task-card'
  | 'chores-paid-card'
  // Shopping page specific elements
  | 'shopping-filter-widget'
  | 'shopping-list-card'
  // Messages page specific elements
  | 'messages-announcements-card'
  | 'messages-chat-card'
  // Settings page specific elements
  | 'settings-nav-card'
  | 'settings-content-card';

/**
 * Style definition for any themeable element.
 * Supports solid colors, gradients, images, and custom CSS.
 */
export interface ElementStyle {
  // Background
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundGradient?: {
    from: string;
    to: string;
    direction?: string; // e.g., 'to right', '135deg'
  };
  backgroundOpacity?: number; // 0-1

  // Text
  textColor?: string;
  textSize?: number; // in px
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  fontFamily?: string; // Font family name or CSS font-family value

  // Border
  borderColor?: string;
  borderWidth?: number; // in px
  borderRadius?: number; // in px
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';

  // Effects
  boxShadow?: 'none' | 'subtle' | 'medium' | 'strong' | string;
  blur?: number; // backdrop blur in px
  opacity?: number; // 0-1

  // Spacing
  padding?: string; // e.g., '8px', '8px 16px'
  margin?: string;

  // Advanced - for LCARS-level customization
  customCSS?: string; // Raw CSS for effects like clip-path, transforms, etc.
}

/**
 * Per-widget style override.
 * Allows individual widgets to have unique styling.
 */
export interface WidgetStyleOverride {
  widgetId: string; // 'weather', 'chores', 'events', 'budget', 'shopping', etc.
  pageId?: string; // Optional: apply only on specific page (e.g., 'home', 'chores')
  style: ElementStyle;
}

/**
 * Login page styling configuration (admin-only editable).
 */
export interface LoginPageStyle {
  backgroundType: 'solid' | 'gradient' | 'image';
  backgroundColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientDirection?: string;
  imageUrl?: string;
  imageOpacity?: number;
  logoUrl?: string;
  logoSize?: number; // in px
  brandName?: string;
  brandColor?: string;
  cardStyle?: ElementStyle;
}

/**
 * LCARS mode for radical Star Trek-style customization.
 */
export interface LcarsMode {
  enabled: boolean;
  cornerStyle: 'rounded' | 'sharp' | 'lcars-curve';
  borderStyle?: 'standard' | 'lcars-elbow' | 'lcars-sweep';
  colorScheme?: {
    primary: string; // LCARS gold: #cc9900
    secondary: string; // LCARS purple: #9999ff
    tertiary: string; // LCARS salmon: #cc6666
    background: string; // LCARS black: #000000
  };
  customCSS?: string; // Global LCARS CSS overrides
}

/**
 * Extended theme with element-level customization.
 * Now identical to Theme since Theme includes all extended fields.
 * Kept for backwards compatibility.
 */
export interface ExtendedTheme extends Theme {
  // All extended fields are now in the base Theme interface
}

/**
 * Element preset for reusable styles.
 */
export interface ElementPreset {
  id: string;
  name: string;
  elementType: ThemeableElement;
  style: ElementStyle;
  isDefault: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

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

// ============================================
// LCARS Preset Colors
// ============================================

export const LCARS_COLORS = {
  gold: '#cc9900',
  orange: '#ff9900',
  purple: '#9999ff',
  blue: '#9999cc',
  salmon: '#cc6666',
  red: '#cc4444',
  beige: '#ffcc99',
  lavender: '#cc99cc',
  black: '#000000',
  darkGray: '#1a1a1a',
} as const;
