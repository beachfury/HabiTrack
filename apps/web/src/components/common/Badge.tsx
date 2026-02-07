// apps/web/src/components/common/Badge.tsx
import { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-300',
  error: 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-300',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-sm',
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === 'success'
              ? 'bg-green-500'
              : variant === 'warning'
              ? 'bg-yellow-500'
              : variant === 'error'
              ? 'bg-red-500'
              : variant === 'info'
              ? 'bg-blue-500'
              : variant === 'purple'
              ? 'bg-purple-500'
              : 'bg-gray-500'
          }`}
        />
      )}
      {children}
    </span>
  );
}

// Count badge (for notifications, etc.)
export function CountBadge({
  count,
  max = 99,
  variant = 'error',
  className = '',
}: {
  count: number;
  max?: number;
  variant?: BadgeVariant;
  className?: string;
}) {
  if (count <= 0) return null;

  return (
    <span
      className={`
        inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 
        rounded-full text-xs font-bold
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {count > max ? `${max}+` : count}
    </span>
  );
}
