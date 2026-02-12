// apps/web/src/utils/errorReporter.ts
// Frontend error reporter that sends errors to the backend debug API

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';

interface ErrorReport {
  type: 'error' | 'unhandledrejection' | 'console' | 'react';
  message: string;
  stack?: string;
  url?: string;
  line?: number;
  column?: number;
  componentStack?: string;
  userAgent?: string;
  timestamp: string;
}

// Queue for batching errors
let errorQueue: ErrorReport[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

// Send errors to backend
async function flushErrors() {
  if (errorQueue.length === 0) return;

  const errors = [...errorQueue];
  errorQueue = [];
  flushTimer = null;

  try {
    await fetch(`${API_BASE}/api/debug/frontend-errors`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ errors }),
    });
  } catch {
    // Silently fail - don't cause more errors trying to report errors
  }
}

// Queue an error for reporting
function queueError(error: ErrorReport) {
  errorQueue.push(error);

  // Batch errors - flush after 2 seconds or when queue reaches 10
  if (errorQueue.length >= 10) {
    flushErrors();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flushErrors, 2000);
  }
}

// Report a JavaScript error
export function reportError(error: Error, context?: { componentStack?: string; type?: ErrorReport['type'] }) {
  queueError({
    type: context?.type || 'error',
    message: error.message,
    stack: error.stack,
    componentStack: context?.componentStack,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  });
}

// Initialize global error handlers
export function initErrorReporter() {
  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    queueError({
      type: 'error',
      message: event.message,
      stack: event.error?.stack,
      url: event.filename,
      line: event.lineno,
      column: event.colno,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    queueError({
      type: 'unhandledrejection',
      message: error?.message || String(error),
      stack: error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  });

  // Flush errors before page unload
  window.addEventListener('beforeunload', () => {
    if (errorQueue.length > 0) {
      // Use sendBeacon for reliability during page unload
      navigator.sendBeacon(
        `${API_BASE}/api/debug/frontend-errors`,
        JSON.stringify({ errors: errorQueue })
      );
    }
  });
}

// React Error Boundary helper
export function reportReactError(error: Error, errorInfo: { componentStack?: string }) {
  reportError(error, {
    type: 'react',
    componentStack: errorInfo.componentStack,
  });
}
