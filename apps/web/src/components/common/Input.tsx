// apps/web/src/components/common/Input.tsx
// Uses .themed-input CSS class (customizable via theme editor)
// Labels, errors, and help text use CSS color variables
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  helpText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, iconPosition = 'left', helpText, className = '', style, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--color-foreground)' }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && iconPosition === 'left' && (
            <Icon
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-muted-foreground)' }}
            />
          )}
          <input
            ref={ref}
            className={`
              themed-input w-full
              disabled:opacity-50 disabled:cursor-not-allowed
              ${Icon && iconPosition === 'left' ? 'pl-10' : ''}
              ${Icon && iconPosition === 'right' ? 'pr-10' : ''}
              ${className}
            `}
            style={{
              ...(error ? {
                borderColor: 'var(--color-destructive)',
              } : {}),
              ...style,
            }}
            {...props}
          />
          {Icon && iconPosition === 'right' && (
            <Icon
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-muted-foreground)' }}
            />
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm" style={{ color: 'var(--color-destructive)' }}>{error}</p>
        )}
        {helpText && !error && (
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{helpText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea component
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helpText, className = '', style, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--color-foreground)' }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            themed-input w-full resize-none
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          style={{
            ...(error ? {
              borderColor: 'var(--color-destructive)',
            } : {}),
            ...style,
          }}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm" style={{ color: 'var(--color-destructive)' }}>{error}</p>
        )}
        {helpText && !error && (
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{helpText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Select component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', style, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--color-foreground)' }}
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            themed-input w-full
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          style={{
            ...(error ? {
              borderColor: 'var(--color-destructive)',
            } : {}),
            ...style,
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm" style={{ color: 'var(--color-destructive)' }}>{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
