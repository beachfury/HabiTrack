// apps/web/src/components/common/ModalForm.tsx
// Reusable modal form component with common patterns (loading, error, success states)

import { useState, type ReactNode, type FormEvent } from 'react';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { ModalPortal, ModalBody } from './ModalPortal';

interface ModalFormProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Form submission handler - should return Promise */
  onSubmit: () => Promise<void>;
  /** Content to render in the form body */
  children: ReactNode;
  /** Text for the submit button */
  submitText?: string;
  /** Text for the cancel button */
  cancelText?: string;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Whether submit button should be disabled */
  submitDisabled?: boolean;
  /** Custom error message (overrides internal error state) */
  error?: string | null;
  /** Custom success message */
  successMessage?: string | null;
  /** Whether to show the cancel button */
  showCancel?: boolean;
  /** Additional actions to show in the footer */
  additionalActions?: ReactNode;
  /** Called after successful submission (after clearing loading state) */
  onSuccess?: () => void;
  /** Whether to close modal on successful submission */
  closeOnSuccess?: boolean;
  /** Delay before closing on success (ms) */
  closeDelay?: number;
  /** Variant for submit button */
  submitVariant?: 'primary' | 'danger';
}

export function ModalForm({
  isOpen,
  onClose,
  title,
  onSubmit,
  children,
  submitText = 'Save',
  cancelText = 'Cancel',
  size = 'md',
  submitDisabled = false,
  error: externalError,
  successMessage,
  showCancel = true,
  additionalActions,
  onSuccess,
  closeOnSuccess = true,
  closeDelay = 500,
  submitVariant = 'primary',
}: ModalFormProps) {
  const [loading, setLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const error = externalError ?? internalError;

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    setInternalError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await onSubmit();
      setSuccess(true);
      onSuccess?.();

      if (closeOnSuccess) {
        setTimeout(() => {
          onClose();
          // Reset state after closing
          setSuccess(false);
        }, closeDelay);
      }
    } catch (err: any) {
      setInternalError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setInternalError(null);
      setSuccess(false);
      onClose();
    }
  };

  const footer = (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        {additionalActions}
      </div>
      <div className="flex gap-2">
        {showCancel && (
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg
              bg-[var(--color-muted)] text-[var(--color-foreground)]
              hover:bg-[var(--color-muted)]/80 transition-colors
              disabled:opacity-50"
          >
            {cancelText}
          </button>
        )}
        <button
          type="submit"
          disabled={loading || submitDisabled}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
            disabled:opacity-50 flex items-center gap-2
            ${submitVariant === 'danger'
              ? 'bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] hover:bg-[var(--color-destructive)]/90'
              : 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary)]/90'
            }`}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {submitText}
        </button>
      </div>
    </div>
  );

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size={size}
      footer={footer}
      closeOnBackdrop={!loading}
    >
      <form onSubmit={handleSubmit}>
        <ModalBody>
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg flex items-start gap-2"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-destructive) 15%, transparent)',
                color: 'var(--color-destructive)',
              }}
            >
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Success message */}
          {success && successMessage && (
            <div className="mb-4 p-3 rounded-lg flex items-start gap-2"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
                color: 'var(--color-success)',
              }}
            >
              <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span className="text-sm">{successMessage}</span>
            </div>
          )}

          {/* Form content */}
          {children}
        </ModalBody>
      </form>
    </ModalPortal>
  );
}

// ============================================
// Helper Components for Form Fields
// ============================================

interface FormFieldProps {
  label: string;
  children: ReactNode;
  required?: boolean;
  hint?: string;
  error?: string;
}

export function FormField({ label, children, required, hint, error }: FormFieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">
        {label}
        {required && <span className="text-[var(--color-destructive)] ml-1">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-[var(--color-destructive)]">{error}</p>
      )}
    </div>
  );
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function FormInput({ error, className = '', ...props }: FormInputProps) {
  return (
    <input
      className={`w-full px-3 py-2 rounded-lg text-sm
        bg-[var(--color-background)] text-[var(--color-foreground)]
        border transition-colors
        placeholder:text-[var(--color-muted-foreground)]
        focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${error
          ? 'border-[var(--color-destructive)]'
          : 'border-[var(--color-border)] focus:border-[var(--color-primary)]'
        }
        ${className}`}
      {...props}
    />
  );
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function FormTextarea({ error, className = '', ...props }: FormTextareaProps) {
  return (
    <textarea
      className={`w-full px-3 py-2 rounded-lg text-sm
        bg-[var(--color-background)] text-[var(--color-foreground)]
        border transition-colors resize-none
        placeholder:text-[var(--color-muted-foreground)]
        focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${error
          ? 'border-[var(--color-destructive)]'
          : 'border-[var(--color-border)] focus:border-[var(--color-primary)]'
        }
        ${className}`}
      {...props}
    />
  );
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export function FormSelect({ error, className = '', children, ...props }: FormSelectProps) {
  return (
    <select
      className={`w-full px-3 py-2 rounded-lg text-sm
        bg-[var(--color-background)] text-[var(--color-foreground)]
        border transition-colors
        focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${error
          ? 'border-[var(--color-destructive)]'
          : 'border-[var(--color-border)] focus:border-[var(--color-primary)]'
        }
        ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

interface FormRowProps {
  children: ReactNode;
  columns?: 2 | 3;
}

export function FormRow({ children, columns = 2 }: FormRowProps) {
  return (
    <div className={`grid gap-4 ${columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {children}
    </div>
  );
}
