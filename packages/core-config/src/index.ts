import { z } from 'zod';

// Parse comma-separated lists like "a,b,c" into string[] (trimmed)
const csv = (v?: string) =>
  (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export const EnvSchema = z.object({
  HABITRACK_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  HABITRACK_BASE_URL: z.string().url(),
  HABITRACK_ALLOWED_ORIGINS: z.string().optional(),
  HABITRACK_TRUSTED_PROXIES: z.string().optional(),
  HABITRACK_LOCAL_CIDRS: z.string().optional(),
  HABITRACK_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  HABITRACK_STORAGE_DRIVER: z.enum(['mariadb', 'sqlite', 'json']).default('mariadb'),

  // MariaDB
  HABITRACK_DB_HOST: z.string().optional(),
  HABITRACK_DB_PORT: z.coerce.number().int().positive().default(3306),
  HABITRACK_DB_NAME: z.string().optional(),
  HABITRACK_DB_USER: z.string().optional(),
  HABITRACK_DB_PASSWORD: z.string().optional(),
  HABITRACK_DB_REQUIRE_TLS: z.coerce.boolean().default(false),
  HABITRACK_DB_POOL_MIN: z.coerce.number().int().min(0).default(1),
  HABITRACK_DB_POOL_MAX: z.coerce.number().int().min(1).default(10),

  // SQLite
  HABITRACK_SQLITE_PATH: z.string().optional(),

  // JSON
  HABITRACK_JSON_PATH: z.string().optional(),

  // Sessions & Cookies
  HABITRACK_SESSION_COOKIE_NAME: z.string().default('__Host-habitrack_sid'),
  HABITRACK_SESSION_TTL_MINUTES: z.coerce.number().int().positive().default(120),
  HABITRACK_SESSION_ROLLING: z.coerce.boolean().default(true),
  HABITRACK_COOKIE_SAMESITE: z.enum(['Lax', 'Strict', 'None']).default('Lax'),
  HABITRACK_COOKIE_SECURE: z.coerce.boolean().default(true),

  // CSRF
  HABITRACK_CSRF_ENABLED: z.coerce.boolean().default(true),
  HABITRACK_CSRF_COOKIE_NAME: z.string().default('__Host-habitrack_csrf'),
  HABITRACK_CSRF_HEADER_NAME: z.string().default('X-HabiTrack-CSRF'),

  // Rate Limits
  HABITRACK_RL_LOGIN_PER_IP: z.string().default('10/5m'),
  HABITRACK_RL_BOOTSTRAP_PER_IP: z.string().default('5/15m'),
  HABITRACK_RL_WRITE_PER_IP: z.string().default('60/1m'),

  // Bootstrap & Kiosk
  HABITRACK_BOOTSTRAP_HEADER: z.string().default('X-HabiTrack-Kiosk-Token'),
  HABITRACK_KIOSK_SESSION_TTL_HOURS: z.coerce.number().int().positive().default(720),

  // Crypto Policies
  HABITRACK_CRED_HASH_ALGO: z.enum(['argon2id']).default('argon2id'),
  HABITRACK_CRED_PIN_MIN_LENGTH: z.coerce.number().int().min(4).default(6),
  HABITRACK_CRED_LOCKOUT_THRESHOLD: z.coerce.number().int().min(1).default(5),
  HABITRACK_CRED_LOCKOUT_WINDOW_MIN: z.coerce.number().int().min(1).default(15),

  // Audit
  HABITRACK_AUDIT_RETENTION_DAYS: z.coerce.number().int().positive().default(365),
});

export type Env = z.infer<typeof EnvSchema>;

export function parseEnv(env: Record<string, string | undefined>) {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment: ${msg}`);
  }
  const v = parsed.data;
  return {
    ...v,
    allowedOrigins: csv(v.HABITRACK_ALLOWED_ORIGINS),
    trustedProxies: csv(v.HABITRACK_TRUSTED_PROXIES),
    localCidrs: csv(v.HABITRACK_LOCAL_CIDRS),
  } as const;
}

export type ResolvedConfig = ReturnType<typeof parseEnv>;
