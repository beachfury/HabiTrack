// apps/web/src/components/chores/modals/AdminActionModal.tsx
import { UserPlus, Check, SkipForward, Clock, Star } from 'lucide-react';
import type { ChoreInstance } from '../../../types';
import type { UserOption } from '../../../types';
import { ModalPortal, ModalBody } from '../../common/ModalPortal';
import { ModalFooterButtons } from '../../common/ModalFooterButtons';
import { getDifficultyStyle } from '../../../utils';

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
  const footer = (
    <button
      onClick={onClose}
      className="w-full py-2 font-medium transition-opacity hover:opacity-80"
      style={{
        background: 'var(--color-muted)',
        color: 'var(--color-muted-foreground)',
        borderRadius: 'var(--btn-secondary-radius)',
      }}
    >
      Cancel
    </button>
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title="Admin Actions"
      size="md"
      footer={footer}
    >
      <ModalBody>
        <div className="space-y-4">
          {/* Chore Info */}
          <div className="bg-[var(--color-muted)] rounded-xl p-3">
            <h3 className="font-semibold text-[var(--color-foreground)]">{instance.title}</h3>
            <div className="flex items-center gap-3 mt-1 text-sm">
              <span
                className="px-2 py-0.5 rounded-full"
                style={getDifficultyStyle(instance.difficulty)}
              >
                {instance.difficulty}
              </span>
              <span className="text-[var(--color-muted-foreground)] flex items-center gap-1">
                <Star size={14} className="text-[var(--color-warning)]" />
                {instance.points} pts
              </span>
              {instance.estimatedMinutes && (
                <span className="text-[var(--color-muted-foreground)] flex items-center gap-1">
                  <Clock size={14} />
                  {instance.estimatedMinutes}m
                </span>
              )}
            </div>
            {instance.assignedToName && (
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                Assigned to: <span className="font-medium">{instance.assignedToName}</span>
              </p>
            )}
          </div>

          {/* Complete For User */}
          <div>
            <h3 className="text-sm font-medium text-[var(--color-foreground)] mb-2 flex items-center gap-1">
              <Check size={14} />
              Complete for someone
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onCompleteForUser(instance, u.id)}
                  className="p-2 rounded-lg text-sm text-left flex items-center gap-2 transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-success) 10%, transparent)',
                    color: 'var(--color-success)',
                  }}
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
            <h3 className="text-sm font-medium text-[var(--color-foreground)] mb-2 flex items-center gap-1">
              <UserPlus size={14} />
              Reassign to
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => onReassign(instance.id, null)}
                className="p-2 bg-[var(--color-muted)] hover:opacity-80 text-[var(--color-muted-foreground)] rounded-lg text-sm transition-opacity"
              >
                Unassign
              </button>
              {users
                .filter((u) => u.id !== instance.assignedTo)
                .map((u) => (
                  <button
                    key={u.id}
                    onClick={() => onReassign(instance.id, u.id)}
                    className="p-2 rounded-lg text-sm text-left flex items-center gap-2 transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                      color: 'var(--color-primary)',
                    }}
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
            className="w-full p-3 bg-[var(--color-muted)] hover:opacity-80 text-[var(--color-muted-foreground)] rounded-xl flex items-center justify-center gap-2 transition-opacity"
          >
            <SkipForward size={18} />
            Skip this instance
          </button>
        </div>
      </ModalBody>
    </ModalPortal>
  );
}
