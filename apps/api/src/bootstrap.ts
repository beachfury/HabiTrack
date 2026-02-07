// apps/api/src/bootstrap.ts
import type { Request, Response } from 'express';
import { q } from './db';
import { makeLocalClassifier } from '@habitrack/net';
import { parseEnv } from '@habitrack/core-config';

const cfg = parseEnv(process.env);
const classify = makeLocalClassifier({
  trustedProxies: cfg.trustedProxies as any,
  localCidrs: cfg.localCidrs as any,
});

export async function postBootstrap(req: Request, res: Response) {
  const { displayName = 'Admin' } = (req.body || {}) as { displayName?: string };
  const info = classify(req);
  if (!info.isLocal)
    return res
      .status(403)
      .json({ error: { code: 'PERMISSION_DENIED', message: 'Local network required' } });

  const [row] = await q<Array<{ isBootstrapped: number }>>(
    `SELECT isBootstrapped FROM settings WHERE id=1`,
  );
  if (row?.isBootstrapped)
    return res
      .status(409)
      .json({ error: { code: 'ALREADY_BOOTSTRAPPED', message: 'Already bootstrapped' } });

  const result: any = await q(
    `INSERT INTO users (displayName, roleId, kioskOnly, active) VALUES (?,?,0,1)`,
    [displayName, 'admin'],
  );

  await q(`UPDATE settings SET isBootstrapped=1 WHERE id=1`);
  res.status(201).json({ ok: true, adminUserId: result.insertId });
}
