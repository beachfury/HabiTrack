// apps/web/src/components/family/PinModal.tsx
import { useState } from 'react';
import { X, Hash } from 'lucide-react';
import type { FamilyMember } from '../../types';

interface PinModalProps {
  member: FamilyMember;
  error: string;
  onClose: () => void;
  onSubmit: (pin: string) => void;
  onRemove: () => void;
}

export function PinModal({ member, error, onClose, onSubmit, onRemove }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!/^\d{4,6}$/.test(pin)) {
      setLocalError('PIN must be 4-6 digits');
      return;
    }

    onSubmit(pin);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-xl">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Hash size={20} className="text-orange-500" />
            Set PIN
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Set a PIN for <span className="font-medium">{member.displayName}</span> to use on the kiosk
          </p>

          {(error || localError) && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error || localError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              PIN (4-6 digits)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-center text-2xl tracking-widest font-mono"
              placeholder="• • • •"
              maxLength={6}
              autoFocus
            />
          </div>

          {member.hasPin && (
            <button
              type="button"
              onClick={onRemove}
              className="w-full py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm"
            >
              Remove existing PIN
            </button>
          )}
        </form>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={pin.length < 4}
            className="flex-1 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            Set PIN
          </button>
        </div>
      </div>
    </div>
  );
}
