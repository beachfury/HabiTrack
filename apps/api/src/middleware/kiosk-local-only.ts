// apps/api/src/middleware/kiosk-local-only.ts
// Ensures kiosk mode is ONLY accessible from allowed IPs
// This is a CRITICAL security measure to prevent remote exploitation

import type { Request, Response, NextFunction } from 'express';

/**
 * RFC 1918 private address ranges + localhost
 * Used as fallback when no kiosk IPs are configured in settings
 */
const LOCAL_IP_PATTERNS = [
  /^127\./, // IPv4 localhost (127.0.0.0/8)
  /^192\.168\./, // Private Class C (192.168.0.0/16)
  /^10\./, // Private Class A (10.0.0.0/8)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B (172.16.0.0/12)
  /^::1$/, // IPv6 localhost
  /^::ffff:127\./, // IPv4-mapped IPv6 localhost
  /^::ffff:192\.168\./, // IPv4-mapped IPv6 private
  /^::ffff:10\./, // IPv4-mapped IPv6 private
  /^::ffff:172\.(1[6-9]|2[0-9]|3[0-1])\./, // IPv4-mapped IPv6 private
  /^fe80:/, // IPv6 link-local
  /^fc00:/, // IPv6 unique local (ULA)
  /^fd/, // IPv6 unique local (ULA)
];

// Cache for kiosk allowed IPs from settings
let cachedAllowedIps: string[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds

/**
 * Normalizes an IP address for comparison
 * Strips IPv6-mapped IPv4 prefix for cleaner matching
 */
function normalizeIP(ip: string): string {
  if (!ip) return '';

  // Remove any zone ID (e.g., %eth0)
  let cleanIP = ip.split('%')[0].toLowerCase();

  // Strip IPv6-mapped IPv4 prefix to get the raw IPv4 address
  if (cleanIP.startsWith('::ffff:')) {
    cleanIP = cleanIP.slice(7);
  }

  return cleanIP;
}

/**
 * Checks if an IP address is on the local network (RFC 1918)
 */
export function isLocalNetwork(ip: string): boolean {
  const normalized = normalizeIP(ip);
  if (!normalized) return false;
  return LOCAL_IP_PATTERNS.some(pattern => pattern.test(normalized));
}

/**
 * Extracts the real client IP from request
 * Trusts X-Forwarded-For from any RFC 1918 source (covers Docker bridge network)
 */
function getClientIP(req: Request): string {
  const directIP = req.socket?.remoteAddress || req.ip || '';
  const normalizedDirect = normalizeIP(directIP);

  // Trust X-Forwarded-For if direct connection is from a private/local IP
  // This handles Docker bridge network (172.x), localhost (127.x), etc.
  const isFromPrivateNetwork = LOCAL_IP_PATTERNS.some(p => p.test(normalizedDirect));

  if (isFromPrivateNetwork) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const firstIP = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
      return normalizeIP(firstIP);
    }
    // Also check X-Real-IP (set by NGINX)
    const realIP = req.headers['x-real-ip'];
    if (realIP) {
      const ip = Array.isArray(realIP) ? realIP[0] : realIP;
      return normalizeIP(ip);
    }
  }

  return normalizedDirect;
}

/**
 * Loads kiosk allowed IPs from the settings table (cached)
 */
async function getKioskAllowedIps(): Promise<string[] | null> {
  const now = Date.now();
  if (cachedAllowedIps !== null && now < cacheExpiry) {
    return cachedAllowedIps;
  }

  try {
    // Dynamic import to avoid circular dependency
    const { q } = await import('../db');
    const rows = await q<any[]>('SELECT kioskAllowedIps FROM settings WHERE id = 1');
    if (rows.length > 0 && rows[0].kioskAllowedIps) {
      cachedAllowedIps = JSON.parse(rows[0].kioskAllowedIps);
    } else {
      cachedAllowedIps = null;
    }
  } catch {
    cachedAllowedIps = null;
  }

  cacheExpiry = now + CACHE_TTL_MS;
  return cachedAllowedIps;
}

/**
 * Clears the cached kiosk IPs (call after settings update)
 */
export function clearKioskIpCache(): void {
  cachedAllowedIps = null;
  cacheExpiry = 0;
}

/**
 * Middleware: Restricts kiosk endpoints to allowed IPs only
 *
 * SECURITY: This is a CRITICAL security boundary.
 * Kiosk mode uses PIN authentication which is less secure than passwords.
 * Remote access to kiosk mode could allow attackers to brute-force PINs.
 *
 * Behavior:
 * - If kioskAllowedIps is configured in settings: ONLY those exact IPs are allowed
 * - If kioskAllowedIps is NOT configured: falls back to RFC 1918 local network check
 */
export function kioskLocalOnly(req: Request, res: Response, next: NextFunction) {
  const clientIP = getClientIP(req);

  getKioskAllowedIps()
    .then((allowedIps) => {
      let allowed = false;

      if (allowedIps && allowedIps.length > 0) {
        // Strict mode: only configured IPs are allowed
        const normalizedClient = normalizeIP(clientIP);
        allowed = allowedIps.some(ip => normalizeIP(ip) === normalizedClient);

        if (!allowed) {
          console.warn(`[kiosk-local-only] BLOCKED: IP ${clientIP} not in allowed kiosk IPs list`);
        }
      } else {
        // Fallback: allow any RFC 1918 local network IP
        allowed = isLocalNetwork(clientIP);

        if (!allowed) {
          console.warn(`[kiosk-local-only] BLOCKED: Non-local IP ${clientIP} attempted kiosk access`);
        }
      }

      if (!allowed) {
        return res.status(403).json({
          error: {
            code: 'KIOSK_LOCAL_ONLY',
            message: 'Kiosk mode is only available from authorized devices',
          },
        });
      }

      console.log(`[kiosk-local-only] ALLOWED: IP ${clientIP} accessing kiosk`);
      next();
    })
    .catch((err) => {
      console.error('[kiosk-local-only] Error checking allowed IPs:', err);
      // Fail closed: deny access on error
      return res.status(500).json({
        error: {
          code: 'KIOSK_CHECK_FAILED',
          message: 'Unable to verify kiosk access',
        },
      });
    });
}

/**
 * Utility to check if current request is from local network
 * Can be used by other code to conditionally enable features
 */
export function isRequestFromLocal(req: Request): boolean {
  const clientIP = getClientIP(req);
  return isLocalNetwork(clientIP);
}
