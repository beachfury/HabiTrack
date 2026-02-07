import { q } from './db';
import type { RoleId } from '@habitrack/perm';

export async function countUsersByRole(roleId: RoleId): Promise<number> {
  const rows = await q<Array<{ c: number }>>(
    `SELECT COUNT(*) AS c FROM users WHERE roleId = ? AND active = 1`,
    [roleId],
  );
  return rows[0]?.c ?? 0;
}
