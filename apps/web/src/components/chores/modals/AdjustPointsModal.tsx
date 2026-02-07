// apps/web/src/components/chores/modals/AdjustPointsModal.tsx
import { useState } from 'react';
import { X, Star, Plus, Minus, TrendingUp, TrendingDown } from 'lucide-react';
import { choresApi } from '../../../api';

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Star className="text-yellow-500" size={20} />
            Adjust Points
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-semibold"
              style={{ backgroundColor: user.color || '#8b5cf6' }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{displayName}</p>
              <p className="text-sm text-gray-500">
                Current points: <span className="font-medium text-yellow-600">{currentPoints}</span>
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Add/Subtract Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('add')}
              className={`flex-1 p-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors ${
                mode === 'add'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 ring-2 ring-green-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <TrendingUp size={18} />
              Add Points
            </button>
            <button
              onClick={() => setMode('subtract')}
              className={`flex-1 p-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors ${
                mode === 'subtract'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 ring-2 ring-red-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <TrendingDown size={18} />
              Subtract Points
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={amount || ''}
                onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-lg font-semibold text-center"
                placeholder="0"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">pts</div>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  amount === quickAmount
                    ? mode === 'add'
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {mode === 'add' ? '+' : '-'}
                {quickAmount}
              </button>
            ))}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500"
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
              className={`p-3 rounded-xl text-center ${
                mode === 'add'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              }`}
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

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || amount <= 0 || !reason.trim()}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === 'add'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
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
        </div>
      </div>
    </div>
  );
}
