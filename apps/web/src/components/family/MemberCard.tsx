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

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  member: { label: 'Member', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  kid: { label: 'Kid', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
};

export function MemberCard({
  member,
  isCurrentUser,
  onEdit,
  onSetPassword,
  onSetPin,
  onDelete,
}: MemberCardProps) {
  const roleInfo = ROLE_LABELS[member.role] || ROLE_LABELS.member;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:border-gray-200 transition-colors">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
          style={{ backgroundColor: member.color || '#8b5cf6' }}
        >
          {(member.nickname || member.displayName).charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {member.nickname || member.displayName}
            </h3>
            <span className={`px-2 py-0.5 text-xs rounded-full ${roleInfo.color}`}>
              {roleInfo.label}
            </span>
            {isCurrentUser && (
              <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                You
              </span>
            )}
          </div>
          {member.nickname && member.displayName !== member.nickname && (
            <p className="text-sm text-gray-500 truncate">{member.displayName}</p>
          )}
          {member.email && (
            <p className="text-sm text-gray-500 truncate">{member.email}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            {member.hasPassword && <span>🔐 Password</span>}
            {member.hasPin && <span>🔢 PIN</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onSetPassword}
            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
            title="Set Password"
          >
            <Key size={16} />
          </button>
          <button
            onClick={onSetPin}
            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
            title="Set PIN"
          >
            <Hash size={16} />
          </button>
          {!isCurrentUser && (
            <button
              onClick={onDelete}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
