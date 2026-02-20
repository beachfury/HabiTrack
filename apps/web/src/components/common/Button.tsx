// apps/web/src/components/common/Button.tsx
// Uses themed CSS classes for primary/secondary (customizable via theme editor)
// and CSS variables for outline/ghost/danger variants
import { ReactNode, ButtonHTMLAttributes, CSSProperties } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children?: ReactNode;
}

// Themed variants use .themed-btn-* CSS classes (customizable in theme editor)
// Non-themed variants use CSS variable inline styles
const themedVariants: Partial<Record<ButtonVariant, string>> = {
  primary: 'themed-btn-primary',
  secondary: 'themed-btn-secondary',
};

// Inline styles for variants without themed CSS classes
const variantStyles: Partial<Record<ButtonVariant, CSSProperties>> = {
  outline: {
    background: 'transparent',
    color: 'var(--color-foreground)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--btn-secondary-radius)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-foreground)',
    border: '1px solid transparent',
    borderRadius: 'var(--btn-secondary-radius)',
  },
  danger: {
    background: 'var(--color-destructive)',
    color: 'var(--color-destructive-foreground)',
    border: '1px solid transparent',
    borderRadius: 'var(--btn-primary-radius)',
  },
};

// Hover classes for non-themed variants (CSS vars don't support :hover in inline styles)
const variantHoverClasses: Partial<Record<ButtonVariant, string>> = {
  outline: 'hover:bg-[var(--color-muted)]',
  ghost: 'hover:bg-[var(--color-muted)]',
  danger: 'hover:brightness-110',
};

// Size padding overrides (themed classes set default padding via CSS vars)
const sizePadding: Record<ButtonSize, string> = {
  sm: '6px 12px',
  md: '8px 16px',
  lg: '12px 24px',
};

const sizeFontClass: Record<ButtonSize, string> = {
  sm: 'text-sm',
  md: '',
  lg: 'text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  className = '',
  disabled,
  style,
  ...props
}: ButtonProps) {
  const themedClass = themedVariants[variant] || '';
  const inlineVarStyle = variantStyles[variant] || {};
  const hoverClass = variantHoverClasses[variant] || '';

  // Merge padding override + variant inline styles + any passed style
  const mergedStyle: CSSProperties = {
    ...inlineVarStyle,
    padding: sizePadding[size],
    ...style,
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        font-medium transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${themedClass}
        ${hoverClass}
        ${sizeFontClass[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      style={mergedStyle}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      ) : icon && iconPosition === 'left' ? (
        icon
      ) : null}
      {children}
      {!loading && icon && iconPosition === 'right' ? icon : null}
    </button>
  );
}

// Icon-only button
export function IconButton({
  variant = 'ghost',
  size = 'md',
  loading = false,
  icon,
  className = '',
  style,
  ...props
}: Omit<ButtonProps, 'children' | 'iconPosition' | 'fullWidth'> & { icon: ReactNode }) {
  const themedClass = themedVariants[variant] || '';
  const inlineVarStyle = variantStyles[variant] || {};
  const hoverClass = variantHoverClasses[variant] || '';

  const iconPadding: Record<ButtonSize, string> = {
    sm: '6px',
    md: '8px',
    lg: '12px',
  };

  const mergedStyle: CSSProperties = {
    ...inlineVarStyle,
    padding: iconPadding[size],
    ...style,
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center
        transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${themedClass}
        ${hoverClass}
        ${className}
      `}
      style={mergedStyle}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      ) : (
        icon
      )}
    </button>
  );
}
