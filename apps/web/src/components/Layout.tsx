// apps/web/src/components/Layout.tsx
// Main layout component that switches between different layout types based on theme

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { X, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api, type HouseholdSettings } from '../api';
import type { UserOption as ApiUserOption } from '../types/user';
import { SidebarLayout, TopHeaderLayout, MinimalLayout } from './layouts';
import { ModalPortal, ModalBody } from './common/ModalPortal';

type UserOption = ApiUserOption;

// Custom event name for message read updates
export const MESSAGE_READ_EVENT = 'habitrack:message-read';

// Helper function to dispatch the event (call this from MessagesPage when marking as read)
export function dispatchMessageReadEvent() {
  window.dispatchEvent(new CustomEvent(MESSAGE_READ_EVENT));
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout, impersonation, startImpersonating, stopImpersonating } = useAuth();
  const { activeTheme, resolvedTheme } = useTheme();

  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [householdSettings, setHouseholdSettings] = useState<HouseholdSettings | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Check if current user is actually an admin (not impersonating)
  const isRealAdmin = user?.role === 'admin' && !impersonation.active;
  // Or if we're impersonating, we know the original user was admin
  const canImpersonate = isRealAdmin || impersonation.active;
  const isAdmin = user?.role === 'admin' || impersonation.active;

  // Fetch unread count function
  const fetchUnread = useCallback(async () => {
    try {
      const data = await api.getUnreadTotal();
      setUnreadCount(data.total);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  useEffect(() => {
    // Fetch household settings for branding
    api
      .getHouseholdSettings()
      .then((data) => setHouseholdSettings(data.household))
      .catch(console.error);
  }, []);

  // Fetch unread message count and listen for updates
  useEffect(() => {
    fetchUnread();

    // Refresh every 12 seconds as backup
    const interval = setInterval(fetchUnread, 12000);

    // Listen for message read events from MessagesPage - this gives instant updates
    const handleMessageRead = () => {
      fetchUnread();
    };
    window.addEventListener(MESSAGE_READ_EVENT, handleMessageRead);

    return () => {
      clearInterval(interval);
      window.removeEventListener(MESSAGE_READ_EVENT, handleMessageRead);
    };
  }, [fetchUnread]);

  useEffect(() => {
    if (showUserSwitcher) {
      api
        .getUsers()
        .then((data) => setUsers(data.users))
        .catch(console.error);
    }
  }, [showUserSwitcher]);

  // Add bell shake animation styles
  useEffect(() => {
    const styleId = 'bell-shake-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes bellShake {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-14deg); }
          30% { transform: rotate(10deg); }
          40% { transform: rotate(-10deg); }
          50% { transform: rotate(6deg); }
          60% { transform: rotate(-6deg); }
          70% { transform: rotate(2deg); }
          80% { transform: rotate(-2deg); }
          90% { transform: rotate(0deg); }
        }
        .bell-shake {
          animation: bellShake 0.8s ease-in-out infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handleImpersonate = async (userId: number) => {
    await startImpersonating(userId);
    setShowUserSwitcher(false);
  };

  const brandColor = householdSettings?.brandColor || '#8b5cf6';

  // Common props for all layouts
  const layoutProps = {
    theme: activeTheme,
    resolvedMode: resolvedTheme,
    householdSettings,
    user: user
      ? {
          displayName: user.displayName,
          role: user.role,
          avatarUrl: user.avatarUrl,
          color: user.color,
        }
      : null,
    unreadCount,
    isAdmin,
    canImpersonate,
    impersonation: {
      active: impersonation.active,
      originalAdmin: impersonation.originalAdmin,
    },
    onLogout: logout,
    onShowUserSwitcher: () => setShowUserSwitcher(true),
    onStopImpersonating: stopImpersonating,
  };

  // Determine which layout to render based on theme
  const layoutType = activeTheme?.layout?.type || 'sidebar-left';

  const renderLayout = () => {
    switch (layoutType) {
      case 'sidebar-right':
        return (
          <SidebarLayout {...layoutProps} side="right">
            {children}
          </SidebarLayout>
        );

      case 'top-header':
        return (
          <TopHeaderLayout {...layoutProps}>
            {children}
          </TopHeaderLayout>
        );

      case 'minimal':
        return (
          <MinimalLayout {...layoutProps}>
            {children}
          </MinimalLayout>
        );

      case 'sidebar-left':
      default:
        return (
          <SidebarLayout {...layoutProps} side="left">
            {children}
          </SidebarLayout>
        );
    }
  };

  return (
    <>
      {renderLayout()}

      {/* User Switcher Modal */}
      {showUserSwitcher && (
        <ModalPortal
          isOpen={true}
          onClose={() => setShowUserSwitcher(false)}
          title="View as User"
          size="md"
          footer={impersonation.active ? (
            <button
              onClick={async () => {
                await stopImpersonating();
                setShowUserSwitcher(false);
              }}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors"
            >
              Return to {impersonation.originalAdmin?.displayName}
            </button>
          ) : undefined}
        >
          <ModalBody>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Select a user to view the app as them. This is useful for testing permissions.
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {users
                .filter((u) => u.id !== user?.id)
                .map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleImpersonate(u.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: u.color || brandColor }}
                    >
                      {(u.nickname || u.displayName).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {u.nickname || u.displayName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {u.roleId}
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          </ModalBody>
        </ModalPortal>
      )}
    </>
  );
}
