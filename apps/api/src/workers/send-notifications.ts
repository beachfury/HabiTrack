// apps/api/src/workers/send-notifications.ts
import { q } from '../db';

async function loop() {
  const rows = await q<Array<any>>(
    `SELECT * FROM notifications_outbox
     WHERE sentAt IS NULL
     AND scheduledAt <= NOW(3)
     ORDER BY id ASC
     LIMIT 50`,
  );
  for (const r of rows) {
    try {
      // DEV: “send” by logging
      console.log('[notify.send] sending:', { id: r.id, to: r.to_email, subject: r.subject });
      await q('UPDATE notifications_outbox SET sentAt = NOW(3) WHERE id = ?', [r.id]);
    } catch (e) {
      await q(
        'UPDATE notifications_outbox SET attempts = attempts + 1, last_error = ? WHERE id = ?',
        [String(e), r.id],
      );
    }
  }
}

setInterval(loop, 2000);
