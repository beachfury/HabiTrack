// apps/web/src/components/chores/modals/AdjustPointsModal.tsx
import { useState } from 'react';
import { Star, Plus, Minus, TrendingUp, TrendingDown } from 'lucide-react';
import { choresApi } from '../../../api';
import { ModalPortal, ModalBody } from '../../common/ModalPortal';

interface User {
  id: number;
  displayName: string;
  nickname?: string | null;
  color?: string | null;
  totalPoints?: number;
}

interface AdjustPointsModalProps {
  user: User;
  onSuccess: (newTotal: number) => void;
  onClose: () => void;
}

export function AdjustPointsModal({ user, onSuccess, onClose }: AdjustPointsModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'add' | 'subtract'>('add');

  const displayName = user.nickname || user.displayName;

  // Safely get points, handling undefined, null, NaN, and string values
  const currentPoints = Number(user.totalPoints) || 0;

  const handleSubmit = async () => {
    if (amount <= 0) {
      setError('Please enter a positive amount');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const adjustedAmount = mode === 'subtract' ? -amount : amount;
      // Note: The API expects { userId, amount, reason } but choresApi.adjustPoints
      // may send { userId, points, reason }. Using direct fetch to ensure correct params.
      const result = await choresApi.adjustPoints(user.id, adjustedAmount, reason.trim());
      onSuccess(result.newTotal);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to adjust points';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const quickAmounts = [5, 10, 25, 50, 100];

  const footer = (
    <div className="flex gap-3">
      <button
        onClick={onClose}
        className="flex-1 px-4 py-3 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] rounded-xl transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={saving || amount <= 0 || !reason.trim()}
        className="flex-1 px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white"
        style={{
          backgroundColor: mode === 'add' ? 'var(--color-success)' : 'var(--color-destructive)',
        }}
      >
        {saving ? (
          'Saving...'
        ) : (
          <>
            {mode === 'add' ? <Plus size={18} /> : <Minus size={18} />}
            {mode === 'add' ? 'Add' : 'Subtract'} {amount} pts
          </>
        )}
      </button>
    </div>
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title="Adjust Points"
      size="md"
      footer={footer}
    >
      <ModalBody>
        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-[var(--color-muted)] rounded-xl">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-semibold"
              style={{ backgroundColor: user.color || '#8b5cf6' }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-[var(--color-foreground)]">{displayName}</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Current points: <span className="font-medium text-[var(--color-warning)]">{currentPoints}</span>
              </p>
            </div>
          </div>

          {error && (
            <div
              className="p-3 rounded-xl text-sm"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-destructive) 10%, transparent)',
                borderColor: 'color-mix(in srgb, var(--color-destructive) 30%, transparent)',
                color: 'var(--color-destructive)',
                border: '1px solid',
              }}
            >
              {error}
            </div>
          )}

          {/* Add/Subtract Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('add')}
              className="flex-1 p-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors"
              style={
                mode === 'add'
                  ? {
                      backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
                      color: 'var(--color-success)',
                      boxShadow: '0 0 0 2px var(--color-success)',
                    }
                  : {
                      backgroundColor: 'var(--color-muted)',
                      color: 'var(--color-muted-foreground)',
                    }
              }
            >
              <TrendingUp size={18} />
              Add Points
            </button>
            <button
              onClick={() => setMode('subtract')}
              className="flex-1 p-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors"
              style={
                mode === 'subtract'
                  ? {
                      backgroundColor: 'color-mix(in srgb, var(--color-destructive) 15%, transparent)',
                      color: 'var(--color-destructive)',
                      boxShadow: '0 0 0 2px var(--color-destructive)',
                    }
                  : {
                      backgroundColor: 'var(--color-muted)',
                      color: 'var(--color-muted-foreground)',
                    }
              }
            >
              <TrendingDown size={18} />
              Subtract Points
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={amount || ''}
                onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)] text-lg font-semibold text-center"
                placeholder="0"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]">pts</div>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={
                  amount === quickAmount
                    ? {
                        backgroundColor: mode === 'add' ? 'var(--color-success)' : 'var(--color-destructive)',
                        color: 'white',
                      }
                    : {
                        backgroundColor: 'var(--color-muted)',
                        color: 'var(--color-foreground)',
                      }
                }
              >
                {mode === 'add' ? '+' : '-'}
                {quickAmount}
              </button>
            ))}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
              Reason *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder={
                mode === 'add'
                  ? 'e.g., Bonus for helping out'
                  : 'e.g., Penalty for incomplete chore'
              }
            />
          </div>

          {/* Preview */}
          {amount > 0 && (
            <div
              className="p-3 rounded-xl text-center"
              style={
                mode === 'add'
                  ? {
                      backgroundColor: 'color-mix(in srgb, var(--color-success) 10%, transparent)',
                      color: 'var(--color-success)',
                    }
                  : {
                      backgroundColor: 'color-mix(in srgb, var(--color-destructive) 10%, transparent)',
                      color: 'var(--color-destructive)',
                    }
              }
            >
              <p className="text-sm">
                {displayName}'s points will change from{' '}
                <span className="font-semibold">{currentPoints}</span>
                {' → '}
                <span className="font-semibold">
                  {Math.max(0, currentPoints + (mode === 'add' ? amount : -amount))}
                </span>
              </p>
            </div>
          )}
        </div>
      </ModalBody>
    </ModalPortal>
  );
}
