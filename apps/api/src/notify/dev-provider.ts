// apps/api/src/notify/dev-provider.ts
import { q } from '../db';
import type { NotificationProvider, NotifyPayload } from './provider';

export const DevOutboxProvider: NotificationProvider = {
  async enqueue(m) {
    await q(
      `INSERT INTO notifications_outbox
        (kind, userId, to_email, subject, body_text, body_html)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [m.kind, m.userId, m.toEmail, m.subject, m.text ?? null, m.html ?? null],
    );
    console.log('[notify.dev] queued', { kind: m.kind, to: m.toEmail, subject: m.subject });
  },
};
