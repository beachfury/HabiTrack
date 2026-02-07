import type express from 'express';
import { parseEnv } from '@habitrack/core-config';

export type ApiKeyRole = 'admin' | 'member' | 'kid' | 'kiosk';
export type ApiKey = { token: string; role: ApiKeyRole; requireLocal: boolean };

function parseApiKeysRaw(raw: unknown): ApiKey[] {
  const s = (Array.isArray(raw) ? raw.join(',') : (raw ?? '')).toString().trim();
  if (!s) return [];
  return s.split(',').map((entry) => {
    // Forms: role:token  OR  role@local:token
    const [left, token] = entry.split(':');
    const [rolePart, flag] = left.split('@');
    const role = rolePart as ApiKeyRole;
    const requireLocal = flag === 'local';
    if (!['admin', 'member', 'kid', 'kiosk'].includes(role) || !token) {
      throw new Error(`Invalid HABITRACK_API_KEYS entry: "${entry}"`);
    }
    return { token, role, requireLocal };
  });
}

const cfg = parseEnv(process.env);
const apiKeys: ApiKey[] = parseApiKeysRaw(
  (cfg as any).HABITRACK_API_KEYS ?? process.env.HABITRACK_API_KEYS,
);

/** If Authorization: Bearer <token> matches, return {role, requireLocal}; else null. */
export function getApiKeyAuth(
  req: express.Request,
): { role: ApiKeyRole; requireLocal: boolean } | null {
  const auth = (req.header('authorization') || '').trim();
  if (!auth.toLowerCase().startsWith('bearer ')) return null;
  const token = auth.slice(7).trim();
  const hit = apiKeys.find((k) => k.token === token);
  return hit ? { role: hit.role, requireLocal: hit.requireLocal } : null;
}
