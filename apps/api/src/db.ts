// apps/api/src/db.ts
import 'dotenv/config';
import { createPool, type PoolOptions } from 'mysql2/promise';
import { parseEnv } from '@habitrack/core-config';

const cfg = parseEnv(process.env);

// Prefer raw env, then cfg, then default. Only the literal "true" enables TLS.
const HOST = String(process.env.HABITRACK_DB_HOST ?? cfg.HABITRACK_DB_HOST ?? '127.0.0.1');
const PORT = Number(process.env.HABITRACK_DB_PORT ?? cfg.HABITRACK_DB_PORT ?? 3306);
const USER = String(process.env.HABITRACK_DB_USER ?? cfg.HABITRACK_DB_USER ?? 'habitrack_app');
const PASS = String(process.env.HABITRACK_DB_PASSWORD ?? cfg.HABITRACK_DB_PASSWORD ?? '');
const NAME = String(process.env.HABITRACK_DB_NAME ?? cfg.HABITRACK_DB_NAME ?? 'habitrack');
const POOL_MAX = Number(process.env.HABITRACK_DB_POOL_MAX ?? cfg.HABITRACK_DB_POOL_MAX ?? 10);

const RAW_TLS = process.env.HABITRACK_DB_REQUIRE_TLS ?? cfg.HABITRACK_DB_REQUIRE_TLS ?? 'false';
const REQUIRE_TLS = /^true$/i.test(String(RAW_TLS).trim());

const opts: PoolOptions = {
  host: HOST,
  port: PORT,
  user: USER,
  password: PASS,
  database: NAME,
  connectionLimit: POOL_MAX,
  ssl: REQUIRE_TLS ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
};

console.log('[DB:pool]', { host: HOST, port: PORT, tls: REQUIRE_TLS });

export const pool = createPool(opts);

export async function q<T = any>(sql: string, params: any[] = []): Promise<T> {
  const [rows] = await pool.query(sql, params);
  return rows as T;
}
