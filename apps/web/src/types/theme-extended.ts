// apps/web/src/types/theme-extended.ts
// Extended theme system types (LCARS-level customization)

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
