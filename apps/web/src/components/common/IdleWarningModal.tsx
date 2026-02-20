// apps/web/src/components/common/IdleWarningModal.tsx
// "Are you still there?" modal with live countdown timer.
// Used for both regular and kiosk idle timeout warnings.
// Intentionally does NOT use ModalPortal — no escape-to-close for security.

import { useState, useEffect, useRef, useCallback } from 'react';

interface IdleWarningModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Initial countdown seconds when the warning first appears */
  initialSeconds: number;
  /** Called when the user dismisses the warning */
  onDismiss: () => void;
  /** Called when the countdown reaches zero */
  onTimeout: () => void;
  /** Session type determines the messaging */
  sessionType: 'regular' | 'kiosk';
}

export function IdleWarningModal({
  isOpen,
  initialSeconds,
  onDismiss,
  onTimeout,
  sessionType,
}: IdleWarningModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeoutRef = useRef(onTimeout);

  // Keep onTimeout ref fresh to avoid stale closures
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  // Reset countdown when modal opens
  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(initialSeconds);
    }
  }, [isOpen, initialSeconds]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onTimeoutRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const timeoutAction =
    sessionType === 'kiosk' ? 'returned to the PIN screen' : 'logged out';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--color-card)] rounded-lg p-6 max-w-md mx-4 text-center shadow-xl">
        <div className="text-4xl mb-4">&#x23F0;</div>
        <h2 className="text-xl font-bold text-[var(--color-foreground)] mb-2">
          Still there?
        </h2>
        <p className="text-[var(--color-muted-foreground)] mb-1">
          You'll be {timeoutAction} in
        </p>
        <p className="text-3xl font-mono font-bold text-[var(--color-primary)] mb-4">
          {secondsLeft}s
        </p>
        <button
          onClick={onDismiss}
          className="px-6 py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg hover:opacity-90 transition-opacity"
        >
          I'm still here
        </button>
      </div>
    </div>
  );
}
