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
  // Role colors using CSS variables
  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
          color: 'var(--color-primary)',
        };
      case 'kid':
        return {
          backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
          color: 'var(--color-success)',
        };
      default: // member
        return {
          backgroundColor: 'color-mix(in srgb, var(--color-info) 15%, transparent)',
          color: 'var(--color-info)',
        };
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[var(--color-foreground)] flex items-center gap-2">
          <Users size={18} className="text-[var(--color-primary)]" />
          Family Members
        </h3>
        <Link to="/family" className="text-sm text-[var(--color-primary)] hover:opacity-80">
          Manage
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-wrap gap-3">
          {members.map((member) => (
            <div
              key={member.id}
              className={`flex items-center gap-2 p-2 rounded-[var(--widget-radius)] ${
                member.id === currentUserId
                  ? 'bg-[var(--color-primary)]/10'
                  : 'bg-[var(--widget-bg)]'
              }`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: member.color || 'var(--color-primary)' }}
              >
                {(member.nickname || member.displayName).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-foreground)]">
                  {member.nickname || member.displayName}
                  {member.id === currentUserId && (
                    <span className="ml-1 text-xs text-[var(--color-primary)]">(You)</span>
                  )}
                </p>
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={getRoleStyle(member.role)}
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
