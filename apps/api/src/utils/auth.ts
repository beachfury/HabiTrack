// apps/api/src/utils/auth.ts
// Shared authentication utilities

import type { Request, Response, NextFunction } from 'express';

export interface AuthUser {
  id: number;
  displayName: string;
  roleId: 'admin' | 'member' | 'kid' | 'kiosk';
  householdId?: number;
}

/**
 * Get authenticated user from request
 */
export function getUser(req: Request): AuthUser | undefined {
  return (req as any).user as AuthUser | undefined;
}

/**
 * Require authentication middleware
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });
  }
  next();
}

/**
 * Require admin role middleware
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });
  }
  if (user.roleId !== 'admin') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
  }
  next();
}

/**
 * Require member or above (not kid) middleware
 */
export function requireMember(req: Request, res: Response, next: NextFunction) {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });
  }
  if (user.roleId === 'kid' || user.roleId === 'kiosk') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Member access required' } });
  }
  next();
}

/**
 * Check if user is admin
 */
export function isAdmin(req: Request): boolean {
  const user = getUser(req);
  return user?.roleId === 'admin';
}

/**
 * Check if user is kid
 */
export function isKid(req: Request): boolean {
  const user = getUser(req);
  return user?.roleId === 'kid';
}
