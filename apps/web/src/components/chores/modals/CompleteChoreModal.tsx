// apps/web/src/components/chores/modals/CompleteChoreModal.tsx
import { useState } from 'react';
import { X, CheckSquare, Star, Clock, MessageSquare } from 'lucide-react';
import type { ChoreInstance } from '../../../types';
import { DIFFICULTY_COLORS } from '../../../types';

interface CompleteChoreModalProps {
  instance: ChoreInstance;
  onComplete: (instance: ChoreInstance, notes?: string) => void;
  onClose: () => void;
}

export function CompleteChoreModal({ instance, onComplete, onClose }: CompleteChoreModalProps) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onComplete(instance, notes || undefined);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="text-purple-600" size={20} />
            Complete Chore
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Chore Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{instance.title}</h3>
            {instance.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{instance.description}</p>
            )}
            <div className="flex items-center gap-3 text-sm">
              <span className={`px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[instance.difficulty]}`}>
                {instance.difficulty}
              </span>
              <span className="text-gray-500 flex items-center gap-1">
                <Star size={14} className="text-yellow-500" />
                {instance.points} points
              </span>
              {instance.estimatedMinutes && (
                <span className="text-gray-500 flex items-center gap-1">
                  <Clock size={14} />
                  ~{instance.estimatedMinutes} min
                </span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <MessageSquare size={14} className="inline mr-1" />
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this completion..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              rows={3}
            />
          </div>

          {/* Approval Notice */}
          {instance.requireApproval && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-sm text-yellow-700 dark:text-yellow-300">
              This chore requires admin approval before points are awarded.
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {submitting ? 'Completing...' : 'Complete'}
          </button>
        </div>
      </div>
    </div>
  );
}
