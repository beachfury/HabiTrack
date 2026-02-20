// apps/web/src/components/common/Card.tsx
// Uses .themed-card CSS class (customizable via theme editor)
// Card padding can be overridden via the `padding` prop
import { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

const paddingValues: Record<string, string> = {
  none: '0',
  sm: '12px',
  md: '16px',
  lg: '24px',
};

export function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick,
  style,
}: CardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`
        themed-card
        ${hover ? 'hover:shadow-md transition-all cursor-pointer' : ''}
        ${onClick ? 'text-left w-full' : ''}
        ${className}
      `}
      style={{
        padding: paddingValues[padding],
        ...style,
      }}
    >
      {children}
    </Component>
  );
}

// Card header
export function CardHeader({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between pb-3 mb-3 ${className}`}
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      {children}
    </div>
  );
}

// Card title
export function CardTitle({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={`font-semibold ${className}`}
      style={{ color: 'var(--color-foreground)' }}
    >
      {children}
    </h3>
  );
}

// Card content
export function CardContent({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

// Card footer
export function CardFooter({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-end gap-2 pt-3 mt-3 ${className}`}
      style={{ borderTop: '1px solid var(--color-border)' }}
    >
      {children}
    </div>
  );
}
