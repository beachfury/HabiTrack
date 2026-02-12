// apps/api/src/middleware/kiosk-restrictions.ts
// Restricts what routes kiosk sessions can access
// This prevents privilege escalation through kiosk mode

import type { Request, Response, NextFunction } from 'express';

/**
 * Routes that kiosk sessions are BLOCKED from accessing
 * Uses glob-like patterns (* matches any path segment)
 */
const KIOSK_BLOCKED_PATTERNS = [
  // Admin routes - NEVER allow kiosk to access
  '/api/admin/*',
  '/api/bootstrap/*',

  // Settings - kiosk cannot change system config
  '/api/settings/*',

  // Security-sensitive user operations
  '/api/users/password',
  '/api/users/*/password',
  '/api/users/pin',
  '/api/users/*/pin',
  '/api/users/invite',
  '/api/users/*/invite',

  // Data export - prevent data exfiltration
  '/api/export/*',

  // Destructive household operations
  '/api/household/delete',
  '/api/households/*/delete',

  // Theme management (admin only)
  '/api/themes/delete',
  '/api/themes/*/delete',

  // Session management
  '/api/auth/sessions',
  '/api/auth/sessions/*',

  // Audit logs - sensitive information
  '/api/audit/*',

  // Media library management (prevent uploads from kiosk)
  '/api/media/upload',

  // Notification settings (global)
  '/api/notifications/settings',
];

/**
 * HTTP methods that are considered "safe" (read-only)
 */
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Matches a path against a glob-like pattern
 * Supports * for single segment and ** for multiple segments
 */
function matchesPattern(path: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
    .replace(/\*\*/g, '.*') // ** matches anything
    .replace(/\*/g, '[^/]*'); // * matches single segment

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

/**
 * Checks if a route should be blocked for kiosk sessions
 */
export function isKioskBlockedRoute(path: string, method: string): boolean {
  const normalizedPath = path.toLowerCase();
  const normalizedMethod = method.toUpperCase();

  // Check each blocked pattern
  for (const pattern of KIOSK_BLOCKED_PATTERNS) {
    if (matchesPattern(normalizedPath, pattern.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Augment Express Request to support kiosk session flag
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      isKioskSession?: boolean;
    }
  }
}

/**
 * Middleware: Restricts kiosk sessions from accessing sensitive routes
 *
 * This should be applied AFTER authentication middleware
 * It checks if the current session is a kiosk session and blocks
 * access to admin, settings, and other sensitive endpoints.
 *
 * SECURITY: This is a defense-in-depth measure.
 * Even if an attacker gains kiosk access, they cannot:
 * - Access admin functions
 * - Change settings
 * - Export data
 * - Manage users
 * - View audit logs
 */
export function kioskRestrictions(req: Request, res: Response, next: NextFunction) {
  // Skip if not a kiosk session
  if (!req.isKioskSession) {
    return next();
  }

  // Check if this route is blocked for kiosk
  if (isKioskBlockedRoute(req.path, req.method)) {
    console.warn(
      `[kiosk-restrictions] BLOCKED: Kiosk session attempted to access ${req.method} ${req.path}`,
    );

    return res.status(403).json({
      error: {
        code: 'KIOSK_RESTRICTED',
        message: 'This action is not available in kiosk mode',
      },
    });
  }

  // Route is allowed
  next();
}

/**
 * Helper to mark a session as kiosk in the request
 * Call this from the PIN login handler
 */
export function markAsKioskSession(req: Request): void {
  req.isKioskSession = true;
}
