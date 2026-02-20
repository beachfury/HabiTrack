// apps/web/src/components/themes/PreviewPages/FamilyPreview.tsx
// Family page preview replica for theme editor

import { Users, Plus, Edit2, Key, Shield, User } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';

interface FamilyPreviewProps {
  theme: ExtendedTheme;
  colorMode: 'light' | 'dark';
  selectedElement: ThemeableElement | null;
  onSelectElement: (element: ThemeableElement) => void;
}

// Mock family members
const MOCK_MEMBERS = [
  { name: 'John', role: 'admin', color: '#3b82f6', initial: 'J' },
  { name: 'Sarah', role: 'member', color: '#22c55e', initial: 'S' },
  { name: 'Alex', role: 'kid', color: '#f59e0b', initial: 'A' },
  { name: 'Emma', role: 'kid', color: '#ec4899', initial: 'E' },
];

export function FamilyPreview({
  theme,
  colorMode,
  selectedElement,
  onSelectElement,
}: FamilyPreviewProps) {
  const colors = colorMode === 'light' ? theme.colorsLight : theme.colorsDark;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return colors.primary;
      case 'member': return colors.accent;
      case 'kid': return colors.success;
      default: return colors.mutedForeground;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      default: return User;
    }
  };

  return (
    <ClickableElement
      element="family-background"
      isSelected={selectedElement === 'family-background'}
      onClick={() => onSelectElement('family-background')}
      className="themed-family-bg flex-1 overflow-auto"
    >
      <div className="relative z-10 p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={20} style={{ color: colors.primary }} />
            <h1 className="text-lg font-bold">
              Family Members
            </h1>
          </div>
          <button
            className="themed-btn-primary flex items-center gap-1 px-3 py-1.5 text-xs font-medium"
          >
            <Plus size={12} />
            Add Member
          </button>
        </div>

        {/* Members Card */}
        <div className="themed-card p-4 rounded-lg">
          <div className="space-y-3">
            {MOCK_MEMBERS.map((member) => {
              const RoleIcon = getRoleIcon(member.role);
              return (
                <div
                  key={member.name}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: colors.muted }}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.initial}
                    </div>
                    {/* Info */}
                    <div>
                      <p className="text-sm font-medium">
                        {member.name}
                      </p>
                      <div className="flex items-center gap-1">
                        <RoleIcon size={10} style={{ color: getRoleColor(member.role) }} />
                        <span
                          className="text-[10px] capitalize"
                          style={{ color: getRoleColor(member.role) }}
                        >
                          {member.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1.5 rounded"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      className="p-1.5 rounded"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      <Key size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ClickableElement>
  );
}
