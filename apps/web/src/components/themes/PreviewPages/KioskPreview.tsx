// apps/web/src/components/themes/PreviewPages/KioskPreview.tsx
// Preview component for kiosk/PIN login page in theme editor

import { useState } from 'react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';

interface KioskPreviewProps {
  theme: ExtendedTheme;
  colorMode: 'light' | 'dark';
  selectedElement: ThemeableElement | null;
  onSelectElement: (element: ThemeableElement) => void;
}

// Sample users for preview
const SAMPLE_USERS = [
  { id: 1, name: 'Mom', color: '#ec4899', initial: 'M' },
  { id: 2, name: 'Dad', color: '#3b82f6', initial: 'D' },
  { id: 3, name: 'Emma', color: '#8b5cf6', initial: 'E' },
  { id: 4, name: 'Jake', color: '#22c55e', initial: 'J' },
];

export function KioskPreview({
  theme,
  selectedElement,
  onSelectElement,
}: KioskPreviewProps) {
  const [view, setView] = useState<'users' | 'pin'>('users');
  const [selectedUser, setSelectedUser] = useState(SAMPLE_USERS[2]); // Emma selected
  const [pinDots, setPinDots] = useState(3); // Show 3 dots filled

  // Get kiosk style from theme (dedicated kioskStyle field)
  const kioskStyle = theme.kioskStyle || {};

  // Build kiosk CSS variables
  const kioskVars = {
    '--kiosk-bg-gradient-from': kioskStyle.backgroundGradient?.from || '#8b5cf6',
    '--kiosk-bg-gradient-to': kioskStyle.backgroundGradient?.to || '#3b82f6',
    '--kiosk-text': kioskStyle.textColor || '#ffffff',
    '--kiosk-text-muted': kioskStyle.textMutedColor || 'rgba(255, 255, 255, 0.8)',
    '--kiosk-button-bg': kioskStyle.buttonBgColor || 'rgba(255, 255, 255, 0.2)',
    '--kiosk-button-hover': kioskStyle.buttonHoverColor || 'rgba(255, 255, 255, 0.3)',
    '--kiosk-accent': kioskStyle.accentColor || '#ffffff',
  } as React.CSSProperties;

  const pageStyle: React.CSSProperties = {
    ...kioskVars,
    width: '100%',
    height: '100%',
    background: `linear-gradient(to bottom right, var(--kiosk-bg-gradient-from), var(--kiosk-bg-gradient-to))`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    position: 'relative',
  };

  // User Selection View
  if (view === 'users') {
    return (
      <ClickableElement
        element="kiosk"
        isSelected={selectedElement === 'kiosk'}
        onClick={() => onSelectElement('kiosk')}
        style={pageStyle}
      >
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: 'var(--kiosk-text)' }}
        >
          Welcome!
        </h1>
        <p
          className="text-sm mb-4"
          style={{ color: 'var(--kiosk-text-muted)' }}
        >
          Who's checking in?
        </p>

        <div className="grid grid-cols-4 gap-2 max-w-full">
          {SAMPLE_USERS.map((user) => (
            <button
              key={user.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedUser(user);
                setView('pin');
              }}
              className="rounded-xl p-2 flex flex-col items-center gap-1 transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--kiosk-button-bg)' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: user.color,
                  color: 'var(--kiosk-text)',
                  border: '2px solid var(--kiosk-text-muted)',
                }}
              >
                {user.initial}
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--kiosk-text)' }}
              >
                {user.name}
              </span>
            </button>
          ))}
        </div>

        <p
          className="mt-4 text-xs underline"
          style={{ color: 'var(--kiosk-text-muted)' }}
        >
          Use email & password instead
        </p>

        {/* View toggle for preview */}
        <ViewToggle currentView={view} onViewChange={setView} />
      </ClickableElement>
    );
  }

  // PIN Entry View
  return (
    <ClickableElement
      element="kiosk"
      isSelected={selectedElement === 'kiosk'}
      onClick={() => onSelectElement('kiosk')}
      style={pageStyle}
    >
      {/* Back button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setView('users');
        }}
        className="absolute top-2 left-2 text-xs"
        style={{ color: 'var(--kiosk-text-muted)' }}
      >
        ← Back
      </button>

      {/* User avatar */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-2"
        style={{
          backgroundColor: selectedUser.color,
          color: 'var(--kiosk-text)',
          border: '2px solid var(--kiosk-text-muted)',
        }}
      >
        {selectedUser.initial}
      </div>

      <h2
        className="text-lg font-bold mb-0.5"
        style={{ color: 'var(--kiosk-text)' }}
      >
        Hi, {selectedUser.name}!
      </h2>
      <p
        className="text-xs mb-3"
        style={{ color: 'var(--kiosk-text-muted)' }}
      >
        Enter your PIN
      </p>

      {/* PIN dots */}
      <div className="flex gap-1.5 mb-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full transition-all"
            style={{
              backgroundColor: i < pinDots ? 'var(--kiosk-text)' : 'var(--kiosk-button-bg)',
              transform: i < pinDots ? 'scale(1.1)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* Number pad (simplified) */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'].map((num, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              if (num === 'C') setPinDots(0);
              else if (num === '⌫') setPinDots(Math.max(0, pinDots - 1));
              else setPinDots(Math.min(6, pinDots + 1));
            }}
            className="w-10 h-10 rounded-full text-sm font-bold transition-all hover:opacity-90"
            style={{
              backgroundColor: typeof num === 'number' ? 'var(--kiosk-button-bg)' : 'rgba(255,255,255,0.1)',
              color: 'var(--kiosk-text)',
            }}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Enter button */}
      <button
        className="px-6 py-1.5 rounded-full text-sm font-bold"
        style={{
          backgroundColor: 'var(--kiosk-accent)',
          color: 'var(--kiosk-bg-gradient-from)',
        }}
      >
        Enter
      </button>

      {/* View toggle for preview */}
      <ViewToggle currentView={view} onViewChange={setView} />
    </ClickableElement>
  );
}

// Extracted toggle component to avoid TypeScript control flow issues
function ViewToggle({
  currentView,
  onViewChange,
}: {
  currentView: 'users' | 'pin';
  onViewChange: (view: 'users' | 'pin') => void;
}) {
  return (
    <div className="absolute bottom-2 right-2 flex gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewChange('users');
        }}
        className={`px-2 py-0.5 text-xs rounded ${currentView === 'users' ? 'bg-white/30' : 'bg-white/10'}`}
        style={{ color: 'var(--kiosk-text)' }}
      >
        Users
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewChange('pin');
        }}
        className={`px-2 py-0.5 text-xs rounded ${currentView === 'pin' ? 'bg-white/30' : 'bg-white/10'}`}
        style={{ color: 'var(--kiosk-text)' }}
      >
        PIN
      </button>
    </div>
  );
}
