// apps/web/src/components/common/PageHeader.tsx
// Standardized page header with icon, title, subtitle, and action buttons
// Responsive layout: stacks on mobile, row on desktop
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  /** Page title text */
  title: string;
  /** Optional Lucide icon shown before the title */
  icon?: LucideIcon;
  /** Optional subtitle/description below the title */
  subtitle?: string;
  /** Optional ReactNode subtitle — takes precedence over subtitle string */
  subtitleNode?: ReactNode;
  /** Action buttons rendered on the right side */
  actions?: ReactNode;
  /** Additional className for the container */
  className?: string;
  /** Bottom margin (default: 'md') */
  spacing?: 'sm' | 'md' | 'lg';
  /** Override h1 classes for themed titles (e.g. 'themed-home-title') */
  titleClassName?: string;
  /** Override icon color (default: 'var(--color-primary)') */
  iconColor?: string;
}

const spacingClasses = {
  sm: 'mb-4',
  md: 'mb-6',
  lg: 'mb-8',
};

export function PageHeader({
  title,
  icon: Icon,
  subtitle,
  subtitleNode,
  actions,
  className = '',
  spacing = 'md',
  titleClassName,
  iconColor,
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 ${spacingClasses[spacing]} ${className}`}
    >
      {/* Left: Icon + Title + Subtitle */}
      <div>
        <h1
          className={`flex items-center gap-3 ${titleClassName || 'text-2xl md:text-3xl font-bold'}`}
          style={titleClassName ? undefined : { color: 'var(--color-foreground)' }}
        >
          {Icon && (
            <Icon
              className="flex-shrink-0"
              style={{ color: iconColor || 'var(--color-primary)' }}
            />
          )}
          {title}
        </h1>
        {subtitleNode || (subtitle && (
          <p
            className="mt-1"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            {subtitle}
          </p>
        ))}
      </div>

      {/* Right: Actions */}
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
