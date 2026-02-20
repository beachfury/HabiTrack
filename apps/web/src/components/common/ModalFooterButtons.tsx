// apps/web/src/components/common/ModalFooterButtons.tsx
// Standardized cancel/submit footer for modals
// Replaces 25+ hand-rolled button pairs across the app
import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ModalFooterButtonsProps {
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Called when submit is clicked (if no form ID) */
  onSubmit?: () => void;
  /** Text for submit button (default: "Save") */
  submitText?: string;
  /** Text shown while submitting (default: "Saving...") */
  submittingText?: string;
  /** Text for cancel button (default: "Cancel") */
  cancelText?: string;
  /** Whether the form is currently submitting */
  submitting?: boolean;
  /** Whether the submit button should be disabled */
  submitDisabled?: boolean;
  /** Form ID for type="submit" (ties button to a <form> element) */
  formId?: string;
  /** Visual variant for submit button */
  submitVariant?: 'primary' | 'danger' | 'success' | 'warning';
  /** Hide the cancel button */
  hideCancel?: boolean;
  /** Extra content on the left side (e.g., delete button) */
  leftActions?: ReactNode;
  /** Additional className for the container */
  className?: string;
}

export function ModalFooterButtons({
  onCancel,
  onSubmit,
  submitText = 'Save',
  submittingText,
  cancelText = 'Cancel',
  submitting = false,
  submitDisabled = false,
  formId,
  submitVariant = 'primary',
  hideCancel = false,
  leftActions,
  className = '',
}: ModalFooterButtonsProps) {
  const variantColors: Record<string, { bg: string; fg: string }> = {
    primary: { bg: 'var(--color-primary)', fg: 'var(--color-primary-foreground)' },
    danger: { bg: 'var(--color-destructive)', fg: 'var(--color-destructive-foreground)' },
    success: { bg: 'var(--color-success)', fg: 'var(--color-success-foreground)' },
    warning: { bg: 'var(--color-warning)', fg: 'var(--color-warning-foreground)' },
  };
  const { bg: submitBg, fg: submitColor } = variantColors[submitVariant] || variantColors.primary;

  const loadingText = submittingText || `${submitText.replace(/\.+$/, '')}...`;

  return (
    <div className={`flex items-center gap-2 ${leftActions ? 'justify-between' : ''} ${className}`}>
      {/* Left side actions (e.g. delete button) */}
      {leftActions && <div className="flex-shrink-0">{leftActions}</div>}

      {/* Right side: cancel + submit */}
      <div className={`flex gap-2 ${leftActions ? '' : 'flex-1'}`}>
        {!hideCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 py-2 font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{
              background: 'var(--color-muted)',
              color: 'var(--color-muted-foreground)',
              borderRadius: 'var(--btn-secondary-radius)',
            }}
          >
            {cancelText}
          </button>
        )}
        <button
          type={formId ? 'submit' : 'button'}
          form={formId}
          onClick={!formId ? onSubmit : undefined}
          disabled={submitting || submitDisabled}
          className="flex-1 py-2 font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            background: submitBg,
            color: submitColor,
            borderRadius: 'var(--btn-primary-radius)',
          }}
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? loadingText : submitText}
        </button>
      </div>
    </div>
  );
}
