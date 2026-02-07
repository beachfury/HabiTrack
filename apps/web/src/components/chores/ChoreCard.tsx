// apps/web/src/components/chores/ChoreCard.tsx
import { Check, Clock, MoreVertical, X } from 'lucide-react';
import type { ChoreInstance } from '../../types';
import { DIFFICULTY_COLORS } from '../../types';

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

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl p-4 border transition-all ${
        isOverdue
          ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
          : isCompleted
            ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
            : isUpcoming
              ? 'border-gray-100 dark:border-gray-700 opacity-75'
              : 'border-gray-100 dark:border-gray-700 hover:border-gray-200'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Category Color */}
        <div
          className="w-2 h-12 rounded-full flex-shrink-0"
          style={{ backgroundColor: instance.categoryColor || '#8b5cf6' }}
        />

        {/* Checkbox / Status */}
        <button
          onClick={canComplete ? onComplete : undefined}
          disabled={!canComplete}
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
            isCompleted
              ? 'bg-green-500 border-green-500 text-white'
              : canComplete
                ? 'border-gray-300 hover:border-purple-500 cursor-pointer'
                : 'border-gray-200 dark:border-gray-600 cursor-not-allowed'
          }`}
        >
          {isCompleted && <Check size={16} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={`font-medium truncate ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}
          >
            {instance.title}
          </p>
          <div className="flex items-center gap-2 mt-1 text-sm flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs ${DIFFICULTY_COLORS[instance.difficulty]}`}>
              {instance.difficulty}
            </span>
            <span className="text-gray-500">{instance.points} pts</span>
            {instance.estimatedMinutes && (
              <span className="text-gray-500">• {instance.estimatedMinutes} min</span>
            )}
            {instance.assignedToName && (
              <span className="text-gray-500">• {instance.assignedToName}</span>
            )}
            {showDate && (
              <span className={isOverdue ? 'text-red-500' : 'text-gray-500'}>
                • {formatShortDate(instance.dueDate)}
              </span>
            )}
          </div>
        </div>

        {/* Due Time */}
        {instance.dueTime && !isCompleted && (
          <div className="text-sm text-gray-500 flex-shrink-0">
            <Clock size={14} className="inline mr-1" />
            {instance.dueTime.slice(0, 5)}
          </div>
        )}

        {/* Points Awarded */}
        {instance.pointsAwarded && (
          <div className="text-green-600 font-medium flex-shrink-0">+{instance.pointsAwarded}</div>
        )}

        {/* Approval Buttons */}
        {showApproval && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={onApprove}
              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
              title="Approve"
            >
              <Check size={18} />
            </button>
            <button
              onClick={onReject}
              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
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
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex-shrink-0"
            title="Admin actions"
          >
            <MoreVertical size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
