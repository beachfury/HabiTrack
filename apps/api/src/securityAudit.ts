// apps/api/src/securityAudit.ts
import { q } from './db';

type AuditMeta = Record<string, unknown>;

export async function logAudit(
  event: string,
  opts: { userId?: number; ip?: string; ua?: string; meta?: AuditMeta } = {},
) {
  try {
    await q(
      `INSERT INTO audit_log (event, user_id, ip, ua, meta_json, created_at)
       VALUES (?, ?, ?, ?, ?, NOW(3))`,
      [
        event,
        opts.userId ?? null,
        (opts.ip ?? '').slice(0, 45),
        (opts.ua ?? '').slice(0, 255),
        JSON.stringify(opts.meta ?? {}),
      ],
    );
  } catch {
    // never crash the request on audit write issues
  }
}
