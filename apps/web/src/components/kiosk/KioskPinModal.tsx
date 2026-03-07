// apps/web/src/components/kiosk/KioskPinModal.tsx
// Touch-friendly PIN verification modal for kiosk action board

import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../api';

interface KioskPinModalProps {
  userId: number;
  userName: string;
  userColor: string | null;
  userAvatar: string | null;
  onSuccess: () => void;
  onClose: () => void;
}

export function KioskPinModal({ userId, userName, userColor, userAvatar, onSuccess, onClose }: KioskPinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      setPin(pin + digit);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleSubmit = async () => {
    if (pin.length < 4) {
      setError('PIN must be 4-6 digits');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await api.verifyKioskPin(userId, pin);
      if (result.valid) {
        onSuccess();
      } else {
        setError('Invalid PIN');
        setPin('');
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="relative rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4"
        style={{ backgroundColor: 'var(--kiosk-bg-gradient-to, #1e1b4b)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--kiosk-text, #fff)' }}
        >
          <X size={20} />
        </button>

        {/* User info */}
        <div className="flex flex-col items-center mb-6">
          {userAvatar ? (
            <img src={userAvatar} alt={userName} className="w-16 h-16 rounded-full object-cover mb-3" />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3"
              style={{ backgroundColor: userColor || '#6d28d9' }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <p className="text-lg font-semibold" style={{ color: 'var(--kiosk-text, #fff)' }}>
            Enter PIN for {userName}
          </p>
        </div>

        {/* PIN dots */}
        <div className="flex gap-3 justify-center mb-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-3.5 h-3.5 rounded-full transition-all"
              style={{
                backgroundColor: i < pin.length ? 'var(--kiosk-text, #fff)' : 'var(--kiosk-button-bg, #374151)',
                transform: i < pin.length ? 'scale(1.1)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-4 px-3 py-2 rounded-lg text-center text-sm"
            style={{
              backgroundColor: 'var(--kiosk-error-bg, rgba(239,68,68,0.2))',
              color: 'var(--kiosk-error-text, #fca5a5)',
            }}
          >
            {error}
          </div>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 mb-4 justify-items-center">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(String(num))}
              disabled={loading}
              className="w-16 h-16 rounded-full text-2xl font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--kiosk-button-bg, #374151)',
                color: 'var(--kiosk-text, #fff)',
              }}
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            disabled={loading}
            className="w-16 h-16 rounded-full text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--kiosk-button-bg, #374151)',
              color: 'var(--kiosk-text-muted, #9ca3af)',
              opacity: 0.7,
            }}
          >
            Clear
          </button>
          <button
            onClick={() => handleDigit('0')}
            disabled={loading}
            className="w-16 h-16 rounded-full text-2xl font-bold transition-all active:scale-95 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--kiosk-button-bg, #374151)',
              color: 'var(--kiosk-text, #fff)',
            }}
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            disabled={loading}
            className="w-16 h-16 rounded-full text-xl transition-all active:scale-95 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--kiosk-button-bg, #374151)',
              color: 'var(--kiosk-text-muted, #9ca3af)',
              opacity: 0.7,
            }}
          >
            &#9003;
          </button>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || pin.length < 4}
          className="w-full py-3 rounded-full text-lg font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--kiosk-accent, #7c3aed)',
            color: '#fff',
          }}
        >
          {loading ? 'Verifying...' : 'Confirm'}
        </button>
      </div>
    </div>
  );
}
