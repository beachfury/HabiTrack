// apps/web/src/components/chores/modals/AdminActionModal.tsx
import { X, UserPlus, Check, SkipForward, Clock, Star } from 'lucide-react';
import type { ChoreInstance } from '../../../types';
import type { UserOption } from '../../../types';
import { DIFFICULTY_COLORS } from '../../../types';

interface AdminActionModalProps {
  instance: ChoreInstance;
  users: UserOption[];
  onClose: () => void;
  onCompleteForUser: (instance: ChoreInstance, userId: number) => void;
  onReassign: (instanceId: number, userId: number | null) => void;
  onSkip: (instanceId: number) => void;
}

export function AdminActionModal({
  instance,
  users,
  onClose,
  onCompleteForUser,
  onReassign,
  onSkip,
}: AdminActionModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Actions</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Chore Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">{instance.title}</h3>
            <div className="flex items-center gap-3 mt-1 text-sm">
              <span className={`px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[instance.difficulty]}`}>
                {instance.difficulty}
              </span>
              <span className="text-gray-500 flex items-center gap-1">
                <Star size={14} className="text-yellow-500" />
                {instance.points} pts
              </span>
              {instance.estimatedMinutes && (
                <span className="text-gray-500 flex items-center gap-1">
                  <Clock size={14} />
                  {instance.estimatedMinutes}m
                </span>
              )}
            </div>
            {instance.assignedToName && (
              <p className="text-sm text-gray-500 mt-1">
                Assigned to: <span className="font-medium">{instance.assignedToName}</span>
              </p>
            )}
          </div>

          {/* Complete For User */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
              <Check size={14} />
              Complete for someone
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onCompleteForUser(instance, u.id)}
                  className="p-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg text-sm text-left flex items-center gap-2"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                    style={{ backgroundColor: u.color || '#8b5cf6' }}
                  >
                    {(u.nickname || u.displayName).charAt(0)}
                  </div>
                  <span className="truncate">{u.nickname || u.displayName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reassign */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
              <UserPlus size={14} />
              Reassign to
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onReassign(instance.id, null)}
                className="p-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
              >
                Unassign
              </button>
              {users
                .filter((u) => u.id !== instance.assignedTo)
                .map((u) => (
                  <button
                    key={u.id}
                    onClick={() => onReassign(instance.id, u.id)}
                    className="p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg text-sm text-left flex items-center gap-2"
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                      style={{ backgroundColor: u.color || '#8b5cf6' }}
                    >
                      {(u.nickname || u.displayName).charAt(0)}
                    </div>
                    <span className="truncate">{u.nickname || u.displayName}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Skip */}
          <button
            onClick={() => onSkip(instance.id)}
            className="w-full p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl flex items-center justify-center gap-2"
          >
            <SkipForward size={18} />
            Skip this instance
          </button>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
