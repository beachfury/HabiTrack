// apps/web/src/components/common/Badge.tsx
// Uses CSS color variables with color-mix() for themed badge colors
import { ReactNode, CSSProperties } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

// CSS variable mapping for each variant
const variantColorVar: Record<BadgeVariant, string> = {
  default: '--color-muted-foreground',
  success: '--color-success',
  warning: '--color-warning',
  error: '--color-destructive',
  info: '--color-primary',
  purple: '--color-accent',
};

function getVariantStyle(variant: BadgeVariant): CSSProperties {
  if (variant === 'default') {
    return {
      backgroundColor: 'var(--color-muted)',
      color: 'var(--color-muted-foreground)',
    };
  }
  const colorVar = variantColorVar[variant];
  return {
    backgroundColor: `color-mix(in srgb, var(${colorVar}) 15%, transparent)`,
    color: `var(${colorVar})`,
  };
}

function getDotColor(variant: BadgeVariant): string {
  const colorVar = variantColorVar[variant];
  return `var(${colorVar})`;
}

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
        ${sizeClasses[size]}
        ${className}
      `}
      style={getVariantStyle(variant)}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: getDotColor(variant) }}
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
        ${className}
      `}
      style={getVariantStyle(variant)}
    >
      {count > max ? `${max}+` : count}
    </span>
  );
}
