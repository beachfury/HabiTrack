// apps/api/src/janitor.ts
import { q } from './db';

export function startJanitor() {
  const run = () => q(`DELETE FROM sessions WHERE expires_at < NOW(3)`).catch(() => {});
  run(); // run once at boot
  return setInterval(run, 10 * 60 * 1000); // every 10 minutes
}
