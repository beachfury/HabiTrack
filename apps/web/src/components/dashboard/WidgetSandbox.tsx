// apps/web/src/components/dashboard/WidgetSandbox.tsx
// Error boundary that wraps each widget to prevent one broken widget from crashing the dashboard

import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  widgetId: string;
  widgetName?: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WidgetSandbox extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error(`[WidgetSandbox] ${this.props.widgetId} crashed:`, error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-4 text-center">
          <AlertTriangle size={24} className="text-[var(--color-warning)] mb-2" />
          <p className="text-sm font-medium text-[var(--color-foreground)]">
            {this.props.widgetName || this.props.widgetId} encountered an error
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1 max-w-[200px] truncate">
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={this.handleRetry}
            className="mt-3 text-xs px-3 py-1 rounded-[var(--radius-md)] bg-[var(--color-muted)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/80 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
