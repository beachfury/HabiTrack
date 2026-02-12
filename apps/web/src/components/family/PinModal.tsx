// apps/web/src/components/family/PinModal.tsx
import { useState } from 'react';
import { Hash } from 'lucide-react';
import type { FamilyMember } from '../../types';
import { ModalPortal, ModalBody } from '../common/ModalPortal';

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

  const footer = (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-2 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded-xl font-medium hover:opacity-80 transition-opacity"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="pin-form"
        onClick={handleSubmit}
        disabled={pin.length < 4}
        className="flex-1 py-2 bg-[var(--color-warning)] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        Set PIN
      </button>
    </div>
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title="Set PIN"
      size="sm"
      footer={footer}
    >
      <ModalBody>
        <form id="pin-form" onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Set a PIN for <span className="font-medium">{member.displayName}</span> to use on the kiosk
          </p>

          {(error || localError) && (
            <div
              className="p-3 rounded-xl text-sm"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-destructive) 10%, transparent)',
                borderColor: 'color-mix(in srgb, var(--color-destructive) 30%, transparent)',
                color: 'var(--color-destructive)',
                border: '1px solid',
              }}
            >
              {error || localError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              PIN (4-6 digits)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-3 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] text-center text-2xl tracking-widest font-mono"
              placeholder="• • • •"
              maxLength={6}
              autoFocus
            />
          </div>

          {member.hasPin && (
            <button
              type="button"
              onClick={onRemove}
              className="w-full py-2 text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded-xl text-sm transition-colors"
            >
              Remove existing PIN
            </button>
          )}
        </form>
      </ModalBody>
    </ModalPortal>
  );
}
