import { createPool, type PoolOptions } from 'mysql2/promise';
import { nanoid } from 'nanoid';

export type RoleId = string;

export interface SessionRow {
  sid: string;
  userId: number;
  role: RoleId;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
  impersonatedBy?: number | null;
  isKiosk?: boolean;
  clientIp?: string | null;
}

export interface SessionNew {
  userId: number;
  role: RoleId;
  ttlMinutes: number;
  impersonatedBy?: number | null;
  isKiosk?: boolean;
  clientIp?: string | null;
}

export interface SessionStore {
  create(data: SessionNew): Promise<SessionRow>;
  get(sid: string): Promise<SessionRow | null>;
  touch(sid: string, ttlMinutes: number): Promise<void>;
  destroy(sid: string): Promise<void>;
}

export interface MariaDbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit?: number;
  requireTls?: boolean;
}

type MinimalPromisePool = {
  query: (sql: string, params?: any[]) => Promise<[any, any]>;
};

export class MariaDbSessionStore implements SessionStore {
  private pool: MinimalPromisePool;

  constructor(cfg: MariaDbConfig) {
    const sslEnabled = !!cfg.requireTls;
    const opts: PoolOptions = {
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database,
      connectionLimit: cfg.connectionLimit ?? 10,
      ...(sslEnabled ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {}),
    };
    console.log('[session-store] mysql2 ssl enabled =', !!(opts as any).ssl);
    this.pool = createPool(opts) as unknown as MinimalPromisePool;
  }

  async create(data: SessionNew): Promise<SessionRow> {
    const sid = nanoid(48);
    const now = new Date();
    const expires = new Date(now.getTime() + data.ttlMinutes * 60_000);

    await this.pool.query(
      `INSERT INTO sessions (sid, user_id, role, created_at, last_seen_at, expires_at, impersonated_by, is_kiosk, client_ip)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        sid,
        data.userId,
        data.role,
        now,
        now,
        expires,
        data.impersonatedBy ?? null,
        data.isKiosk ? 1 : 0,
        data.clientIp ?? null,
      ],
    );

    return {
      sid,
      userId: data.userId,
      role: data.role,
      createdAt: now,
      lastSeenAt: now,
      expiresAt: expires,
      impersonatedBy: data.impersonatedBy ?? null,
      isKiosk: data.isKiosk ?? false,
      clientIp: data.clientIp ?? null,
    };
  }

  async get(sid: string): Promise<SessionRow | null> {
    const [rows] = await this.pool.query(
      `SELECT sid, user_id AS userId, role,
              created_at AS createdAt, last_seen_at AS lastSeenAt, expires_at AS expiresAt,
              impersonated_by AS impersonatedBy, is_kiosk AS isKiosk, client_ip AS clientIp
       FROM sessions WHERE sid = ? LIMIT 1`,
      [sid],
    );

    const r = Array.isArray(rows) && rows.length ? (rows[0] as any) : null;
    if (!r) return null;

    if (new Date(r.expiresAt).getTime() <= Date.now()) {
      await this.destroy(sid);
      return null;
    }

    // Convert is_kiosk from 0/1 to boolean
    r.isKiosk = !!r.isKiosk;

    return r as SessionRow;
  }

  async touch(sid: string, ttlMinutes: number): Promise<void> {
    const now = new Date();
    const expires = new Date(now.getTime() + ttlMinutes * 60_000);
    await this.pool.query(`UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE sid = ?`, [
      now,
      expires,
      sid,
    ]);
  }

  async destroy(sid: string): Promise<void> {
    await this.pool.query(`DELETE FROM sessions WHERE sid = ?`, [sid]);
  }
}
