// apps/web/src/components/themes/PreviewPages/ModalPreview.tsx
// Preview component for modals in theme editor

import { useState } from 'react';
import { X, AlertTriangle, Check, Trash2 } from 'lucide-react';
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

  // Get modal element style
  const modalStyle = theme.elementStyles?.modal || {};
  const inputStyle = theme.elementStyles?.input || {};
  const btnPrimaryStyle = theme.elementStyles?.['button-primary'] || {};
  const btnSecondaryStyle = theme.elementStyles?.['button-secondary'] || {};

  // Page background
  const pageStyle: React.CSSProperties = {
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    position: 'relative',
  };

  // Modal backdrop
  const backdropStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  };

  // Modal container
  const modalContainerStyle: React.CSSProperties = {
    position: 'relative',
    backgroundColor: modalStyle.backgroundColor || colors.card,
    borderRadius: modalStyle.borderRadius !== undefined ? `${modalStyle.borderRadius}px` : '16px',
    boxShadow: modalStyle.boxShadow || '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    border: modalStyle.borderWidth ? `${modalStyle.borderWidth}px solid ${modalStyle.borderColor || colors.border}` : undefined,
    maxWidth: '320px',
    width: '100%',
    overflow: 'hidden',
  };

  // Modal header
  const headerStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    borderBottom: `1px solid ${colors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  // Modal body
  const bodyStyle: React.CSSProperties = {
    padding: '1rem',
  };

  // Modal footer
  const footerStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    borderTop: `1px solid ${colors.border}`,
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
  };

  // Input style
  const inputFieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: inputStyle.borderRadius !== undefined ? `${inputStyle.borderRadius}px` : '8px',
    border: `1px solid ${inputStyle.borderColor || colors.border}`,
    backgroundColor: inputStyle.backgroundColor || colors.background,
    color: inputStyle.textColor || colors.foreground,
    fontSize: '0.875rem',
  };

  // Button styles
  const primaryBtnStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    borderRadius: btnPrimaryStyle.borderRadius !== undefined ? `${btnPrimaryStyle.borderRadius}px` : '8px',
    backgroundColor: btnPrimaryStyle.backgroundColor || colors.primary,
    color: btnPrimaryStyle.textColor || colors.primaryForeground,
    fontWeight: 500,
    fontSize: '0.875rem',
    border: 'none',
    cursor: 'pointer',
  };

  const secondaryBtnStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    borderRadius: btnSecondaryStyle.borderRadius !== undefined ? `${btnSecondaryStyle.borderRadius}px` : '8px',
    backgroundColor: btnSecondaryStyle.backgroundColor || colors.muted,
    color: btnSecondaryStyle.textColor || colors.mutedForeground,
    fontWeight: 500,
    fontSize: '0.875rem',
    border: 'none',
    cursor: 'pointer',
  };

  const destructiveBtnStyle: React.CSSProperties = {
    ...primaryBtnStyle,
    backgroundColor: colors.destructive,
    color: colors.destructiveForeground,
  };

  return (
    <div style={pageStyle}>
      {/* Backdrop */}
      <div style={backdropStyle} />

      {/* Modal */}
      <ClickableElement
        element="modal"
        isSelected={selectedElement === 'modal'}
        onClick={() => onSelectElement('modal')}
        style={modalContainerStyle}
      >
        {/* Form Modal */}
        {activeModal === 'form' && (
          <>
            <div style={headerStyle}>
              <span style={{ fontWeight: 600, color: colors.foreground }}>Add New Item</span>
              <button style={{ color: colors.mutedForeground }}>
                <X size={18} />
              </button>
            </div>
            <div style={bodyStyle}>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: colors.foreground }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Milk"
                    style={inputFieldStyle}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: colors.foreground }}>
                    Category
                  </label>
                  <select style={inputFieldStyle}>
                    <option>Dairy</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={footerStyle}>
              <button style={secondaryBtnStyle}>Cancel</button>
              <button style={primaryBtnStyle}>Add Item</button>
            </div>
          </>
        )}

        {/* Confirmation Modal */}
        {activeModal === 'confirm' && (
          <>
            <div style={headerStyle}>
              <span style={{ fontWeight: 600, color: colors.foreground }}>Delete Item?</span>
              <button style={{ color: colors.mutedForeground }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ ...bodyStyle, textAlign: 'center' }}>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: `${colors.destructive}20` }}
              >
                <Trash2 size={24} style={{ color: colors.destructive }} />
              </div>
              <p className="text-sm" style={{ color: colors.foreground }}>
                Are you sure you want to delete "Milk"?
              </p>
              <p className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
                This action cannot be undone.
              </p>
            </div>
            <div style={footerStyle}>
              <button style={secondaryBtnStyle}>Cancel</button>
              <button style={destructiveBtnStyle}>Delete</button>
            </div>
          </>
        )}

        {/* Info/Success Modal */}
        {activeModal === 'info' && (
          <>
            <div style={headerStyle}>
              <span style={{ fontWeight: 600, color: colors.foreground }}>Success!</span>
              <button style={{ color: colors.mutedForeground }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ ...bodyStyle, textAlign: 'center' }}>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: `${colors.success}20` }}
              >
                <Check size={24} style={{ color: colors.success }} />
              </div>
              <p className="text-sm" style={{ color: colors.foreground }}>
                Your changes have been saved successfully.
              </p>
            </div>
            <div style={{ ...footerStyle, justifyContent: 'center' }}>
              <button style={primaryBtnStyle}>Got it</button>
            </div>
          </>
        )}
      </ClickableElement>

      {/* Modal type selector */}
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
