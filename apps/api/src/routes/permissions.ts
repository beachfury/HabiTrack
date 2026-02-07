// apps/api/src/routes/permissions.ts
// Permission management routes

import type { Request, Response } from 'express';
import { q } from '../db';
import { sessionRequired, requirePerm } from '@habitrack/http';
import type { Context } from '@habitrack/http';
import { getRoleRules, refreshPermissions } from '../permissions';
import type { RoleId } from '@habitrack/perm';

type Effect = 'allow' | 'deny';
type RuleRow = { roleId: RoleId; actionPattern: string; effect: Effect; localOnly: 0 | 1 };

function makeCtx(_req: Request): Context {
  return {
    session: { userId: 0, role: 'admin' }, // actual auth is enforced by requirePerm below
    isLocalRequest: true,
    isBootstrapped: true,
    getRoleRules,
  };
}

/**
 * GET /api/permissions
 * List all permission rules (admin only)
 */
export async function listPermissions(_req: Request, res: Response) {
  const rows = await q<RuleRow[]>(
    `SELECT roleId, actionPattern, effect, localOnly FROM permissions ORDER BY roleId, actionPattern`,
  );
  res.json({ items: rows });
}

/**
 * PUT /api/permissions
 * Replace all permission rules atomically (admin only)
 */
export async function replacePermissions(req: Request, res: Response) {
  const ctx = makeCtx(req);
  sessionRequired(ctx);
  requirePerm('perm.manage')(ctx);

  const items = (req.body?.items ?? []) as Array<{
    roleId: RoleId;
    actionPattern: string;
    effect: Effect;
    localOnly?: boolean;
  }>;

  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'items[] required' } });
  }

  for (const r of items) {
    if (!r || !r.roleId || !r.actionPattern || (r.effect !== 'allow' && r.effect !== 'deny')) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'invalid rule' } });
    }
  }

  await q('START TRANSACTION');
  try {
    await q('DELETE FROM permissions');
    for (const r of items) {
      await q(
        `INSERT INTO permissions (roleId, actionPattern, effect, localOnly)
         VALUES (?,?,?,?)`,
        [r.roleId, r.actionPattern, r.effect, r.localOnly ? 1 : 0],
      );
    }
    await q('COMMIT');
  } catch {
    await q('ROLLBACK');
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'update failed' } });
  }

  await refreshPermissions().catch(() => {});
  res.status(204).end();
}

/**
 * POST /api/permissions/refresh
 * Rebuild permission cache from database (admin only)
 */
export async function reloadPermissions(_req: Request, res: Response) {
  const ctx = makeCtx(_req);
  sessionRequired(ctx);
  requirePerm('perm.manage')(ctx);

  await refreshPermissions();
  res.status(204).end();
}
