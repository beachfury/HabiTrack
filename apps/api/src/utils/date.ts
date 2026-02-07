// apps/api/src/utils/date.ts
// Date manipulation utilities with timezone support

// Default timezone - can be overridden by household settings
let configuredTimezone: string = 'America/Los_Angeles';

/**
 * Set the timezone to use for date calculations
 */
export function setTimezone(tz: string): void {
  configuredTimezone = tz;
}

/**
 * Get the currently configured timezone
 */
export function getTimezone(): string {
  return configuredTimezone;
}

/**
 * Get today's date in YYYY-MM-DD format using configured timezone
 */
export function getTodayLocal(): string {
  const now = new Date();

  // Format date in the configured timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: configuredTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(now); // Returns YYYY-MM-DD
}

/**
 * Normalize date string to YYYY-MM-DD
 */
export function normalizeDate(dateStr: string | Date): string {
  if (!dateStr) return '';

  // If it's a Date object, format it in configured timezone
  if (dateStr instanceof Date) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: configuredTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(dateStr);
  }

  // If it's already a string, just take the first 10 chars
  return dateStr.substring(0, 10);
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    timeZone: configuredTimezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get date X days from now in YYYY-MM-DD format
 */
export function getDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return normalizeDate(date);
}

/**
 * Check if date is today
 */
export function isToday(dateStr: string): boolean {
  return normalizeDate(dateStr) === getTodayLocal();
}

/**
 * Check if date is in the past
 */
export function isPast(dateStr: string): boolean {
  return normalizeDate(dateStr) < getTodayLocal();
}

/**
 * Check if date is in the future
 */
export function isFuture(dateStr: string): boolean {
  return normalizeDate(dateStr) > getTodayLocal();
}

/**
 * Get start of day timestamp
 */
export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day timestamp
 */
export function endOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get start of week (Sunday)
 */
export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of week (Saturday)
 */
export function endOfWeek(date: Date = new Date()): Date {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get current time in HH:MM format in configured timezone
 */
export function getCurrentTime(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: configuredTimezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(now);
}
