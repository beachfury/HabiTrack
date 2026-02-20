// apps/web/src/components/themes/PreviewPages/ModalPreview.tsx
// Preview component for modals in theme editor
// Uses .themed-* CSS classes — CSS variables are scoped by the preview container

import { useState } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';

interface ModalPreviewProps {
  theme: ExtendedTheme;
  colorMode: 'light' | 'dark';
  selectedElement: ThemeableElement | null;
  onSelectElement: (element: ThemeableElement) => void;
}

type ModalType = 'form' | 'confirm' | 'info';

export function ModalPreview({
  theme,
  colorMode,
  selectedElement,
  onSelectElement,
}: ModalPreviewProps) {
  const [activeModal, setActiveModal] = useState<ModalType>('form');
  const colors = colorMode === 'light' ? theme.colorsLight : theme.colorsDark;

  return (
    <div
      className="flex items-center justify-center p-4 relative"
      style={{
        backgroundColor: colors.background,
        width: '100%',
        height: '100%',
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} />

      {/* Modal */}
      <ClickableElement
        element="modal"
        isSelected={selectedElement === 'modal'}
        onClick={() => onSelectElement('modal')}
        className="themed-modal"
        style={{ maxWidth: '320px', width: '100%', overflow: 'hidden' }}
      >
        {/* Form Modal */}
        {activeModal === 'form' && (
          <>
            <div
              className="flex items-center justify-between"
              style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}
            >
              <span className="font-semibold" style={{ color: 'var(--color-foreground)' }}>Add New Item</span>
              <button style={{ color: 'var(--color-muted-foreground)' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '1rem' }}>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>
                    Name *
                  </label>
                  <ClickableElement
                    element="input"
                    isSelected={selectedElement === 'input'}
                    onClick={() => onSelectElement('input')}
                  >
                    <input
                      type="text"
                      placeholder="e.g., Milk"
                      className="themed-input w-full"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                      readOnly
                    />
                  </ClickableElement>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>
                    Category
                  </label>
                  <select
                    className="themed-input w-full"
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                  >
                    <option>Dairy</option>
                  </select>
                </div>
              </div>
            </div>
            <div
              className="flex gap-2 justify-end"
              style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-border)' }}
            >
              <ClickableElement
                element="button-secondary"
                isSelected={selectedElement === 'button-secondary'}
                onClick={() => onSelectElement('button-secondary')}
              >
                <button className="themed-btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                  Cancel
                </button>
              </ClickableElement>
              <ClickableElement
                element="button-primary"
                isSelected={selectedElement === 'button-primary'}
                onClick={() => onSelectElement('button-primary')}
              >
                <button className="themed-btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                  Add Item
                </button>
              </ClickableElement>
            </div>
          </>
        )}

        {/* Confirmation Modal */}
        {activeModal === 'confirm' && (
          <>
            <div
              className="flex items-center justify-between"
              style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}
            >
              <span className="font-semibold" style={{ color: 'var(--color-foreground)' }}>Delete Item?</span>
              <button style={{ color: 'var(--color-muted-foreground)' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '1rem', textAlign: 'center' }}>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: `${colors.destructive}20` }}
              >
                <Trash2 size={24} style={{ color: colors.destructive }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>
                Are you sure you want to delete "Milk"?
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
                This action cannot be undone.
              </p>
            </div>
            <div
              className="flex gap-2 justify-end"
              style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-border)' }}
            >
              <button className="themed-btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                Cancel
              </button>
              <button
                className="themed-btn-primary"
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  backgroundColor: colors.destructive,
                  color: colors.destructiveForeground,
                }}
              >
                Delete
              </button>
            </div>
          </>
        )}

        {/* Info/Success Modal */}
        {activeModal === 'info' && (
          <>
            <div
              className="flex items-center justify-between"
              style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}
            >
              <span className="font-semibold" style={{ color: 'var(--color-foreground)' }}>Success!</span>
              <button style={{ color: 'var(--color-muted-foreground)' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '1rem', textAlign: 'center' }}>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: `${colors.success}20` }}
              >
                <Check size={24} style={{ color: colors.success }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>
                Your changes have been saved successfully.
              </p>
            </div>
            <div
              className="flex gap-2 justify-center"
              style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-border)' }}
            >
              <button className="themed-btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                Got it
              </button>
            </div>
          </>
        )}
      </ClickableElement>

      {/* Modal type selector — editor chrome, intentionally hardcoded */}
      <div className="absolute bottom-2 right-2 flex gap-1 z-10">
        {(['form', 'confirm', 'info'] as ModalType[]).map((type) => (
          <button
            key={type}
            onClick={(e) => {
              e.stopPropagation();
              setActiveModal(type);
            }}
            className={`px-2 py-0.5 text-xs rounded capitalize transition-colors ${
              activeModal === type
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
}
