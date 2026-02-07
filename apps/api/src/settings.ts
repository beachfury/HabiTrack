import { parseEnv } from '@habitrack/core-config';
import { q } from './db';
import { setTimezone } from './utils/date';

type DynSettings = {
  allowedOrigins: string[];
  trustedProxies: string[];
  localCidrs: string[];
};

const cfg = parseEnv(process.env);
let dyn: DynSettings = {
  allowedOrigins: cfg.allowedOrigins ?? [],
  trustedProxies: cfg.trustedProxies ?? [],
  localCidrs: cfg.localCidrs ?? [],
};

export function getSettings(): DynSettings {
  return dyn;
}

export async function initializeTimezone() {
  try {
    const [setting] = await q<Array<{ timezone: string | null }>>(
      `SELECT timezone FROM settings WHERE id = 1 LIMIT 1`,
    );
    if (setting?.timezone) {
      setTimezone(setting.timezone);
      console.log(`[timezone] Set to: ${setting.timezone}`);
    } else {
      console.log('[timezone] Using default: America/Los_Angeles');
    }
  } catch (err) {
    console.error('[timezone] Failed to load from database, using default');
  }
}

export async function reloadSettings() {
  const rows = await q<
    Array<{
      allowedOrigins: string | null;
      localCidrs: string | null;
      trustedProxies: string | null;
      timezone: string | null;
    }>
  >(`SELECT allowedOrigins, localCidrs, trustedProxies, timezone FROM settings WHERE id=1`);

  if (rows.length) {
    const row = rows[0];
    const parseList = (txt: string | null | undefined) =>
      (txt || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    dyn = {
      allowedOrigins: row.allowedOrigins
        ? parseList(row.allowedOrigins)
        : (cfg.allowedOrigins ?? []),
      trustedProxies: row.trustedProxies
        ? parseList(row.trustedProxies)
        : (cfg.trustedProxies ?? []),
      localCidrs: row.localCidrs ? parseList(row.localCidrs) : (cfg.localCidrs ?? []),
    };

    // Also update timezone when settings are reloaded
    if (row.timezone) {
      setTimezone(row.timezone);
    }
  }
}
