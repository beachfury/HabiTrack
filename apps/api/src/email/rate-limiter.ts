// apps/api/src/email/rate-limiter.ts
// Rate limiting for email sending to prevent spam and abuse

import { q } from '../db';

/**
 * Email rate limit configuration
 * These limits help prevent:
 * - Spam attacks flooding users with emails
 * - Accidental infinite loops triggering emails
 * - Exceeding SMTP provider limits
 */
export interface EmailRateLimits {
  perUserPerHour: number; // Max emails to single user in 1 hour
  perHouseholdPerHour: number; // Max emails from household in 1 hour
  globalPerHour: number; // Max total emails in 1 hour
}

const DEFAULT_LIMITS: EmailRateLimits = {
  perUserPerHour: 20,
  perHouseholdPerHour: 100,
  globalPerHour: 1000,
};

/**
 * In-memory rate limit tracking
 * Resets naturally as entries expire
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries periodically
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Check and increment rate limit
 * Returns true if within limit, false if exceeded
 */
function checkRateLimit(key: string, limit: number): boolean {
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    // Create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + hourMs,
    });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  // Increment counter
  entry.count++;
  return true;
}

/**
 * Get current count for a rate limit key
 */
function getCurrentCount(key: string): number {
  const entry = rateLimitStore.get(key);
  if (!entry || entry.resetAt <= Date.now()) {
    return 0;
  }
  return entry.count;
}

/**
 * Load rate limits from database settings
 */
async function loadLimits(): Promise<EmailRateLimits> {
  try {
    const [settings] = await q<
      Array<{
        maxEmailsPerHour: number;
        maxEmailsPerUserPerHour: number;
      }>
    >('SELECT maxEmailsPerHour, maxEmailsPerUserPerHour FROM email_settings WHERE id = 1');

    if (settings) {
      return {
        perUserPerHour: settings.maxEmailsPerUserPerHour || DEFAULT_LIMITS.perUserPerHour,
        perHouseholdPerHour: DEFAULT_LIMITS.perHouseholdPerHour,
        globalPerHour: settings.maxEmailsPerHour || DEFAULT_LIMITS.globalPerHour,
      };
    }
  } catch (err) {
    console.warn('[email-rate-limit] Failed to load settings, using defaults:', err);
  }
  return DEFAULT_LIMITS;
}

/**
 * Check if an email can be sent based on rate limits
 *
 * @param userId - Target user ID receiving the email
 * @param householdId - Household ID (optional, for household-level limiting)
 * @returns Object with allowed status and reason if blocked
 */
export async function checkEmailRateLimit(
  userId: number,
  householdId?: number,
): Promise<{ allowed: boolean; reason?: string; retryAfter?: number }> {
  const limits = await loadLimits();

  // Check global limit
  const globalKey = 'global';
  if (!checkRateLimit(globalKey, limits.globalPerHour)) {
    const entry = rateLimitStore.get(globalKey);
    return {
      allowed: false,
      reason: 'Global email limit exceeded',
      retryAfter: entry ? Math.ceil((entry.resetAt - Date.now()) / 1000) : 3600,
    };
  }

  // Check per-user limit
  const userKey = `user:${userId}`;
  if (!checkRateLimit(userKey, limits.perUserPerHour)) {
    const entry = rateLimitStore.get(userKey);
    return {
      allowed: false,
      reason: `Rate limit exceeded for user ${userId}`,
      retryAfter: entry ? Math.ceil((entry.resetAt - Date.now()) / 1000) : 3600,
    };
  }

  // Check per-household limit
  if (householdId) {
    const householdKey = `household:${householdId}`;
    if (!checkRateLimit(householdKey, limits.perHouseholdPerHour)) {
      const entry = rateLimitStore.get(householdKey);
      return {
        allowed: false,
        reason: `Rate limit exceeded for household ${householdId}`,
        retryAfter: entry ? Math.ceil((entry.resetAt - Date.now()) / 1000) : 3600,
      };
    }
  }

  return { allowed: true };
}

/**
 * Get current rate limit status for monitoring
 */
export async function getRateLimitStatus(): Promise<{
  global: { count: number; limit: number };
  users: Array<{ userId: string; count: number; limit: number }>;
  households: Array<{ householdId: string; count: number; limit: number }>;
}> {
  const limits = await loadLimits();

  const users: Array<{ userId: string; count: number; limit: number }> = [];
  const households: Array<{ householdId: string; count: number; limit: number }> = [];

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= Date.now()) continue;

    if (key.startsWith('user:')) {
      users.push({
        userId: key.replace('user:', ''),
        count: entry.count,
        limit: limits.perUserPerHour,
      });
    } else if (key.startsWith('household:')) {
      households.push({
        householdId: key.replace('household:', ''),
        count: entry.count,
        limit: limits.perHouseholdPerHour,
      });
    }
  }

  return {
    global: {
      count: getCurrentCount('global'),
      limit: limits.globalPerHour,
    },
    users,
    households,
  };
}

/**
 * Reset rate limits (for testing or admin use)
 */
export function resetRateLimits(): void {
  rateLimitStore.clear();
  console.log('[email-rate-limit] All rate limits cleared');
}
