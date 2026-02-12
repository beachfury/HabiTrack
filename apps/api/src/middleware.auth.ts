// apps/api/src/middleware.auth.ts
// Refactored to use shared modules (no duplication)

import type { Request, Response, NextFunction } from 'express';

// Shared modules
import { sessionStore } from './session-store';
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MINUTES,
  SESSION_ROLLING,
  setSessionCookie,
} from './cookie-config';
import { q } from './db';

// =============================================================================
// Augment Express Request
// =============================================================================
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface UserInfo {
      id: number;
      displayName: string;
      roleId: 'admin' | 'member' | 'kid' | 'kiosk';
    }
    interface Request {
      user?: UserInfo;
      sessionId?: string;
      isKioskSession?: boolean;
    }
  }
}

// =============================================================================
// requireAuth Middleware
// =============================================================================

/**
 * Authentication middleware that:
 * - Reads session cookie
 * - Validates session in database
 * - Loads user info
 * - Optionally enforces role restrictions
 * - Handles rolling session refresh
 */
export function requireAuth(...allowedRoles: Express.UserInfo['roleId'][]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get session ID from cookie
      const sid = (req.cookies?.[SESSION_COOKIE_NAME] ?? '').trim();
      if (!sid) {
        return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });
      }

      // Load session from store
      const sess = await sessionStore.get(sid);
      if (!sess) {
        return res.status(401).json({ error: { code: 'AUTH_EXPIRED' } });
      }

      // Load user from database
      const rows = await q<Array<{ id: number; displayName: string; roleId: any; active: 0 | 1 }>>(
        'SELECT id, displayName, roleId, active FROM users WHERE id = ? LIMIT 1',
        [sess.userId],
      );
      const u = rows[0];

      if (!u || !u.active) {
        return res.status(403).json({ error: { code: 'USER_INACTIVE' } });
      }

      // Role check (if roles specified)
      if (allowedRoles.length && !allowedRoles.includes(u.roleId)) {
        return res.status(403).json({ error: { code: 'FORBIDDEN' } });
      }

      // Rolling session: extend expiration on each request
      if (SESSION_ROLLING) {
        await sessionStore.touch(sid, SESSION_TTL_MINUTES);
        setSessionCookie(res, sid);
      }

      // Attach to request
      req.sessionId = sid;
      req.user = { id: u.id, displayName: u.displayName, roleId: u.roleId };

      // SECURITY: Mark kiosk sessions for route restriction middleware
      if (sess.isKiosk) {
        req.isKioskSession = true;
      }

      return next();
    } catch (err) {
      console.error('[requireAuth] error', err);
      return res.status(500).json({ error: { code: 'INTERNAL' } });
    }
  };
}

// =============================================================================
// Optional: Soft auth (doesn't fail, just doesn't set user)
// =============================================================================

/**
 * Optional authentication - loads user if session exists, continues either way
 */
export function optionalAuth() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sid = (req.cookies?.[SESSION_COOKIE_NAME] ?? '').trim();
      if (!sid) return next();

      const sess = await sessionStore.get(sid);
      if (!sess) return next();

      const rows = await q<Array<{ id: number; displayName: string; roleId: any; active: 0 | 1 }>>(
        'SELECT id, displayName, roleId, active FROM users WHERE id = ? LIMIT 1',
        [sess.userId],
      );
      const u = rows[0];

      if (u && u.active) {
        req.sessionId = sid;
        req.user = { id: u.id, displayName: u.displayName, roleId: u.roleId };

        // SECURITY: Mark kiosk sessions for route restriction middleware
        if (sess.isKiosk) {
          req.isKioskSession = true;
        }

        // Rolling session
        if (SESSION_ROLLING) {
          await sessionStore.touch(sid, SESSION_TTL_MINUTES);
          setSessionCookie(res, sid);
        }
      }

      return next();
    } catch (err) {
      console.error('[optionalAuth] error (continuing)', err);
      return next();
    }
  };
}
