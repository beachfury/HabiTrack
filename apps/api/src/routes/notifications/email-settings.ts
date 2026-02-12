// apps/api/src/routes/notifications/email-settings.ts
// Admin-only API for managing email/SMTP settings

import type { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { q } from '../../db';
import { success, serverError, validationError } from '../../utils';
import { logAudit } from '../../audit';
import { renderTemplate, TEST_EMAIL } from '../../email/templates';
import { createLogger } from '../../services/logger';

const log = createLogger('email-settings');

/**
 * Email settings type (without password for response)
 */
export interface EmailSettings {
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpSecure: boolean;
  fromEmail: string | null;
  fromName: string | null;
  maxEmailsPerHour: number;
  maxEmailsPerUserPerHour: number;
  lastTestSentAt: string | null;
  lastTestResult: string | null;
}

/**
 * GET /api/notifications/email-settings
 * Get email settings (admin only)
 */
export async function getEmailSettings(req: Request, res: Response) {
  try {
    // Check admin role
    if (req.user?.roleId !== 'admin') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
    }

    const [settings] = await q<
      Array<{
        smtpHost: string | null;
        smtpPort: number | null;
        smtpUser: string | null;
        smtpSecure: number;
        fromEmail: string | null;
        fromName: string | null;
        maxEmailsPerHour: number;
        maxEmailsPerUserPerHour: number;
        lastTestSentAt: Date | null;
        lastTestResult: string | null;
      }>
    >(
      `SELECT smtpHost, smtpPort, smtpUser, smtpSecure, fromEmail, fromName,
              maxEmailsPerHour, maxEmailsPerUserPerHour, lastTestSentAt, lastTestResult
       FROM email_settings WHERE id = 1`,
    );

    if (!settings) {
      return success(res, {
        settings: {
          smtpHost: null,
          smtpPort: 587,
          smtpUser: null,
          smtpSecure: true,
          fromEmail: null,
          fromName: 'HabiTrack',
          maxEmailsPerHour: 100,
          maxEmailsPerUserPerHour: 20,
          lastTestSentAt: null,
          lastTestResult: null,
        } as EmailSettings,
      });
    }

    // Never return the password
    const response: EmailSettings = {
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpUser: settings.smtpUser,
      smtpSecure: !!settings.smtpSecure,
      fromEmail: settings.fromEmail,
      fromName: settings.fromName,
      maxEmailsPerHour: settings.maxEmailsPerHour,
      maxEmailsPerUserPerHour: settings.maxEmailsPerUserPerHour,
      lastTestSentAt: settings.lastTestSentAt?.toISOString() ?? null,
      lastTestResult: settings.lastTestResult,
    };

    log.debug('Email settings retrieved', { userId: req.user?.id });
    return success(res, { settings: response });
  } catch (err) {
    log.error('Failed to get email settings', { error: String(err) });
    return serverError(res, err as Error);
  }
}

/**
 * PUT /api/notifications/email-settings
 * Update email settings (admin only)
 */
export async function updateEmailSettings(req: Request, res: Response) {
  try {
    // Check admin role
    if (req.user?.roleId !== 'admin') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
    }

    const {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpSecure,
      fromEmail,
      fromName,
      maxEmailsPerHour,
      maxEmailsPerUserPerHour,
    } = req.body as {
      smtpHost?: string;
      smtpPort?: number;
      smtpUser?: string;
      smtpPassword?: string;
      smtpSecure?: boolean;
      fromEmail?: string;
      fromName?: string;
      maxEmailsPerHour?: number;
      maxEmailsPerUserPerHour?: number;
    };

    // Validate inputs
    if (smtpPort !== undefined && (smtpPort < 1 || smtpPort > 65535)) {
      return validationError(res, 'smtpPort must be between 1 and 65535');
    }

    if (maxEmailsPerHour !== undefined && (maxEmailsPerHour < 1 || maxEmailsPerHour > 10000)) {
      return validationError(res, 'maxEmailsPerHour must be between 1 and 10000');
    }

    if (maxEmailsPerUserPerHour !== undefined && (maxEmailsPerUserPerHour < 1 || maxEmailsPerUserPerHour > 1000)) {
      return validationError(res, 'maxEmailsPerUserPerHour must be between 1 and 1000');
    }

    // Build update query
    const fields: string[] = [];
    const values: any[] = [];

    if (smtpHost !== undefined) {
      fields.push('smtpHost = ?');
      values.push(smtpHost || null);
    }

    if (smtpPort !== undefined) {
      fields.push('smtpPort = ?');
      values.push(smtpPort);
    }

    if (smtpUser !== undefined) {
      fields.push('smtpUser = ?');
      values.push(smtpUser || null);
    }

    // Only update password if explicitly provided
    if (smtpPassword !== undefined) {
      // Note: In production, this should be encrypted
      fields.push('smtpPassword = ?');
      values.push(smtpPassword ? Buffer.from(smtpPassword) : null);
    }

    if (smtpSecure !== undefined) {
      fields.push('smtpSecure = ?');
      values.push(smtpSecure ? 1 : 0);
    }

    if (fromEmail !== undefined) {
      fields.push('fromEmail = ?');
      values.push(fromEmail || null);
    }

    if (fromName !== undefined) {
      fields.push('fromName = ?');
      values.push(fromName || null);
    }

    if (maxEmailsPerHour !== undefined) {
      fields.push('maxEmailsPerHour = ?');
      values.push(maxEmailsPerHour);
    }

    if (maxEmailsPerUserPerHour !== undefined) {
      fields.push('maxEmailsPerUserPerHour = ?');
      values.push(maxEmailsPerUserPerHour);
    }

    if (fields.length > 0) {
      await q(`UPDATE email_settings SET ${fields.join(', ')} WHERE id = 1`, values);

      const updatedFields = fields.map(f => f.split(' ')[0]);
      log.info('Email settings updated', { userId: req.user.id, fields: updatedFields });

      // Audit log
      await logAudit({
        action: 'settings.email_updated',
        result: 'ok',
        actorId: req.user.id,
        ip: req.ip || 'unknown',
        ua: req.get('user-agent') || 'unknown',
        details: { fields: updatedFields },
      });
    }

    // Return updated settings (without password)
    return getEmailSettings(req, res);
  } catch (err) {
    log.error('Failed to update email settings', { error: String(err) });
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/notifications/email-settings/test
 * Send a test email (admin only)
 */
export async function sendTestEmail(req: Request, res: Response) {
  try {
    // Check admin role
    if (req.user?.roleId !== 'admin') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
    }

    const { toEmail } = req.body as { toEmail?: string };

    if (!toEmail) {
      return validationError(res, 'toEmail is required');
    }

    // Get current settings
    const [settings] = await q<
      Array<{
        smtpHost: string | null;
        smtpPort: number | null;
        smtpUser: string | null;
        smtpPassword: Buffer | null;
        smtpSecure: number;
        fromEmail: string | null;
        fromName: string | null;
      }>
    >(
      `SELECT smtpHost, smtpPort, smtpUser, smtpPassword, smtpSecure, fromEmail, fromName
       FROM email_settings WHERE id = 1`,
    );

    // Also check environment variables as fallback
    const host = settings?.smtpHost || process.env.SMTP_HOST;
    const port = settings?.smtpPort || Number(process.env.SMTP_PORT ?? 587);
    const user = settings?.smtpUser || process.env.SMTP_USER;
    const pass = settings?.smtpPassword?.toString() || process.env.SMTP_PASS;
    const secure = settings?.smtpSecure ?? String(process.env.SMTP_SECURE ?? 'false').toLowerCase() === 'true';

    let testResult = '';
    let success_ = false;

    try {
      let transporter: nodemailer.Transporter;

      if (!host) {
        // Use Ethereal for testing
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
        testResult = 'Using Ethereal test account (no SMTP configured). ';
      } else {
        transporter = nodemailer.createTransport({
          host,
          port,
          secure: !!secure,
          auth: user ? { user, pass } : undefined,
        });
      }

      // Verify connection
      await transporter.verify();

      // Render and send test email
      const fromEmail = settings?.fromEmail || process.env.SMTP_FROM || 'no-reply@localhost';
      const fromName = settings?.fromName || 'HabiTrack';
      const from = `${fromName} <${fromEmail}>`;

      const rendered = renderTemplate(TEST_EMAIL, {
        timestamp: new Date().toISOString(),
      });

      const info = await transporter.sendMail({
        from,
        to: toEmail,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
      });

      // Get preview URL for Ethereal
      const previewUrl = nodemailer.getTestMessageUrl(info as any);
      if (previewUrl) {
        testResult += `Preview URL: ${previewUrl}`;
      } else {
        testResult += `Email sent successfully. Message ID: ${info.messageId}`;
      }

      success_ = true;
    } catch (err) {
      testResult = `Failed: ${String(err)}`;
      success_ = false;
    }

    // Update last test result in database
    await q(
      'UPDATE email_settings SET lastTestSentAt = NOW(3), lastTestResult = ? WHERE id = 1',
      [testResult],
    );

    // Audit log
    await logAudit({
      action: 'settings.email_test',
      result: success_ ? 'ok' : 'error',
      actorId: req.user.id,
      ip: req.ip || 'unknown',
      ua: req.get('user-agent') || 'unknown',
      details: { toEmail, result: testResult },
    });

    if (success_) {
      log.info('Test email sent successfully', { userId: req.user.id, toEmail });
    } else {
      log.warn('Test email failed', { userId: req.user.id, toEmail, result: testResult });
    }

    return success(res, {
      success: success_,
      message: testResult,
    });
  } catch (err) {
    log.error('Failed to send test email', { error: String(err) });
    return serverError(res, err as Error);
  }
}
