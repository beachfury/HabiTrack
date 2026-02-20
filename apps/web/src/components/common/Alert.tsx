// apps/web/src/components/common/Alert.tsx
// Uses CSS color variables with color-mix() for themed alert backgrounds
import { ReactNode, CSSProperties } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  variant: AlertVariant;
  children: ReactNode;
  title?: string;
  onClose?: () => void;
  className?: string;
}

// CSS variable mapping for each variant
const variantColorVar: Record<AlertVariant, string> = {
  success: '--color-success',
  error: '--color-destructive',
  warning: '--color-warning',
  info: '--color-primary',
};

function getVariantStyle(variant: AlertVariant): CSSProperties {
  const colorVar = variantColorVar[variant];
  return {
    backgroundColor: `color-mix(in srgb, var(${colorVar}) 10%, transparent)`,
    borderColor: `color-mix(in srgb, var(${colorVar}) 30%, transparent)`,
    color: `var(${colorVar})`,
  };
}

const iconMap: Record<AlertVariant, typeof AlertCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export function Alert({ variant, children, title, onClose, className = '' }: AlertProps) {
  const Icon = iconMap[variant];

  return (
    <div
      className={`
        flex items-start gap-3 p-4 border
        ${className}
      `}
      style={{
        ...getVariantStyle(variant),
        borderRadius: 'var(--radius-lg)',
      }}
      role="alert"
    >
      <Icon size={20} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && <p className="font-medium mb-1">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// Toast-style notification (positioned fixed)
export function Toast({
  variant,
  message,
  onClose,
  duration = 5000,
}: {
  variant: AlertVariant;
  message: string;
  onClose: () => void;
  duration?: number;
}) {
  // Auto-close after duration
  if (duration > 0) {
    setTimeout(onClose, duration);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-slide-up">
      <Alert variant={variant} onClose={onClose}>
        {message}
      </Alert>
    </div>
  );
}
