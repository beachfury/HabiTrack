// apps/api/src/csrf.ts
// Refactored to use shared cookie config

import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

// Shared modules
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  COOKIE_SECURE,
  COOKIE_SAMESITE,
  setCsrfCookie,
} from './cookie-config';
import { getApiKeyAuth } from './apiKeys';

// =============================================================================
// Issue CSRF Token
// =============================================================================

/**
 * GET /api/auth/csrf
 * Returns CSRF token (also sets it as a cookie)
 */
export function issueCsrf(req: Request, res: Response) {
  // Reuse existing cookie if valid
  let token = (req as any).cookies?.[CSRF_COOKIE_NAME];
  
  if (!token || typeof token !== 'string' || token.length < 32) {
    token = crypto.randomBytes(32).toString('hex');
    setCsrfCookie(res, token);
  }
  
  res.json({ header: CSRF_HEADER_NAME, token });
}

// =============================================================================
// CSRF Protection Middleware
// =============================================================================

/**
 * Middleware that validates CSRF token for state-changing requests
 * - Skips for API key authenticated requests
 * - Skips for safe methods (GET, HEAD, OPTIONS)
 * - Validates double-submit cookie pattern
 */
export function csrfProtect(req: Request, res: Response, next: NextFunction) {
  // Skip for API key authenticated requests (service-to-service)
  const api = getApiKeyAuth(req);
  if (api) return next();

  // Allow safe methods
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return next();
  }

  // Get tokens from cookie and header
  const cookieToken = (req as any).cookies?.[CSRF_COOKIE_NAME] || '';
  const headerToken = (req.header(CSRF_HEADER_NAME) || '').trim();

  // Validate double-submit pattern with timing-safe comparison
  if (
    cookieToken &&
    headerToken &&
    cookieToken.length === headerToken.length &&
    crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))
  ) {
    return next();
  }

  return res.status(403).json({ 
    error: { 
      code: 'CSRF', 
      message: 'Invalid or missing CSRF token',
    },
  });
}
