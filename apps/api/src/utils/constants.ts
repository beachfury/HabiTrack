// apps/api/src/utils/constants.ts
// Centralized constants for the API

// =============================================================================
// PAGINATION & QUERY LIMITS
// =============================================================================

export const LIMITS = {
  // Default pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Specific feature limits
  ANNOUNCEMENTS: 50,
  MESSAGE_HISTORY: 50,
  LEADERBOARD: 20,
  SHOPPING_SUGGESTIONS: 20,
  DASHBOARD_ITEMS: 10,
  RECENT_ENTRIES: 5,
  BUDGET_COMPARISON: 10,
  EARNINGS_HISTORY: 50,
  RECENT_COLORS: 20,
  FAMILY_MEMBERS: 10,
  UPCOMING_MEALS: 7,
  THEME_ASSETS: 50,
  THEME_LIBRARY: 100,
} as const;

// =============================================================================
// FILE UPLOAD SETTINGS
// =============================================================================

export const UPLOAD = {
  // Max file sizes in bytes
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB

  // Allowed MIME types
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],

  // Image dimensions for different presets
  PRESETS: {
    thumbnail: { width: 400, height: 300 },
    sidebar: { width: 400, height: 800 },
    background: { width: 1920, height: 1080 },
    'background-pattern': { width: 200, height: 200 },
  },
} as const;

// =============================================================================
// STRING TRUNCATION
// =============================================================================

export const TRUNCATE = {
  PREVIEW_LENGTH: 100,
  TITLE_LENGTH: 50,
  DESCRIPTION_LENGTH: 200,
} as const;

// =============================================================================
// TIME INTERVALS (in milliseconds)
// =============================================================================

export const INTERVALS = {
  SESSION_TTL_MINUTES: 30 * 24 * 60, // 30 days in minutes
  KIOSK_SESSION_TTL_HOURS: 4,
  EMAIL_RATE_LIMIT_WINDOW: 3600000, // 1 hour
  NOTIFICATION_DEBOUNCE: 300, // 300ms
} as const;

// =============================================================================
// RATE LIMITS
// =============================================================================

export const RATE_LIMITS = {
  EMAIL_PER_USER_PER_HOUR: 20,
  EMAIL_PER_HOUSEHOLD_PER_HOUR: 100,
  EMAIL_GLOBAL_PER_HOUR: 1000,
  LOGIN_ATTEMPTS: 10,
  LOGIN_WINDOW_MINUTES: 5,
} as const;

// =============================================================================
// DEFAULT VALUES
// =============================================================================

export const DEFAULTS = {
  HOUSEHOLD_SIZE: 4,
  CHORE_POINTS: 10,
  THEME_ID: 'habitrack-classic',
  THEME_MODE: 'system',
  FFY_MESSAGES: [
    'Everyone fends for themselves tonight!',
    'Leftovers night - find something in the fridge!',
    "You're on your own for dinner!",
    'Grab what you can find!',
  ],
} as const;

// =============================================================================
// CURRENCY & FORMATTING
// =============================================================================

export const FORMAT = {
  CURRENCY_DECIMALS: 2,
  PERCENTAGE_DECIMALS: 1,
} as const;

// Helper function to format currency
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(FORMAT.CURRENCY_DECIMALS)}`;
}

// Helper function to truncate string
export function truncateString(str: string, maxLength: number = TRUNCATE.PREVIEW_LENGTH): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}
