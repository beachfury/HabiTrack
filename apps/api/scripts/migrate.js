// apps/api/scripts/migrate.js
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Support multiple environments:
// 1. Docker: cwd=/app, migrations at /app/providers/storage-mariadb/migrations
// 2. Local from apps/api: cwd=apps/api, migrations at ../../providers/storage-mariadb/migrations
// 3. Local from project root: cwd=project root, migrations at ./providers/storage-mariadb/migrations
function findMigrationsDir() {
  const candidates = [
    join(process.cwd(), 'providers', 'storage-mariadb', 'migrations'),  // Docker or project root
    join(process.cwd(), '..', '..', 'providers', 'storage-mariadb', 'migrations'),  // From apps/api
  ];

  for (const dir of candidates) {
    if (existsSync(dir)) {
      console.log(`[migrate] Found migrations at: ${dir}`);
      return dir;
    }
  }

  throw new Error(`Migrations directory not found. Checked: ${candidates.join(', ')}`);
}

const MIGRATIONS_DIR = findMigrationsDir();

function env(name, fallback = undefined) {
  const v = process.env[name];
  return v === undefined || v === '' ? fallback : v;
}

const DB_HOST = env('HABITRACK_DB_HOST', 'db');
const DB_PORT = Number(env('HABITRACK_DB_PORT', '3306'));
const DB_USER = env('HABITRACK_DB_USER', 'habitrack_app');
const DB_PASS = env('HABITRACK_DB_PASSWORD', '');
const DB_NAME = env('HABITRACK_DB_NAME', 'habitrack');

async function main() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d+_.*\.sql$/i.test(f))
    .sort();

  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    multipleStatements: true,
  });

  try {
    // Prevent two app containers racing migrations
    const [lockRows] = await conn.query("SELECT GET_LOCK('habitrack_migrate', 60) AS got");
    const got = Array.isArray(lockRows) ? lockRows[0]?.got : 0;
    if (!got) throw new Error('Could not acquire migration lock (GET_LOCK)');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) NOT NULL PRIMARY KEY,
        applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [appliedRows] = await conn.query('SELECT filename FROM schema_migrations');
    const applied = new Set((appliedRows || []).map((r) => r.filename));

    for (const f of files) {
      if (applied.has(f)) {
        continue;
      }
      const sql = readFileSync(join(MIGRATIONS_DIR, f), 'utf8');
      console.log(`[migrate] applying ${f}`);
      await conn.query(sql);
      await conn.query('INSERT INTO schema_migrations (filename) VALUES (?)', [f]);
    }

    console.log('[migrate] done');
  } finally {
    try {
      await conn.query("SELECT RELEASE_LOCK('habitrack_migrate')");
    } catch {}
    await conn.end();
  }
}

main().catch((err) => {
  console.error('[migrate] failed:', err?.message || err);
  process.exit(1);
});
