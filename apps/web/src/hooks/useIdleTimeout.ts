// apps/web/src/hooks/useIdleTimeout.ts
// Auto-logout for sessions after inactivity
// Used for both kiosk sessions (15 min) and regular sessions (30 min)
// SECURITY: Prevents unauthorized access if device is left unattended

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

// Default idle timeout: 15 minutes
const DEFAULT_IDLE_TIMEOUT_MS = 15 * 60 * 1000;

// Default warning shown before auto-logout: 1 minute
const DEFAULT_WARNING_BEFORE_MS = 60 * 1000;

interface UseIdleTimeoutOptions {
  /** Timeout in milliseconds before auto-logout (default: 15 minutes) */
  timeoutMs?: number;
  /** Warning period in milliseconds before logout (default: 60 seconds) */
  warningMs?: number;
  /** Callback when warning should be shown */
  onWarning?: (secondsRemaining: number) => void;
  /** Callback when auto-logout occurs */
  onLogout?: () => void;
  /** Whether the feature is enabled */
  enabled?: boolean;
}

/**
 * Hook that monitors user activity and auto-logs out after inactivity.
 *
 * Usage:
 * ```tsx
 * useIdleTimeout({
 *   enabled: true,
 *   timeoutMs: 30 * 60 * 1000, // 30 minutes
 *   onWarning: (seconds) => setShowWarning(true),
 *   onLogout: () => navigate('/login'),
 * });
 * ```
 */
export function useIdleTimeout(options: UseIdleTimeoutOptions = {}) {
  const {
    timeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
    warningMs = DEFAULT_WARNING_BEFORE_MS,
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

    // Set warning timer
    const warningDelay = timeoutMs - warningMs;
    if (warningDelay > 0 && onWarning) {
      warningRef.current = setTimeout(() => {
        onWarning(warningMs / 1000);
      }, warningDelay);
    }

    // Set logout timer
    timeoutRef.current = setTimeout(async () => {
      console.log('[idle-timeout] Auto-logout due to inactivity');
      try {
        await logout();
        onLogout?.();
      } catch (err) {
        console.error('[idle-timeout] Logout failed:', err);
        // Force redirect anyway for security
        onLogout?.();
      }
    }, timeoutMs);
  }, [enabled, timeoutMs, warningMs, onWarning, onLogout, logout]);

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

/** @deprecated Use useIdleTimeout instead */
export const useKioskIdleTimeout = useIdleTimeout;

export default useIdleTimeout;
