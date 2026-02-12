// apps/web/src/pages/calendar/ChoreActionModal.tsx
// Modal for chore actions (complete/skip)

import { Check, SkipForward, CheckSquare } from 'lucide-react';
import type { ChoreInstance } from '../../api';
import { ModalPortal, ModalBody } from '../../components/common/ModalPortal';

interface ChoreActionModalProps {
  chore: ChoreInstance;
  onClose: () => void;
  onComplete: () => void;
  onSkip: () => void;
}

export function ChoreActionModal({
  chore,
  onClose,
  onComplete,
  onSkip,
}: ChoreActionModalProps) {
  const isCompleted = chore.status === 'completed' || chore.status === 'approved';
  const isPending = chore.status === 'pending';

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const normalized = dateStr.substring(0, 10);
    const [year, month, day] = normalized.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title="Chore Details"
      size="sm"
      className="themed-card"
      footer={
        <button
          onClick={onClose}
          className="w-full themed-btn-secondary"
        >
          Close
        </button>
      }
    >
      <ModalBody>
        <div className="mb-4 p-4 bg-[var(--color-muted)]/50 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: chore.categoryColor || '#8b5cf6' }}
            >
              <CheckSquare className="text-white" size={16} />
            </div>
            <div>
              <p className="font-medium text-[var(--color-foreground)]">{chore.title}</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">{chore.points} points</p>
            </div>
          </div>
          <div className="text-sm text-[var(--color-foreground)] space-y-1 mt-3 pt-3 border-t border-[var(--color-border)]">
            <p>
              <strong>Due:</strong> {formatDate(chore.dueDate)}
            </p>
            {chore.assignedToName && (
              <p>
                <strong>Assigned to:</strong> {chore.assignedToName}
              </p>
            )}
            <p>
              <strong>Status:</strong>{' '}
              <span
                className={
                  isCompleted
                    ? 'text-[var(--color-success)]'
                    : chore.status === 'pending'
                      ? 'text-[var(--color-primary)]'
                      : 'text-[var(--color-muted-foreground)]'
                }
              >
                {chore.status}
              </span>
            </p>
          </div>
        </div>

        {isPending && (
          <div className="space-y-2">
            <button
              onClick={onComplete}
              className="w-full p-3 text-left rounded-xl border border-[var(--color-border)] hover:border-[var(--color-success)]/50 hover:bg-[var(--color-success)]/10 transition-colors flex items-center gap-3"
            >
              <Check className="text-[var(--color-success)]" size={20} />
              <div>
                <p className="font-medium text-[var(--color-foreground)]">Mark Complete</p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Complete this chore and earn {chore.points} points
                </p>
              </div>
            </button>

            <button
              onClick={onSkip}
              className="w-full p-3 text-left rounded-xl border border-[var(--color-border)] hover:border-[var(--color-warning)]/50 hover:bg-[var(--color-warning)]/10 transition-colors flex items-center gap-3"
            >
              <SkipForward className="text-[var(--color-warning)]" size={20} />
              <div>
                <p className="font-medium text-[var(--color-foreground)]">Skip</p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Skip this occurrence (no points)
                </p>
              </div>
            </button>
          </div>
        )}

        {isCompleted && (
          <div className="p-3 bg-[var(--color-success)]/10 rounded-xl text-[var(--color-success)] text-center">
            <Check className="inline mr-2" size={16} />
            This chore has been completed
            {chore.pointsAwarded && ` (+${chore.pointsAwarded} points)`}
          </div>
        )}
      </ModalBody>
    </ModalPortal>
  );
}
