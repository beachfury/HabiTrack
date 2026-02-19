// apps/api/src/routes/calendar/holidays.ts
// National holiday settings and cached holiday data from Nager.Date API

import type { Request, Response } from 'express';
import { q } from '../../db';
import { getUser, success, serverError, validationError } from '../../utils';
import { createLogger } from '../../services/logger';

const log = createLogger('calendar');

interface Holiday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

const VALID_COUNTRIES = [
  'US', 'CA', 'GB', 'DE', 'FR', 'AU', 'NZ', 'MX', 'BR', 'JP',
  'KR', 'IN', 'IT', 'ES', 'NL', 'BE', 'SE', 'NO', 'DK', 'FI',
  'AT', 'CH', 'IE', 'PL', 'CZ', 'PT', 'ZA', 'NG', 'PH', 'SG',
];

// In-memory cache keyed by "${countryCode}-${year}"
const holidayCache = new Map<string, { holidays: Holiday[]; fetchedAt: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch and cache holidays for the given countries and year range.
 * Exported for use by calendar events.ts.
 */
export async function getCachedHolidays(
  countries: string[],
  startYear: number,
  endYear: number,
): Promise<Holiday[]> {
  const allHolidays: Holiday[] = [];

  for (const countryCode of countries) {
    for (let year = startYear; year <= endYear; year++) {
      const cacheKey = `${countryCode}-${year}`;
      const cached = holidayCache.get(cacheKey);

      if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
        allHolidays.push(...cached.holidays);
        continue;
      }

      try {
        const response = await fetch(
          `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`,
        );

        if (!response.ok) {
          log.warn('Holiday API returned non-OK status', {
            countryCode,
            year,
            status: response.status,
          });
          holidayCache.set(cacheKey, { holidays: [], fetchedAt: Date.now() });
          continue;
        }

        const holidays: Holiday[] = await response.json();
        holidayCache.set(cacheKey, { holidays, fetchedAt: Date.now() });
        allHolidays.push(...holidays);
      } catch (err) {
        log.warn('Failed to fetch holidays from API', {
          countryCode,
          year,
          error: String(err),
        });
        // Cache empty result so we don't retry immediately
        holidayCache.set(cacheKey, { holidays: [], fetchedAt: Date.now() });
      }
    }
  }

  return allHolidays;
}

/**
 * GET /api/settings/holidays
 * Read the configured holiday countries from the settings table
 */
export async function getHolidaySettings(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  try {
    const [settings] = await q<Array<{ holidayCountries: string | null }>>(
      `SELECT holidayCountries FROM settings WHERE id = 1`,
    );

    if (!settings?.holidayCountries) {
      return success(res, { countries: [] });
    }

    const countries: string[] =
      typeof settings.holidayCountries === 'string'
        ? JSON.parse(settings.holidayCountries)
        : settings.holidayCountries;

    return success(res, { countries });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * PUT /api/settings/holidays
 * Update the configured holiday countries
 */
export async function updateHolidaySettings(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { countries } = req.body;

  if (!Array.isArray(countries)) {
    return validationError(res, 'countries must be an array');
  }

  if (countries.length > 10) {
    return validationError(res, 'Maximum of 10 countries allowed');
  }

  for (const code of countries) {
    if (typeof code !== 'string' || code.length !== 2 || code !== code.toUpperCase()) {
      return validationError(res, `Invalid country code: ${code}. Must be a 2-letter uppercase code`);
    }
    if (!VALID_COUNTRIES.includes(code)) {
      return validationError(res, `Unsupported country code: ${code}`);
    }
  }

  try {
    await q(
      `UPDATE settings SET holidayCountries = ? WHERE id = 1`,
      [JSON.stringify(countries)],
    );

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * GET /api/calendar/holidays?year=2026
 * Return holidays for the configured countries and requested year
 */
export async function getHolidays(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const yearParam = req.query.year;

  if (!yearParam) {
    return validationError(res, 'year query parameter is required');
  }

  const year = parseInt(String(yearParam), 10);

  if (isNaN(year) || year < 2000 || year > 2100) {
    return validationError(res, 'year must be a valid number between 2000 and 2100');
  }

  try {
    const [settings] = await q<Array<{ holidayCountries: string | null }>>(
      `SELECT holidayCountries FROM settings WHERE id = 1`,
    );

    if (!settings?.holidayCountries) {
      return success(res, { holidays: [] });
    }

    const countries: string[] =
      typeof settings.holidayCountries === 'string'
        ? JSON.parse(settings.holidayCountries)
        : settings.holidayCountries;

    if (countries.length === 0) {
      return success(res, { holidays: [] });
    }

    const holidays = await getCachedHolidays(countries, year, year);

    return success(res, { holidays });
  } catch (err) {
    return serverError(res, err as Error);
  }
}
