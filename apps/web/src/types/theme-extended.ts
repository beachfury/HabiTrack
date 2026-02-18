// apps/web/src/types/theme-extended.ts
// Extended theme system types (LCARS-level customization)

/**
 * All themeable element types in the application.
 * Each element can have its own custom styling.
 *
 * Global elements (shared across all pages):
 * - sidebar: Navigation sidebar
 * - button-primary, button-secondary: Action buttons
 * - modal: Popup dialogs
 * - input: Form fields
 *
 * Page-specific elements (each page has its own independent theme):
 *
 * Home page:
 * - home-title: Page heading ("Home")
 * - home-stats-widget: Quick stats summary widget
 * - home-chores-card: Today's chores card
 * - home-events-card: Today's events card
 * - home-weather-widget: Weather widget
 * - home-leaderboard-widget: Leaderboard widget
 * - home-meals-widget: Upcoming meals widget
 * - dashboard-background: Home page background
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
  | 'kiosk'
  // Page-specific backgrounds
  | 'home-background'
  | 'calendar-background'
  | 'chores-background'
  | 'shopping-background'
  | 'messages-background'
  | 'settings-background'
  | 'budget-background'
  | 'meals-background'
  | 'recipes-background'
  | 'paidchores-background'
  | 'family-background'
  // Home/Dashboard page specific elements
  | 'home-title'
  | 'home-welcome-banner'
  | 'home-stats-widget'
  | 'home-chores-card'
  | 'home-events-card'
  | 'home-weather-widget'
  | 'home-leaderboard-widget'
  | 'home-meals-widget'
  // Calendar page specific elements
  | 'calendar-title'
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

  // Transform effects
  scale?: number; // 0.5 to 1.5 (1 = normal)
  rotate?: number; // degrees (-180 to 180)
  skewX?: number; // degrees (-30 to 30)
  skewY?: number; // degrees (-30 to 30)

  // Glow effect
  glowColor?: string; // color for glow effect
  glowSize?: number; // glow spread in px (0-30)

  // Filters
  saturation?: number; // 0-200 (100 = normal)
  grayscale?: number; // 0-100 (0 = normal, 100 = fully gray)

  // Hover effects
  hoverScale?: number; // scale on hover (e.g., 1.02)
  hoverOpacity?: number; // opacity on hover (0-1)

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
 * Kiosk mode styling configuration (admin-only editable).
 * Controls the appearance of the tablet/kiosk login screen.
 */
export interface KioskStyle {
  // Background gradient
  backgroundGradient?: {
    from: string; // Default: #8b5cf6 (purple)
    to: string; // Default: #3b82f6 (blue)
    direction?: string; // Default: 'to bottom right'
  };
  // Or solid/image background
  backgroundType?: 'gradient' | 'solid' | 'image';
  backgroundColor?: string;
  backgroundImage?: string;

  // Text colors
  textColor?: string; // Default: white
  textMutedColor?: string; // Default: rgba(255,255,255,0.8)

  // Button styling
  buttonBgColor?: string; // Default: rgba(255,255,255,0.2)
  buttonHoverColor?: string; // Default: rgba(255,255,255,0.3)
  buttonActiveColor?: string; // Default: rgba(255,255,255,0.4)
  buttonTextColor?: string; // Default: white
  accentColor?: string; // Default: white (Enter button background)

  // Effects
  blur?: number; // backdrop blur in px
  borderWidth?: number; // user card border width

  // Error styling
  errorBgColor?: string;
  errorTextColor?: string;

  // Custom CSS
  customCSS?: string;
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
