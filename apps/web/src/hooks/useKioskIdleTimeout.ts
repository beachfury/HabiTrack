// apps/web/src/hooks/useKioskIdleTimeout.ts
// Auto-logout for kiosk sessions after inactivity
// SECURITY: Prevents unauthorized access if kiosk is left unattended

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

// Default idle timeout for kiosk sessions: 15 minutes
const KIOSK_IDLE_TIMEOUT_MS = 15 * 60 * 1000;

// Warning shown 1 minute before auto-logout
const WARNING_BEFORE_LOGOUT_MS = 60 * 1000;

interface UseKioskIdleTimeoutOptions {
  /** Timeout in milliseconds before auto-logout (default: 15 minutes) */
  timeoutMs?: number;
  /** Callback when warning should be shown */
  onWarning?: (secondsRemaining: number) => void;
  /** Callback when auto-logout occurs */
  onLogout?: () => void;
  /** Whether the feature is enabled (e.g., only for kiosk sessions) */
  enabled?: boolean;
}

/**
 * Hook that monitors user activity and auto-logs out kiosk sessions after inactivity.
 *
 * Usage:
 * ```tsx
 * useKioskIdleTimeout({
 *   enabled: isKioskSession,
 *   onWarning: (seconds) => setShowWarning(true),
 *   onLogout: () => navigate('/kiosk'),
 * });
 * ```
 */
export function useKioskIdleTimeout(options: UseKioskIdleTimeoutOptions = {}) {
  const {
    timeoutMs = KIOSK_IDLE_TIMEOUT_MS,
    onWarning,
    onLogout,
    enabled = true,
  } = options;

  const { logout } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Reset the idle timer on user activity
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    if (!enabled) return;

    // Set warning timer (1 minute before logout)
    const warningDelay = timeoutMs - WARNING_BEFORE_LOGOUT_MS;
    if (warningDelay > 0 && onWarning) {
      warningRef.current = setTimeout(() => {
        onWarning(WARNING_BEFORE_LOGOUT_MS / 1000);
      }, warningDelay);
    }

    // Set logout timer
    timeoutRef.current = setTimeout(async () => {
      console.log('[kiosk-idle] Auto-logout due to inactivity');
      try {
        await logout();
        onLogout?.();
      } catch (err) {
        console.error('[kiosk-idle] Logout failed:', err);
        // Force redirect anyway for security
        onLogout?.();
      }
    }, timeoutMs);
  }, [enabled, timeoutMs, onWarning, onLogout, logout]);

  useEffect(() => {
    if (!enabled) return;

    // Activity events to monitor
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'touchmove',
      'click',
    ];

    // Throttle activity updates to avoid excessive timer resets
    let lastReset = 0;
    const THROTTLE_MS = 1000;

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastReset > THROTTLE_MS) {
        lastReset = now;
        resetTimer();
      }
    };

    // Attach event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timer setup
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [enabled, resetTimer]);

  return {
    /** Manually reset the idle timer (e.g., after dismissing warning) */
    resetTimer,
    /** Get time since last activity in ms */
    getIdleTime: () => Date.now() - lastActivityRef.current,
  };
}

export default useKioskIdleTimeout;
