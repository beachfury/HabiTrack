// apps/api/src/workers/send-notifications.ts
// Background worker that processes the email outbox queue
// Sends emails via SMTP with retry logic and rate limiting

import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { q } from '../db';
import { checkEmailRateLimit } from '../email/rate-limiter';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  HABITRACK_ENV = 'development',
} = process.env;

// Maximum attempts before marking as failed
const MAX_ATTEMPTS = 3;

// Interval between processing runs (ms)
const PROCESS_INTERVAL = 5000; // 5 seconds

// Batch size for processing
const BATCH_SIZE = 10;

let transporter: nodemailer.Transporter | null = null;
let lastTransportError: string | null = null;

/**
 * Initialize or get the SMTP transporter
 */
async function getTransporter(): Promise<nodemailer.Transporter | null> {
  if (transporter) return transporter;

  try {
    // Try to load settings from database first
    const [settings] = await q<
      Array<{
        smtpHost: string | null;
        smtpPort: number | null;
        smtpUser: string | null;
        smtpPassword: Buffer | null;
        smtpSecure: boolean;
        fromEmail: string | null;
        fromName: string | null;
      }>
    >('SELECT smtpHost, smtpPort, smtpUser, smtpPassword, smtpSecure, fromEmail, fromName FROM email_settings WHERE id = 1');

    const host = settings?.smtpHost || SMTP_HOST;
    const port = settings?.smtpPort || Number(SMTP_PORT ?? 587);
    const secure = settings?.smtpSecure ?? String(SMTP_SECURE ?? 'false').toLowerCase() === 'true';
    const user = settings?.smtpUser || SMTP_USER;
    // Use password from database if available, otherwise fall back to env var
    // The password is stored as a Buffer in the database
    const pass = settings?.smtpPassword
      ? settings.smtpPassword.toString('utf8')
      : SMTP_PASS;

    if (!host) {
      if (HABITRACK_ENV !== 'production') {
        // Use Ethereal for development/testing
        console.log('[email-worker] No SMTP configured, using Ethereal test account');
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
        return transporter;
      }
      lastTransportError = 'No SMTP host configured';
      return null;
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
      // Connection pooling for efficiency
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    // Verify connection
    await transporter.verify();
    console.log('[email-worker] SMTP connection verified');
    lastTransportError = null;

    return transporter;
  } catch (err) {
    lastTransportError = String(err);
    console.error('[email-worker] Failed to create transporter:', err);
    transporter = null;
    return null;
  }
}

/**
 * Get the from address for emails
 */
async function getFromAddress(): Promise<string> {
  try {
    const [settings] = await q<Array<{ fromEmail: string | null; fromName: string | null }>>(
      'SELECT fromEmail, fromName FROM email_settings WHERE id = 1',
    );

    if (settings?.fromEmail) {
      const name = settings.fromName || 'HabiTrack';
      return `${name} <${settings.fromEmail}>`;
    }
  } catch {
    // Ignore errors, use fallback
  }

  return SMTP_FROM || 'HabiTrack <no-reply@localhost>';
}

/**
 * Send a single email
 */
async function sendEmail(
  row: {
    id: number;
    userId: number | null;
    to_email: string;
    subject: string;
    body_text: string | null;
    body_html: string | null;
  },
  transport: nodemailer.Transporter,
): Promise<{ success: boolean; error?: string; previewUrl?: string }> {
  // Check rate limit before sending
  if (row.userId) {
    const rateCheck = await checkEmailRateLimit(row.userId);
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: `Rate limited: ${rateCheck.reason}. Retry after ${rateCheck.retryAfter}s`,
      };
    }
  }

  const from = await getFromAddress();

  try {
    const info = (await transport.sendMail({
      from,
      to: row.to_email,
      subject: row.subject,
      text: row.body_text || undefined,
      html: row.body_html || undefined,
    })) as SMTPTransport.SentMessageInfo;

    // In development, get Ethereal preview URL
    let previewUrl: string | undefined;
    if (HABITRACK_ENV !== 'production' && !SMTP_HOST) {
      previewUrl = nodemailer.getTestMessageUrl(info as any) || undefined;
    }

    return { success: true, previewUrl };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Process the email outbox queue
 */
async function processOutbox(): Promise<void> {
  const transport = await getTransporter();

  if (!transport) {
    // No transport available - skip this cycle
    // Emails will stay in outbox until SMTP is configured
    return;
  }

  try {
    // Get pending emails that haven't exceeded max attempts
    const rows = await q<
      Array<{
        id: number;
        userId: number | null;
        to_email: string;
        subject: string;
        body_text: string | null;
        body_html: string | null;
        attempts: number;
      }>
    >(
      `SELECT id, userId, to_email, subject, body_text, body_html, attempts
       FROM notifications_outbox
       WHERE sentAt IS NULL
         AND (scheduledAt IS NULL OR scheduledAt <= NOW(3))
         AND attempts < ?
       ORDER BY id ASC
       LIMIT ?`,
      [MAX_ATTEMPTS, BATCH_SIZE],
    );

    if (rows.length === 0) return;

    console.log(`[email-worker] Processing ${rows.length} pending emails`);

    for (const row of rows) {
      const result = await sendEmail(row, transport);

      if (result.success) {
        await q('UPDATE notifications_outbox SET sentAt = NOW(3) WHERE id = ?', [row.id]);
        console.log(`[email-worker] Sent email ${row.id} to ${row.to_email}`);

        if (result.previewUrl) {
          console.log(`[email-worker] Preview URL: ${result.previewUrl}`);
        }
      } else {
        await q(
          'UPDATE notifications_outbox SET attempts = attempts + 1, last_error = ? WHERE id = ?',
          [result.error, row.id],
        );

        if (row.attempts + 1 >= MAX_ATTEMPTS) {
          console.error(
            `[email-worker] Email ${row.id} failed permanently after ${MAX_ATTEMPTS} attempts: ${result.error}`,
          );
        } else {
          console.warn(
            `[email-worker] Email ${row.id} failed (attempt ${row.attempts + 1}): ${result.error}`,
          );
        }
      }
    }
  } catch (err) {
    console.error('[email-worker] Error processing outbox:', err);
  }
}

/**
 * Check for failed emails and mark them appropriately
 */
async function cleanupFailedEmails(): Promise<void> {
  try {
    // Mark emails that exceeded max attempts as permanently failed
    const result = await q<any>(
      `UPDATE notifications_outbox
       SET last_error = CONCAT(IFNULL(last_error, ''), ' [FAILED_PERMANENTLY]')
       WHERE sentAt IS NULL AND attempts >= ?`,
      [MAX_ATTEMPTS],
    );

    if (result.affectedRows > 0) {
      console.log(`[email-worker] Marked ${result.affectedRows} emails as permanently failed`);
    }
  } catch (err) {
    console.error('[email-worker] Error cleaning up failed emails:', err);
  }
}

/**
 * Get worker status for monitoring
 */
export function getWorkerStatus(): {
  running: boolean;
  transportReady: boolean;
  lastError: string | null;
} {
  return {
    running: true,
    transportReady: transporter !== null,
    lastError: lastTransportError,
  };
}

// Start the worker
console.log('[email-worker] Starting notification worker');
setInterval(processOutbox, PROCESS_INTERVAL);

// Run cleanup every 5 minutes
setInterval(cleanupFailedEmails, 5 * 60 * 1000);

// Initial run
processOutbox();
