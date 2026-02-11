// apps/api/src/routes/settings/branding.ts
// Public branding endpoint — no auth required.
// Returns the household name, logo, brand color, and login background
// so the login page can display them without being authenticated.

import type { Request, Response } from 'express';
import { q } from '../../db';
import { success, serverError } from '../../utils';

interface BrandingRow {
  householdName: string | null;
  brandColor: string | null;
  logoUrl: string | null;
  loginBackground: string | null;
  loginBackgroundValue: string | null;
}

/**
 * GET /api/branding
 * Public endpoint — no auth required.
 * Returns only the fields the login page needs.
 */
export async function getBranding(req: Request, res: Response) {
  try {
    const [row] = await q<BrandingRow[]>(
      `SELECT householdName, brandColor, logoUrl, loginBackground, loginBackgroundValue
       FROM settings WHERE id = 1`,
    );

    if (!row) {
      return success(res, {
        name: 'Our Family',
        brandColor: '#3cb371',
        logoUrl: null,
        loginBackground: 'gradient',
        loginBackgroundValue: null,
      });
    }

    return success(res, {
      name: row.householdName,
      brandColor: row.brandColor,
      logoUrl: row.logoUrl,
      loginBackground: row.loginBackground,
      loginBackgroundValue: row.loginBackgroundValue,
    });
  } catch (err) {
    return serverError(res, err as Error);
  }
}
