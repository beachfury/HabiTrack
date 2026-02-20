// apps/web/src/components/common/Spinner.tsx
// Uses CSS color variables for themed spinner colors
import { Loader2, RefreshCw } from 'lucide-react';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  variant?: 'default' | 'dots';
}

const sizeMap: Record<SpinnerSize, number> = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

export function Spinner({ size = 'md', className = '', variant = 'default' }: SpinnerProps) {
  if (variant === 'dots') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    );
  }

  return (
    <Loader2
      size={sizeMap[size]}
      className={`animate-spin ${className}`}
      style={{ color: 'var(--color-primary)' }}
    />
  );
}

// Full page loading state
export function PageLoader({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <RefreshCw
        size={32}
        className="animate-spin"
        style={{ color: 'var(--color-primary)' }}
      />
      {message && (
        <p style={{ color: 'var(--color-muted-foreground)' }}>{message}</p>
      )}
    </div>
  );
}

// Inline loading placeholder
export function LoadingPlaceholder({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded"
          style={{
            width: `${Math.random() * 40 + 60}%`,
            backgroundColor: 'var(--color-muted)',
          }}
        />
      ))}
    </div>
  );
}
