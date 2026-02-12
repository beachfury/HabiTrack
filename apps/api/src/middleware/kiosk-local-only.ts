// apps/api/src/middleware/kiosk-local-only.ts
// Ensures kiosk mode is ONLY accessible from local network
// This is a CRITICAL security measure to prevent remote exploitation

import type { Request, Response, NextFunction } from 'express';

/**
 * RFC 1918 private address ranges + localhost
 * These are the ONLY IPs allowed to use kiosk mode
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

/**
 * Normalizes an IP address for comparison
 * Handles IPv6-mapped IPv4 addresses (::ffff:x.x.x.x)
 */
function normalizeIP(ip: string): string {
  if (!ip) return '';

  // Remove any zone ID (e.g., %eth0)
  const cleanIP = ip.split('%')[0];

  // Handle IPv6-mapped IPv4 (::ffff:192.168.1.1 -> 192.168.1.1 for easier matching)
  // But keep the original for pattern matching which handles both forms
  return cleanIP.toLowerCase();
}

/**
 * Checks if an IP address is on the local network
 */
export function isLocalNetwork(ip: string): boolean {
  const normalized = normalizeIP(ip);

  // Empty or null IP is not local
  if (!normalized) {
    console.warn('[kiosk-local-only] Empty IP detected');
    return false;
  }

  return LOCAL_IP_PATTERNS.some(pattern => pattern.test(normalized));
}

/**
 * Extracts the real client IP from request
 * Accounts for proxies but ONLY trusts X-Forwarded-For from localhost
 */
function getClientIP(req: Request): string {
  // First check if request is from a trusted proxy (localhost only)
  const directIP = req.socket?.remoteAddress || req.ip || '';
  const normalizedDirect = normalizeIP(directIP);

  // Only trust X-Forwarded-For if the direct connection is from localhost
  // This prevents spoofing from external sources
  const isFromLocalhost = /^(127\.|::1$|::ffff:127\.)/.test(normalizedDirect);

  if (isFromLocalhost) {
    // Trust the X-Forwarded-For header from localhost proxy
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const firstIP = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
      return normalizeIP(firstIP);
    }
  }

  // Otherwise use the direct connection IP
  return normalizedDirect;
}

/**
 * Middleware: Restricts kiosk endpoints to local network only
 *
 * SECURITY: This is a CRITICAL security boundary.
 * Kiosk mode uses PIN authentication which is less secure than passwords.
 * Remote access to kiosk mode could allow attackers to brute-force PINs.
 */
export function kioskLocalOnly(req: Request, res: Response, next: NextFunction) {
  const clientIP = getClientIP(req);

  if (!isLocalNetwork(clientIP)) {
    console.warn(`[kiosk-local-only] BLOCKED: Non-local IP ${clientIP} attempted kiosk access`);

    // Log this as a potential security event
    // Don't reveal too much information in the response
    return res.status(403).json({
      error: {
        code: 'KIOSK_LOCAL_ONLY',
        message: 'Kiosk mode is only available on local network',
      },
    });
  }

  // Log successful local access (for audit trail)
  console.log(`[kiosk-local-only] ALLOWED: Local IP ${clientIP} accessing kiosk`);

  next();
}

/**
 * Utility to check if current request is from local network
 * Can be used by other code to conditionally enable features
 */
export function isRequestFromLocal(req: Request): boolean {
  return isLocalNetwork(getClientIP(req));
}
