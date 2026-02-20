// apps/web/src/hooks/useDayRollover.ts
// Detects midnight crossover and reloads the page to refresh stale data.
// Critical for wall-mounted kiosk displays that run 24/7.

import { useEffect, useRef } from 'react';

/**
 * Hook that monitors for day changes and triggers a page reload at midnight.
 *
 * Strategy: Calculate the exact milliseconds until the next midnight,
 * set a timeout for that moment, then reload. Also includes a 1-minute
 * interval fallback check in case the browser suspends the timeout
 * (common on mobile/sleeping tabs).
 */
export function useDayRollover() {
  const currentDateRef = useRef<string>(new Date().toDateString());

  useEffect(() => {
    // Calculate ms until next midnight
    const getMsUntilMidnight = (): number => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0); // next midnight
      return midnight.getTime() - now.getTime();
    };

    // Fallback: check every 60 seconds if the date changed
    // Catches cases where the browser suspended the timeout (sleep, background tab)
    const fallbackInterval = setInterval(() => {
      const today = new Date().toDateString();
      if (today !== currentDateRef.current) {
        console.log('[day-rollover] Date changed (fallback check), reloading...');
        window.location.reload();
      }
    }, 60 * 1000);

    // Primary: precise timeout at midnight
    const msUntilMidnight = getMsUntilMidnight();
    console.log(`[day-rollover] Next reload in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);

    const midnightTimeout = setTimeout(() => {
      console.log('[day-rollover] Midnight reached, reloading...');
      window.location.reload();
    }, msUntilMidnight + 1000); // +1 second buffer to ensure we're past midnight

    return () => {
      clearTimeout(midnightTimeout);
      clearInterval(fallbackInterval);
    };
  }, []);
}
