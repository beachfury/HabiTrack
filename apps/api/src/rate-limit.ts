// apps/api/src/rate-limit.ts
// Rate limiting middleware using in-memory store (upgrade to Redis for multi-instance)

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { parseEnv } from '@habitrack/core-config';

const cfg = parseEnv(process.env);

// =============================================================================
// Types
// =============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// =============================================================================
// Parse Rate Limit Config (e.g., "10/5m" -> { windowMs: 300000, maxRequests: 10 })
// =============================================================================

function parseRateLimitString(str: string): RateLimitConfig {
  const match = str.match(/^(\d+)\/(\d+)(s|m|h)$/);
  if (!match) {
    console.warn(`[rate-limit] Invalid format "${str}", using default 100/1m`);
    return { maxRequests: 100, windowMs: 60_000 };
  }

  const maxRequests = parseInt(match[1], 10);
  const amount = parseInt(match[2], 10);
  const unit = match[3];

  let windowMs: number;
  switch (unit) {
    case 's': windowMs = amount * 1000; break;
    case 'm': windowMs = amount * 60_000; break;
    case 'h': windowMs = amount * 3600_000; break;
    default: windowMs = 60_000;
  }

  return { maxRequests, windowMs };
}

// =============================================================================
// In-Memory Store (per-process, resets on restart)
// =============================================================================

const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(name: string): Map<string, RateLimitEntry> {
  let store = stores.get(name);
  if (!store) {
    store = new Map();
    stores.set(name, store);
  }
  return store;
}

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const store of stores.values()) {
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }
}, 60_000); // Every minute

// =============================================================================
// Rate Limiter Factory
// =============================================================================

export interface RateLimiterOptions {
  name: string;
  config: string; // e.g., "10/5m"
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  message?: string;
}

export function createRateLimiter(options: RateLimiterOptions): RequestHandler {
  const { maxRequests, windowMs } = parseRateLimitString(options.config);
  const store = getStore(options.name);
  
  const keyGen = options.keyGenerator ?? ((req: Request) => {
    // Use X-Forwarded-For if behind proxy, otherwise socket IP
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string') {
      return xff.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || 'unknown';
  });

  const skipFn = options.skip ?? (() => false);
  const message = options.message ?? 'Too many requests, please try again later';

  console.log(`[rate-limit] "${options.name}" initialized: ${maxRequests} requests per ${windowMs}ms`);

  return (req: Request, res: Response, next: NextFunction) => {
    if (skipFn(req)) {
      return next();
    }

    const key = keyGen(req);
    const now = Date.now();
    
    let entry = store.get(key);
    
    // Reset if window expired
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message,
          retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        },
      });
    }

    next();
  };
}

// =============================================================================
// Pre-configured Rate Limiters (using env config)
// =============================================================================

/**
 * Rate limiter for login attempts
 * Default: 10 attempts per 5 minutes per IP
 */
export const loginRateLimiter = createRateLimiter({
  name: 'login',
  config: String(cfg.HABITRACK_RL_LOGIN_PER_IP ?? '10/5m'),
  message: 'Too many login attempts. Please wait before trying again.',
});

/**
 * Rate limiter for bootstrap endpoint
 * Default: 5 attempts per 15 minutes per IP
 */
export const bootstrapRateLimiter = createRateLimiter({
  name: 'bootstrap',
  config: String(cfg.HABITRACK_RL_BOOTSTRAP_PER_IP ?? '5/15m'),
  message: 'Too many bootstrap attempts. Please wait before trying again.',
});

/**
 * Rate limiter for write operations
 * Default: 60 requests per minute per IP
 */
export const writeRateLimiter = createRateLimiter({
  name: 'write',
  config: String(cfg.HABITRACK_RL_WRITE_PER_IP ?? '60/1m'),
  message: 'Too many requests. Please slow down.',
});

/**
 * Rate limiter for password reset requests
 * Default: 3 attempts per 15 minutes per IP
 */
export const forgotPasswordRateLimiter = createRateLimiter({
  name: 'forgot-password',
  config: '3/15m',
  message: 'Too many password reset requests. Please wait before trying again.',
});
