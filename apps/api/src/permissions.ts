import type { RoleId, Rule } from '@habitrack/perm';
import { q } from './db';

// minimal safe defaults so the system works even if the table is empty
const DEFAULTS: Record<RoleId, Rule[]> = {
  admin: [{ actionPattern: '*', effect: 'allow' }],
  member: [],
  kid: [],
  kiosk: [{ actionPattern: 'dashboard.read', effect: 'allow', localOnly: true }],
};

let cache: Record<RoleId, Rule[]> = { ...DEFAULTS };

export async function refreshPermissions() {
  // permissions: roleId ENUM, actionPattern VARCHAR, effect ENUM, localOnly TINYINT(1)
  const rows = await q<
    Array<{ roleId: RoleId; actionPattern: string; effect: 'allow' | 'deny'; localOnly: 0 | 1 }>
  >(`SELECT roleId, actionPattern, effect, localOnly FROM permissions`);

  const next: Record<RoleId, Rule[]> = { admin: [], member: [], kid: [], kiosk: [] };
  for (const r of rows) {
    next[r.roleId]?.push({
      actionPattern: r.actionPattern,
      effect: r.effect,
      localOnly: !!r.localOnly,
    });
  }

  // if a role has 0 rows, keep its previous (or default) rules
  (['admin', 'member', 'kid', 'kiosk'] as RoleId[]).forEach((role) => {
    cache[role] = next[role].length ? next[role] : cache[role];
  });
}

export function getRoleRules(role: RoleId): Rule[] {
  return cache[role] ?? [];
}
