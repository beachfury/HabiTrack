// apps/web/src/components/themes/PreviewPages/MessagesPreview.tsx
// Messages page preview replica for theme editor - mirrors actual MessagesPage

import { Bell, Megaphone, MessageCircle, CheckSquare, Calendar, ShoppingCart, Users, Info, Check, RefreshCw } from 'lucide-react';
import type { ExtendedTheme, ThemeableElement } from '../../../types/theme';
import { ClickableElement } from '../InteractivePreview';

interface MessagesPreviewProps {
  theme: ExtendedTheme;
  colorMode: 'light' | 'dark';
  selectedElement: ThemeableElement | null;
  onSelectElement: (element: ThemeableElement) => void;
}

// Tabs matching real page
const TABS = [
  { id: 'notifications', label: 'Notifications', icon: Bell, badge: 3 },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, badge: 1 },
  { id: 'messages', label: 'Direct Messages', icon: MessageCircle, badge: 2 },
];

// Filter options matching real page
const FILTERS = ['All', 'Unread', 'Chores', 'Calendar', 'Shopping', 'Family', 'System'];

// Mock notifications matching real page structure
const MOCK_NOTIFICATIONS = [
  { id: 1, title: 'Chore completed!', body: 'Alex completed "Clean kitchen"', type: 'chore', time: '5m ago', isRead: false },
  { id: 2, title: 'Event tomorrow', body: 'Soccer Practice at 3:00 PM', type: 'calendar', time: '1h ago', isRead: false },
  { id: 3, title: 'Item purchased', body: 'Milk marked as purchased', type: 'shopping', time: '2h ago', isRead: true },
  { id: 4, title: 'New family member', body: 'Jordan joined the household', type: 'family', time: '1d ago', isRead: true },
];

function getTypeIcon(type: string, colors: any) {
  switch (type) {
    case 'chore':
      return <CheckSquare size={14} style={{ color: colors.success }} />;
    case 'calendar':
      return <Calendar size={14} style={{ color: colors.primary }} />;
    case 'shopping':
      return <ShoppingCart size={14} style={{ color: colors.warning }} />;
    case 'family':
      return <Users size={14} style={{ color: colors.accent }} />;
    default:
      return <Info size={14} style={{ color: 'var(--color-muted-foreground)' }} />;
  }
}

export function MessagesPreview({
  theme,
  colorMode,
  selectedElement,
  onSelectElement,
}: MessagesPreviewProps) {
  const colors = colorMode === 'light' ? theme.colorsLight : theme.colorsDark;

  return (
    <ClickableElement
      element="messages-background"
      isSelected={selectedElement === 'messages-background'}
      onClick={() => onSelectElement('messages-background')}
      className="themed-messages-bg flex-1 overflow-auto"
    >
      <div className="relative z-10 p-4 space-y-4">
        {/* Page header - matches real MessagesPage */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={20} style={{ color: colors.primary }} />
            <div>
              <h1 className="text-lg font-bold">Messages</h1>
              <p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>6 unread</p>
            </div>
          </div>
          <button className="p-1.5 rounded-lg" style={{ backgroundColor: colors.muted }}>
            <RefreshCw size={14} style={{ color: 'var(--color-muted-foreground)' }} />
          </button>
        </div>

        {/* Tab bar - underline style */}
        <ClickableElement
          element="messages-announcements-card"
          isSelected={selectedElement === 'messages-announcements-card'}
          onClick={() => onSelectElement('messages-announcements-card')}
          className="themed-messages-announcements"
          style={{ padding: '0' }}
        >
          <div className="flex gap-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
            {TABS.map((tab, i) => (
              <button
                key={tab.id}
                className="flex items-center gap-1 px-3 py-2 text-xs font-medium"
                style={{
                  color: i === 0 ? colors.primary : 'var(--color-muted-foreground)',
                  borderBottom: i === 0 ? `2px solid ${colors.primary}` : '2px solid transparent',
                }}
              >
                <tab.icon size={12} />
                {tab.label}
                {tab.badge > 0 && (
                  <span
                    className="px-1 py-0.5 text-[8px] rounded-full"
                    style={{
                      backgroundColor: tab.id === 'notifications' ? colors.primary : tab.id === 'announcements' ? colors.warning : colors.accent,
                      color: 'white',
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </ClickableElement>

        {/* Filter pills - matches real page */}
        <div className="flex gap-1 overflow-x-auto">
          {FILTERS.slice(0, 5).map((filter, idx) => (
            <button
              key={filter}
              className="px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap"
              style={{
                backgroundColor: idx === 0 ? `${colors.primary}20` : colors.muted,
                color: idx === 0 ? colors.primary : colors.mutedForeground,
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Notifications list - matches real page */}
        <ClickableElement
          element="messages-chat-card"
          isSelected={selectedElement === 'messages-chat-card'}
          onClick={() => onSelectElement('messages-chat-card')}
          className="themed-messages-chat space-y-2"
        >
          {MOCK_NOTIFICATIONS.map((notif) => (
            <div
              key={notif.id}
              className="themed-card p-3 rounded-lg"
              style={{
                borderLeft: !notif.isRead ? `3px solid ${colors.primary}` : undefined,
              }}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {getTypeIcon(notif.type, colors)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h3
                      className="text-xs font-medium"
                      style={{ color: !notif.isRead ? undefined : 'var(--color-muted-foreground)' }}
                    >
                      {notif.title}
                    </h3>
                    {!notif.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.primary }} />
                    )}
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
                    {notif.body}
                  </p>
                  <p className="text-[9px] mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
                    {notif.time}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {!notif.isRead && (
                    <button className="p-1 rounded" style={{ backgroundColor: `${colors.success}20` }}>
                      <Check size={10} style={{ color: colors.success }} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </ClickableElement>

        {/* Mark all read button - matches real page */}
        <ClickableElement
          element="button-primary"
          isSelected={selectedElement === 'button-primary'}
          onClick={() => onSelectElement('button-primary')}
        >
          <button
            className="themed-btn-primary w-full flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium"
            style={{
              backgroundColor: `${colors.primary}20`,
              color: colors.primary,
            }}
          >
            <Check size={14} />
            Mark all as read
          </button>
        </ClickableElement>
      </div>
    </ClickableElement>
  );
}
