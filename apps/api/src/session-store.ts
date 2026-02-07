// apps/api/src/session-store.ts
// SINGLETON session store - import this everywhere instead of creating new instances

import 'dotenv/config';
import { MariaDbSessionStore } from '@habitrack/session-store';
import { parseEnv } from '@habitrack/core-config';

const cfg = parseEnv(process.env);

const IS_PROD =
  String(cfg.HABITRACK_ENV || process.env.NODE_ENV || 'development').toLowerCase() === 'production';

const REQUIRE_TLS =
  IS_PROD &&
  String(cfg.HABITRACK_DB_REQUIRE_TLS ?? 'false')
    .trim()
    .toLowerCase() === 'true';

// Single shared instance
export const sessionStore = new MariaDbSessionStore({
  host: String(cfg.HABITRACK_DB_HOST ?? '127.0.0.1'),
  port: Number(cfg.HABITRACK_DB_PORT ?? 3306),
  user: String(cfg.HABITRACK_DB_USER ?? 'habitrack_app'),
  password: String(cfg.HABITRACK_DB_PASSWORD ?? ''),
  database: String(cfg.HABITRACK_DB_NAME ?? 'habitrack'),
  connectionLimit: Number(cfg.HABITRACK_DB_POOL_MAX ?? 10),
  requireTls: REQUIRE_TLS,
});

console.log('[session-store] singleton initialized', {
  host: cfg.HABITRACK_DB_HOST ?? '127.0.0.1',
  tls: REQUIRE_TLS,
});
