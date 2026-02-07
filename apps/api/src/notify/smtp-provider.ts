// apps/api/src/notify/smtp-provider.ts
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { q } from '../db';
import type { NotificationProvider, NotifyPayload } from './provider';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  HABITRACK_ENV = 'development',
} = process.env;

async function makeTransport() {
  try {
    if (!SMTP_HOST && HABITRACK_ENV !== 'production') {
      // Ethereal fallback (dev only)
      const test = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: test.smtp.host,
        port: test.smtp.port,
        secure: test.smtp.secure,
        auth: { user: test.user, pass: test.pass },
      });
    }
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT ?? 587),
      secure: String(SMTP_SECURE ?? 'false').toLowerCase() === 'true',
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
  } catch (e) {
    console.error('[notify.smtp] makeTransport failed:', e);
    return null;
  }
}

export const SmtpOutboxProvider: NotificationProvider = {
  async enqueue(m: NotifyPayload) {
    // 1) Always write to outbox (audit/retry)
    const { insertId } = await q<any>(
      `INSERT INTO notifications_outbox
         (kind, userId, to_email, subject, body_text, body_html)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [m.kind, m.userId, m.toEmail ?? null, m.subject, m.text ?? null, m.html ?? null],
    );

    // 2) Best-effort send (never throw)
    const transporter = await makeTransport();
    if (!transporter) {
      await q(
        'UPDATE notifications_outbox SET attempts = attempts + 1, last_error = ? WHERE id = ?',
        ['No SMTP transport available', insertId],
      );
      return;
    }

    const from = SMTP_FROM || 'HabiTrack <no-reply@localhost>';
    const to = m.toEmail ?? undefined; // undefined is OK for nodemailer options

    try {
      const info = (await transporter.sendMail({
        from,
        to,
        subject: m.subject,
        text: m.text ?? undefined, // avoid null
        html: m.html ?? undefined, // avoid null
      })) as SMTPTransport.SentMessageInfo;

      await q('UPDATE notifications_outbox SET sentAt = NOW(3) WHERE id = ?', [insertId]);

      if (!SMTP_HOST && HABITRACK_ENV !== 'production') {
        const url = nodemailer.getTestMessageUrl(info as any);
        if (url) console.log('[notify.smtp] ethereal preview:', url);
      }
    } catch (err) {
      await q(
        'UPDATE notifications_outbox SET attempts = attempts + 1, last_error = ? WHERE id = ?',
        [String(err), insertId],
      );
    }
  },
};
