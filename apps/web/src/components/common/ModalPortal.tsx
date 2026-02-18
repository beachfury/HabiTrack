// apps/web/src/components/common/ModalPortal.tsx
// Portal-based modal that renders to document.body for proper positioning
// This ensures modals are always centered regardless of parent element styles

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalPortalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Optional title for the modal header - can be string or ReactNode */
  title?: ReactNode;
  /** Size preset for the modal width */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Whether to show the X close button */
  showCloseButton?: boolean;
  /** Whether clicking the backdrop closes the modal */
  closeOnBackdrop?: boolean;
  /** Optional footer content */
  footer?: ReactNode;
  /** Additional classes for the modal container */
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-[calc(100vw-2rem)] sm:max-w-sm',
  md: 'max-w-[calc(100vw-2rem)] sm:max-w-md',
  lg: 'max-w-[calc(100vw-2rem)] sm:max-w-lg',
  xl: 'max-w-[calc(100vw-2rem)] sm:max-w-xl',
  full: 'max-w-[calc(100vw-2rem)] sm:max-w-4xl',
};

export function ModalPortal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  footer,
  className = '',
}: ModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  // Ensure we only render portal on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        // Ensure proper positioning regardless of any parent transforms
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col rounded-2xl shadow-xl ${className}`}
        style={{
          backgroundColor: 'var(--color-card, #ffffff)',
          color: 'var(--color-card-foreground, #1f2937)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title && typeof title === 'string' ? 'modal-title' : undefined}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className="flex items-center justify-between p-4 flex-shrink-0"
            style={{
              borderBottom: '1px solid var(--color-border, #e5e7eb)',
            }}
          >
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-semibold"
                style={{ color: 'var(--color-foreground, #1f2937)' }}
              >
                {title}
              </h2>
            )}
            {!title && <div />}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Close modal"
              >
                <X size={20} style={{ color: 'var(--color-muted-foreground, #6b7280)' }} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div
            className="p-4 flex-shrink-0"
            style={{
              borderTop: '1px solid var(--color-border, #e5e7eb)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Use portal to render to document.body
  return createPortal(modalContent, document.body);
}

// Convenience wrapper for modal body content with padding
export function ModalBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

// Convenience wrapper for modal footer with standard styling
export function ModalFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex gap-2 justify-end ${className}`}>{children}</div>;
}
