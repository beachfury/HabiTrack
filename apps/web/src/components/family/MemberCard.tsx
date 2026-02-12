// apps/web/src/components/family/MemberCard.tsx
import { Edit2, Key, Hash, Trash2 } from 'lucide-react';
import type { FamilyMember } from '../../types';

interface MemberCardProps {
  member: FamilyMember;
  isCurrentUser: boolean;
  onEdit: () => void;
  onSetPassword: () => void;
  onSetPin: () => void;
  onDelete: () => void;
}

// Helper function for role badge styles
const getRoleStyle = (role: string) => {
  switch (role) {
    case 'admin':
      return { backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)' };
    case 'member':
      return { backgroundColor: 'color-mix(in srgb, var(--color-info) 15%, transparent)', color: 'var(--color-info)' };
    case 'kid':
      return { backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' };
    default:
      return { backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' };
  }
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  member: 'Member',
  kid: 'Kid',
};

export function MemberCard({
  member,
  isCurrentUser,
  onEdit,
  onSetPassword,
  onSetPin,
  onDelete,
}: MemberCardProps) {
  const roleLabel = ROLE_LABELS[member.role] || 'Member';

  return (
    <div className="themed-card rounded-xl p-4">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
          style={{ backgroundColor: member.color || 'var(--color-primary)' }}
        >
          {(member.nickname || member.displayName).charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-[var(--color-foreground)] truncate">
              {member.nickname || member.displayName}
            </h3>
            <span
              className="px-2 py-0.5 text-xs rounded-full"
              style={getRoleStyle(member.role)}
            >
              {roleLabel}
            </span>
            {isCurrentUser && (
              <span
                className="px-2 py-0.5 text-xs rounded-full"
                style={{
                  backgroundColor: 'var(--color-muted)',
                  color: 'var(--color-muted-foreground)',
                }}
              >
                You
              </span>
            )}
          </div>
          {member.nickname && member.displayName !== member.nickname && (
            <p className="text-sm text-[var(--color-muted-foreground)] truncate">{member.displayName}</p>
          )}
          {member.email && (
            <p className="text-sm text-[var(--color-muted-foreground)] truncate">{member.email}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--color-muted-foreground)]">
            {member.hasPassword && <span>🔐 Password</span>}
            {member.hasPin && <span>🔢 PIN</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-info)] hover:bg-[var(--color-info)]/10 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onSetPassword}
            className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
            title="Set Password"
          >
            <Key size={16} />
          </button>
          <button
            onClick={onSetPin}
            className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-warning)] hover:bg-[var(--color-warning)]/10 rounded-lg transition-colors"
            title="Set PIN"
          >
            <Hash size={16} />
          </button>
          {!isCurrentUser && (
            <button
              onClick={onDelete}
              className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
