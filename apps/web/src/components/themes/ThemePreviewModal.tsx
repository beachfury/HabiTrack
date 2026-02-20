// components/themes/ThemePreviewModal.tsx
// Theme preview modal (full InteractivePreview) + static card mockup for the Store page

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Palette, Check } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../types/theme';
import { getTheme } from '../../api/themes';
import { ModalPortal, ModalBody } from '../common/ModalPortal';
import { InteractivePreview } from './InteractivePreview';

// ── ThemePreviewModal ───────────────────────────────────────────────────────

interface ThemePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeId: string | null;
  themeName: string;
  isActive: boolean;
  isApplying: boolean;
  onApply: (themeId: string) => void;
}

export function ThemePreviewModal({
  isOpen,
  onClose,
  themeId,
  themeName,
  isActive,
  isApplying,
  onApply,
}: ThemePreviewModalProps) {
  const [theme, setTheme] = useState<ExtendedTheme | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');

  // Fetch the full theme when modal opens
  useEffect(() => {
    if (!themeId || !isOpen) {
      setTheme(null);
      setError('');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    getTheme(themeId)
      .then((fetched) => {
        if (!cancelled) {
          setTheme(fetched as ExtendedTheme);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load theme');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [themeId, isOpen]);

  // No-op handlers for InteractivePreview (no click-to-edit in Store context)
  const handleSelectElement = useCallback((_el: ThemeableElement | null) => {}, []);

  if (!themeId) return null;

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title={`Preview: ${themeName}`}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-[var(--color-muted-foreground)] italic">
            Preview only — theme is not applied until you click Apply
          </span>
          <div className="flex items-center gap-2">
            {isActive ? (
              <span className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-[var(--color-success)] bg-[var(--color-success)]/10">
                <Check size={14} /> Active Theme
              </span>
            ) : (
              <button
                onClick={() => onApply(themeId)}
                disabled={isApplying}
                className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-[var(--color-primary-foreground,#fff)] bg-[var(--color-primary)] hover:brightness-110 transition-all disabled:opacity-50"
              >
                {isApplying ? <Loader2 size={14} className="animate-spin" /> : <Palette size={14} />}
                Apply Theme
              </button>
            )}
          </div>
        </div>
      }
    >
      <ModalBody>
        {loading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={24} className="animate-spin text-[var(--color-primary)]" />
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-64 text-[var(--color-destructive)]">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && theme && (
          <div style={{ minHeight: 400 }}>
            <InteractivePreview
              theme={theme}
              colorMode={colorMode}
              onColorModeChange={setColorMode}
              selectedElement={null}
              onSelectElement={handleSelectElement}
              isAdmin={false}
            />
          </div>
        )}
      </ModalBody>
    </ModalPortal>
  );
}

// ── ThemeCardMockup ─────────────────────────────────────────────────────────
// Small abstract visual mockup showing a miniature UI layout with the theme's colors

interface ThemeCardMockupProps {
  previewColors?: {
    primary: string;
    accent: string;
    background: string;
    card: string;
    foreground: string;
  };
}

export function ThemeCardMockup({ previewColors }: ThemeCardMockupProps) {
  const c = {
    primary: previewColors?.primary || '#3cb371',
    accent: previewColors?.accent || '#3cb371',
    background: previewColors?.background || '#f8f9fa',
    card: previewColors?.card || '#ffffff',
    foreground: previewColors?.foreground || '#3d4f5f',
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: c.background }}>
      {/* Mini layout: sidebar + content */}
      <div className="flex" style={{ height: 80 }}>
        {/* Sidebar strip */}
        <div className="w-5 flex-shrink-0 flex flex-col items-center gap-1.5 py-2" style={{ backgroundColor: c.primary }}>
          <div className="w-2 h-2 rounded-sm bg-white/60" />
          <div className="w-2 h-2 rounded-sm bg-white/30" />
          <div className="w-2 h-2 rounded-sm bg-white/30" />
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col p-1.5 gap-1">
          {/* Header bar */}
          <div className="h-3 rounded-sm flex items-center px-1 gap-1" style={{ backgroundColor: c.card, border: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="w-4 h-1 rounded-full" style={{ backgroundColor: c.foreground, opacity: 0.3 }} />
            <div className="ml-auto w-2 h-1 rounded-full" style={{ backgroundColor: c.primary, opacity: 0.6 }} />
          </div>

          {/* Content: two cards side by side */}
          <div className="flex-1 flex gap-1">
            {/* Left card - stats mockup */}
            <div className="flex-1 rounded-sm p-1 flex flex-col justify-end" style={{ backgroundColor: c.card, border: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="flex items-end gap-0.5 h-full">
                {[0.5, 0.8, 0.35, 0.65].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${h * 100}%`,
                      backgroundColor: i % 2 === 0 ? c.primary : c.accent,
                      opacity: 0.6 + i * 0.1,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Right card - list mockup */}
            <div className="flex-1 rounded-sm p-1 flex flex-col gap-0.5 justify-center" style={{ backgroundColor: c.card, border: '1px solid rgba(0,0,0,0.06)' }}>
              {[0.85, 0.6, 0.7].map((w, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full"
                  style={{
                    width: `${w * 100}%`,
                    backgroundColor: c.foreground,
                    opacity: 0.25 - i * 0.05,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Color palette dots */}
      <div className="flex items-center justify-center gap-1.5 py-1.5">
        {Object.entries(c).map(([key, color]) => (
          <div
            key={key}
            className="w-3.5 h-3.5 rounded-full border border-white/50"
            style={{ backgroundColor: color, boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }}
            title={key}
          />
        ))}
      </div>
    </div>
  );
}
