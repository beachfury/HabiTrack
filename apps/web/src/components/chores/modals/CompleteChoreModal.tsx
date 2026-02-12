// apps/web/src/components/chores/modals/CompleteChoreModal.tsx
import { useState } from 'react';
import { Star, Clock, MessageSquare } from 'lucide-react';
import type { ChoreInstance } from '../../../types';
import { ModalPortal, ModalBody } from '../../common/ModalPortal';
import { getDifficultyStyle } from '../../../utils';

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

  const footer = (
    <div className="flex gap-2">
      <button
        onClick={onClose}
        className="flex-1 py-2 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded-xl font-medium hover:opacity-80 transition-opacity"
      >
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="flex-1 py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl font-medium hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? 'Completing...' : 'Complete'}
      </button>
    </div>
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title="Complete Chore"
      size="md"
      footer={footer}
    >
      <ModalBody>
        <div className="space-y-4">
          {/* Chore Info */}
          <div className="bg-[var(--color-muted)] rounded-xl p-4">
            <h3 className="font-semibold text-[var(--color-foreground)] mb-2">{instance.title}</h3>
            {instance.description && (
              <p className="text-[var(--color-muted-foreground)] text-sm mb-3">{instance.description}</p>
            )}
            <div className="flex items-center gap-3 text-sm">
              <span
                className="px-2 py-0.5 rounded-full"
                style={getDifficultyStyle(instance.difficulty)}
              >
                {instance.difficulty}
              </span>
              <span className="text-[var(--color-muted-foreground)] flex items-center gap-1">
                <Star size={14} className="text-[var(--color-warning)]" />
                {instance.points} points
              </span>
              {instance.estimatedMinutes && (
                <span className="text-[var(--color-muted-foreground)] flex items-center gap-1">
                  <Clock size={14} />
                  ~{instance.estimatedMinutes} min
                </span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              <MessageSquare size={14} className="inline mr-1" />
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this completion..."
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] resize-none"
              rows={3}
            />
          </div>

          {/* Approval Notice */}
          {instance.requireApproval && (
            <div
              className="p-3 rounded-xl text-sm"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-warning) 10%, transparent)',
                borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)',
                color: 'var(--color-warning)',
                border: '1px solid',
              }}
            >
              This chore requires admin approval before points are awarded.
            </div>
          )}
        </div>
      </ModalBody>
    </ModalPortal>
  );
}
