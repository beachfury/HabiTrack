// apps/web/src/components/ErrorBoundary.tsx
// React Error Boundary component for catching and reporting errors

import { Component, ReactNode } from 'react';
import { reportReactError } from '../utils/errorReporter';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: { componentStack?: string }) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack?: string } | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
    // Report to backend debug logging
    reportReactError(error, errorInfo);

    // Store error info for display
    this.setState({ errorInfo });

    // Call optional onError callback
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[var(--color-muted)]/50 rounded-xl p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-destructive)]/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-[var(--color-destructive)]" />
            </div>

            <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
              Something went wrong
            </h2>

            <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
              An unexpected error occurred. The error has been automatically reported.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-4 p-3 bg-[var(--color-destructive)]/10 rounded-lg text-left">
                <p className="text-xs font-mono text-[var(--color-destructive)] break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="themed-btn-secondary text-sm flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Try Again
              </button>

              <button
                onClick={this.handleGoHome}
                className="themed-btn-primary text-sm flex items-center gap-2"
              >
                <Home size={16} />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Compact error boundary for smaller components
export class CompactErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
    reportReactError(error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/30 rounded-lg">
          <div className="flex items-center gap-2 text-[var(--color-destructive)]">
            <AlertTriangle size={16} />
            <span className="text-sm font-medium">Failed to load</span>
            <button
              onClick={this.handleRetry}
              className="ml-auto text-xs hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
