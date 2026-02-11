// apps/web/src/components/chores/ChoreCard.tsx
import { Check, Clock, MoreVertical, X } from 'lucide-react';
import type { ChoreInstance } from '../../types';

interface ChoreCardProps {
  instance: ChoreInstance;
  onComplete: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onAdminAction?: () => void;
  showApproval?: boolean;
  isOverdue?: boolean;
  isAdmin?: boolean;
  isUpcoming?: boolean;
  showDate?: boolean;
}

// Difficulty styles using CSS variables
const getDifficultyStyle = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
        color: 'var(--color-success)',
      };
    case 'hard':
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-destructive) 15%, transparent)',
        color: 'var(--color-destructive)',
      };
    default: // medium
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
        color: 'var(--color-warning)',
      };
  }
};

export function ChoreCard({
  instance,
  onComplete,
  onApprove,
  onReject,
  onAdminAction,
  showApproval,
  isOverdue,
  isAdmin,
  isUpcoming,
  showDate,
}: ChoreCardProps) {
  const isCompleted = instance.status === 'approved' || instance.status === 'completed';
  const canComplete = !isUpcoming && !isCompleted;

  const formatShortDate = (dateStr: string) => {
    const normalized = dateStr?.substring(0, 10) || '';
    const [year, month, day] = normalized.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return '';
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Dynamic card styling based on state
  const getCardStyle = () => {
    if (isOverdue) {
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-destructive) 5%, var(--color-card))',
        borderColor: 'color-mix(in srgb, var(--color-destructive) 30%, transparent)',
      };
    }
    if (isCompleted) {
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-success) 5%, var(--color-card))',
        borderColor: 'color-mix(in srgb, var(--color-success) 30%, transparent)',
      };
    }
    return {};
  };

  return (
    <div
      className={`themed-card p-4 transition-all ${
        isUpcoming ? 'opacity-75' : ''
      }`}
      style={getCardStyle()}
    >
      <div className="flex items-center gap-4">
        {/* Category Color */}
        <div
          className="w-2 h-12 rounded-full flex-shrink-0"
          style={{ backgroundColor: instance.categoryColor || 'var(--color-primary)' }}
        />

        {/* Checkbox / Status */}
        <button
          onClick={canComplete ? onComplete : undefined}
          disabled={!canComplete}
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
            isCompleted
              ? 'bg-[var(--color-success)] border-[var(--color-success)] text-[var(--color-success-foreground)]'
              : canComplete
                ? 'border-[var(--color-border)] hover:border-[var(--color-primary)] cursor-pointer'
                : 'border-[var(--color-border)] cursor-not-allowed opacity-50'
          }`}
        >
          {isCompleted && <Check size={16} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={`font-medium truncate ${
              isCompleted
                ? 'text-[var(--color-muted-foreground)] line-through'
                : 'text-[var(--color-foreground)]'
            }`}
          >
            {instance.title}
          </p>
          <div className="flex items-center gap-2 mt-1 text-sm flex-wrap">
            <span
              className="px-2 py-0.5 rounded-full text-xs"
              style={getDifficultyStyle(instance.difficulty)}
            >
              {instance.difficulty}
            </span>
            <span className="text-[var(--color-muted-foreground)]">{instance.points} pts</span>
            {instance.estimatedMinutes && (
              <span className="text-[var(--color-muted-foreground)]">• {instance.estimatedMinutes} min</span>
            )}
            {instance.assignedToName && (
              <span className="text-[var(--color-muted-foreground)]">• {instance.assignedToName}</span>
            )}
            {showDate && (
              <span className={isOverdue ? 'text-[var(--color-destructive)]' : 'text-[var(--color-muted-foreground)]'}>
                • {formatShortDate(instance.dueDate)}
              </span>
            )}
          </div>
        </div>

        {/* Due Time */}
        {instance.dueTime && !isCompleted && (
          <div className="text-sm text-[var(--color-muted-foreground)] flex-shrink-0">
            <Clock size={14} className="inline mr-1" />
            {instance.dueTime.slice(0, 5)}
          </div>
        )}

        {/* Points Awarded */}
        {instance.pointsAwarded && (
          <div className="text-[var(--color-success)] font-medium flex-shrink-0">+{instance.pointsAwarded}</div>
        )}

        {/* Approval Buttons */}
        {showApproval && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={onApprove}
              className="p-2 bg-[var(--color-success)]/10 text-[var(--color-success)] rounded-lg hover:bg-[var(--color-success)]/20"
              title="Approve"
            >
              <Check size={18} />
            </button>
            <button
              onClick={onReject}
              className="p-2 bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] rounded-lg hover:bg-[var(--color-destructive)]/20"
              title="Reject"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Admin Menu */}
        {isAdmin && !showApproval && !isCompleted && onAdminAction && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdminAction();
            }}
            className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] rounded-lg flex-shrink-0"
            title="Admin actions"
          >
            <MoreVertical size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
