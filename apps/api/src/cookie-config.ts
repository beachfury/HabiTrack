// apps/api/src/cookie-config.ts
// Shared cookie configuration - single source of truth

import type { Response } from 'express';
import { parseEnv } from '@habitrack/core-config';
import 'dotenv/config';

const cfg = parseEnv(process.env);

// Environment detection
export const IS_DEV =
  String(cfg.HABITRACK_ENV || process.env.NODE_ENV || 'development').toLowerCase() !== 'production';
export const IS_PROD = !IS_DEV;

// Session cookie config
export const SESSION_COOKIE_NAME = String(cfg.HABITRACK_SESSION_COOKIE_NAME ?? 'habitrack_sid');
export const SESSION_TTL_MINUTES = Number(cfg.HABITRACK_SESSION_TTL_MINUTES ?? 120) || 120;
export const SESSION_ROLLING =
  String(cfg.HABITRACK_SESSION_ROLLING ?? 'true').toLowerCase() === 'true';

// Cookie security settings
const COOKIE_SAMESITE_RAW = String(cfg.HABITRACK_COOKIE_SAMESITE ?? 'Lax')
  .trim()
  .toLowerCase();
export const COOKIE_SAMESITE = COOKIE_SAMESITE_RAW as 'lax' | 'strict' | 'none';

// In dev: never secure (HTTP works). In prod: secure unless explicitly disabled.
export const COOKIE_SECURE =
  IS_PROD &&
  (String(cfg.HABITRACK_COOKIE_SECURE ?? 'true')
    .trim()
    .toLowerCase() === 'true' ||
    COOKIE_SAMESITE === 'none');

// CSRF cookie config
export const CSRF_COOKIE_NAME = String(cfg.HABITRACK_CSRF_COOKIE_NAME ?? 'habitrack_csrf');
export const CSRF_HEADER_NAME = String(cfg.HABITRACK_CSRF_HEADER_NAME ?? 'X-HabiTrack-CSRF');

// Log once at startup
if (process.env.NODE_APP_INSTANCE == null) {
  console.log('[cookie-config]', {
    env: IS_DEV ? 'development' : 'production',
    sessionCookie: SESSION_COOKIE_NAME,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    ttlMinutes: SESSION_TTL_MINUTES,
    rolling: SESSION_ROLLING,
  });
}

/**
 * Set session cookie with consistent settings
 */
export function setSessionCookie(res: Response, sid: string): void {
  res.cookie(SESSION_COOKIE_NAME, sid, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    path: '/',
    maxAge: SESSION_TTL_MINUTES * 60_000,
  });
}

/**
 * Clear session cookie with matching attributes
 */
export function clearSessionCookie(res: Response): void {
  res.cookie(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    path: '/',
    maxAge: 0,
  });
}

/**
 * Set CSRF cookie (non-httpOnly for double-submit pattern)
 */
export function setCsrfCookie(res: Response, token: string): void {
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JavaScript
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    path: '/',
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
  });
}
