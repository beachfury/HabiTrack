import { q } from './db';

export async function logAudit(data: {
  actorId?: number | null;
  ip?: string | null;
  ua?: string | null;
  action: string;
  target?: string | null;
  result: 'ok' | 'deny' | 'error';
  details?: any;
}) {
  try {
    await q(
      `INSERT INTO audit_log (actorId, ip, ua, action, target, result, details)
       VALUES (?,?,?,?,?,?,?)`,
      [
        data.actorId ?? null,
        data.ip ?? null,
        data.ua ?? null,
        data.action,
        data.target ?? null,
        data.result,
        data.details ? JSON.stringify(data.details) : null,
      ],
    );
  } catch (e: any) {
    console.warn('[audit] insert skipped:', e?.message || e);
  }
}
