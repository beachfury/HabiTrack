// apps/api/src/routes/settings/household.ts
// Household settings routes (admin only)
// FIXED: Now consistently uses 'settings' table instead of 'households'

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import { getUser, success, forbidden, serverError } from '../../utils';
import { createLogger } from '../../services/logger';

const log = createLogger('settings');

interface HouseholdSettings {
  id: number;
  name: string | null;
  brandColor: string | null;
  logoUrl: string | null;
  loginBackground: string | null;
  loginBackgroundValue: string | null;
  timezone: string | null;
  choreDeadlineReminder1Enabled: boolean;
  choreDeadlineReminder1Time: string;
  choreDeadlineReminder2Enabled: boolean;
  choreDeadlineReminder2Time: string;
  choreDeadlineReminder3Enabled: boolean;
  choreDeadlineReminder3Time: string;
  choreDeadlineReminder4Enabled: boolean;
  choreDeadlineReminder4Time: string;
}

/**
 * GET /api/settings/household
 * Get household settings (admin only)
 */
export async function getHouseholdSettings(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  if (user.roleId !== 'admin') {
    return forbidden(res, 'Admin access required');
  }

  try {
    const [settings] = await q<HouseholdSettings[]>(
      `SELECT id, householdName as name, brandColor, logoUrl, loginBackground, loginBackgroundValue, timezone,
        choreDeadlineReminder1Enabled, choreDeadlineReminder1Time,
        choreDeadlineReminder2Enabled, choreDeadlineReminder2Time,
        choreDeadlineReminder3Enabled, choreDeadlineReminder3Time,
        choreDeadlineReminder4Enabled, choreDeadlineReminder4Time
       FROM settings WHERE id = 1`,
    );

    // Convert booleans from tinyint for deadline reminders
    const household = settings
      ? {
          ...settings,
          choreDeadlineReminder1Enabled: !!settings.choreDeadlineReminder1Enabled,
          choreDeadlineReminder2Enabled: !!settings.choreDeadlineReminder2Enabled,
          choreDeadlineReminder3Enabled: !!settings.choreDeadlineReminder3Enabled,
          choreDeadlineReminder4Enabled: !!settings.choreDeadlineReminder4Enabled,
        }
      : {};

    return success(res, { household });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * PUT /api/settings/household
 * Update household settings (admin only)
 */
export async function updateHouseholdSettings(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  if (user.roleId !== 'admin') {
    return forbidden(res, 'Admin access required');
  }

  const {
    name, brandColor, logoUrl, loginBackground, loginBackgroundValue, timezone,
    choreDeadlineReminder1Enabled, choreDeadlineReminder1Time,
    choreDeadlineReminder2Enabled, choreDeadlineReminder2Time,
    choreDeadlineReminder3Enabled, choreDeadlineReminder3Time,
    choreDeadlineReminder4Enabled, choreDeadlineReminder4Time,
  } = req.body;

  try {
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('householdName = ?');
      params.push(name || null);
    }
    if (brandColor !== undefined) {
      updates.push('brandColor = ?');
      params.push(brandColor || null);
    }
    if (logoUrl !== undefined) {
      updates.push('logoUrl = ?');
      params.push(logoUrl || null);
    }
    if (loginBackground !== undefined) {
      updates.push('loginBackground = ?');
      params.push(loginBackground || null);
    }
    if (loginBackgroundValue !== undefined) {
      updates.push('loginBackgroundValue = ?');
      params.push(loginBackgroundValue || null);
    }
    if (timezone !== undefined) {
      updates.push('timezone = ?');
      params.push(timezone || null);
    }

    // Chore deadline reminder settings (up to 4 slots)
    const deadlineFields = [
      { key: 'choreDeadlineReminder1Enabled', value: choreDeadlineReminder1Enabled, isBool: true },
      { key: 'choreDeadlineReminder1Time', value: choreDeadlineReminder1Time, isBool: false },
      { key: 'choreDeadlineReminder2Enabled', value: choreDeadlineReminder2Enabled, isBool: true },
      { key: 'choreDeadlineReminder2Time', value: choreDeadlineReminder2Time, isBool: false },
      { key: 'choreDeadlineReminder3Enabled', value: choreDeadlineReminder3Enabled, isBool: true },
      { key: 'choreDeadlineReminder3Time', value: choreDeadlineReminder3Time, isBool: false },
      { key: 'choreDeadlineReminder4Enabled', value: choreDeadlineReminder4Enabled, isBool: true },
      { key: 'choreDeadlineReminder4Time', value: choreDeadlineReminder4Time, isBool: false },
    ];

    for (const field of deadlineFields) {
      if (field.value !== undefined) {
        updates.push(`${field.key} = ?`);
        params.push(field.isBool ? (field.value ? 1 : 0) : field.value);
      }
    }

    if (updates.length > 0) {
      params.push(1); // WHERE id = 1
      await q(`UPDATE settings SET ${updates.join(', ')}, updatedAt = NOW(3) WHERE id = ?`, params);

      log.info('Household settings updated', { userId: user.id, fields: updates.map(u => u.split(' ')[0]) });
    }

    await logAudit({
      action: 'settings.household.update',
      result: 'ok',
      actorId: user.id,
      details: { updates: req.body },
    });

    return success(res, { success: true });
  } catch (err) {
    log.error('Failed to update household settings', { error: String(err) });
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/settings/household/logo
 * Update household logo URL (admin only)
 */
export async function updateHouseholdLogo(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  if (user.roleId !== 'admin') {
    return forbidden(res, 'Admin access required');
  }

  const { logoUrl } = req.body;

  try {
    await q(`UPDATE settings SET logoUrl = ?, updatedAt = NOW(3) WHERE id = 1`, [logoUrl || null]);

    await logAudit({
      action: 'settings.household.logo.update',
      result: 'ok',
      actorId: user.id,
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * DELETE /api/settings/household/logo
 * Remove household logo (admin only)
 */
export async function removeHouseholdLogo(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  if (user.roleId !== 'admin') {
    return forbidden(res, 'Admin access required');
  }

  try {
    await q(`UPDATE settings SET logoUrl = NULL, updatedAt = NOW(3) WHERE id = 1`);

    await logAudit({
      action: 'settings.household.logo.remove',
      result: 'ok',
      actorId: user.id,
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}
