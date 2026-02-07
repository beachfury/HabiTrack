// apps/web/src/components/common/Card.tsx
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick,
}: CardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`
        bg-white dark:bg-gray-800 rounded-xl 
        border border-gray-100 dark:border-gray-700
        ${paddingClasses[padding]}
        ${hover ? 'hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all cursor-pointer' : ''}
        ${onClick ? 'text-left w-full' : ''}
        ${className}
      `}
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
      className={`flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700 ${className}`}
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
    <h3 className={`font-semibold text-gray-900 dark:text-white ${className}`}>
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
      className={`flex items-center justify-end gap-2 pt-3 mt-3 border-t border-gray-100 dark:border-gray-700 ${className}`}
    >
      {children}
    </div>
  );
}
