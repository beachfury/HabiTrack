// apps/web/src/components/dashboard/widgets/FamilyWidget.tsx
import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FamilyMember {
  id: number;
  displayName: string;
  nickname: string | null;
  color: string;
  avatarUrl: string | null;
  role: string;
}

interface FamilyWidgetProps {
  members: FamilyMember[];
  currentUserId?: number;
}

export function FamilyWidget({ members = [], currentUserId }: FamilyWidgetProps) {
  const roleColors = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    member: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    kid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Users size={18} className="text-purple-500" />
          Family Members
        </h3>
        <Link to="/family" className="text-sm text-blue-500 hover:text-blue-600">
          Manage
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-wrap gap-3">
          {members.map((member) => (
            <div
              key={member.id}
              className={`flex items-center gap-2 p-2 rounded-lg ${
                member.id === currentUserId
                  ? 'bg-purple-50 dark:bg-purple-900/20'
                  : 'bg-gray-50 dark:bg-gray-700/50'
              }`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: member.color || '#8b5cf6' }}
              >
                {(member.nickname || member.displayName).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {member.nickname || member.displayName}
                  {member.id === currentUserId && (
                    <span className="ml-1 text-xs text-purple-500">(You)</span>
                  )}
                </p>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    roleColors[member.role as keyof typeof roleColors] || roleColors.member
                  }`}
                >
                  {member.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
