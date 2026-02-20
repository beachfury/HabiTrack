// apps/web/src/components/common/EmptyState.tsx
// Uses CSS color variables for themed empty state colors
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <Icon
        size={48}
        className="mb-4"
        strokeWidth={1.5}
        style={{ color: 'var(--color-muted-foreground)', opacity: 0.5 }}
      />
      <h3
        className="text-lg font-medium mb-2"
        style={{ color: 'var(--color-foreground)' }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="mb-4 max-w-sm"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// Compact empty state for inline use
export function EmptyStateInline({
  icon: Icon,
  message,
  action,
}: {
  icon: LucideIcon;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-center gap-3 py-8"
      style={{ color: 'var(--color-muted-foreground)' }}
    >
      <Icon size={20} />
      <span>{message}</span>
      {action}
    </div>
  );
}
