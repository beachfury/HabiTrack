// apps/web/src/components/common/Alert.tsx
import { ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  variant: AlertVariant;
  children: ReactNode;
  title?: string;
  onClose?: () => void;
  className?: string;
}

const variantClasses: Record<AlertVariant, string> = {
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400',
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
};

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
        flex items-start gap-3 p-4 rounded-xl border
        ${variantClasses[variant]}
        ${className}
      `}
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
