// apps/web/src/pages/MessagesPage.tsx
import { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Megaphone,
  MessageCircle,
  CheckCircle,
  Calendar,
  CheckSquare,
  ShoppingCart,
  Users,
  Info,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  RefreshCw,
  Send,
  Plus,
  AlertTriangle,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';
import { ModalPortal, ModalBody } from '../components/common/ModalPortal';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { dispatchMessageReadEvent } from '../components/Layout';
import type { Message } from '../types';
import type { Announcement, Conversation, DirectMessage } from '../api/messages';

type TabType = 'notifications' | 'announcements' | 'messages';
type FilterType = 'all' | 'unread' | 'chore' | 'calendar' | 'shopping' | 'family' | 'system';

const filterOptions: { value: FilterType; label: string; icon?: any }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'chore', label: 'Chores', icon: CheckSquare },
  { value: 'calendar', label: 'Calendar', icon: Calendar },
  { value: 'shopping', label: 'Shopping', icon: ShoppingCart },
  { value: 'family', label: 'Family', icon: Users },
  { value: 'system', label: 'System', icon: Info },
];

function getTypeIcon(type: string) {
  switch (type) {
    case 'chore':
      return <CheckSquare size={18} className="text-[var(--color-success)]" />;
    case 'calendar':
      return <Calendar size={18} className="text-[var(--color-info)]" />;
    case 'shopping':
      return <ShoppingCart size={18} className="text-[var(--color-warning)]" />;
    case 'family':
      return <Users size={18} className="text-[var(--color-primary)]" />;
    case 'system':
    default:
      return <Info size={18} className="text-[var(--color-muted-foreground)]" />;
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function getPriorityIcon(priority: string) {
  switch (priority) {
    case 'urgent':
      return <AlertTriangle size={16} className="text-[var(--color-destructive)]" />;
    case 'high':
      return <AlertCircle size={16} className="text-[var(--color-warning)]" />;
    default:
      return null;
  }
}

function getPriorityClass(priority: string) {
  switch (priority) {
    case 'urgent':
      return 'border-l-4 border-[var(--color-destructive)] bg-[var(--color-destructive)]/10';
    case 'high':
      return 'border-l-4 border-[var(--color-warning)] bg-[var(--color-warning)]/10';
    default:
      return '';
  }
}

export function MessagesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('notifications');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<Message[]>([]);
  const [notificationFilter, setNotificationFilter] = useState<FilterType>('all');
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);

  // Direct messages state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [conversationMessages, setConversationMessages] = useState<DirectMessage[]>([]);
  const [otherUser, setOtherUser] = useState<{
    id: number;
    displayName: string;
    avatarUrl: string | null;
    color: string | null;
  } | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch unread counts
  const fetchUnreadCounts = async () => {
    try {
      const data = await api.getUnreadTotal();
      setUnreadNotifications(data.notifications);
      setUnreadAnnouncements(data.announcements);
      setUnreadMessages(data.directMessages);
    } catch (err) {
      console.error('Failed to fetch unread counts:', err);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params: { type?: string; unreadOnly?: boolean } = {};
      if (notificationFilter === 'unread') {
        params.unreadOnly = true;
      } else if (notificationFilter !== 'all') {
        params.type = notificationFilter;
      }
      const data = await api.getMessages(params);
      setNotifications(data.messages);
      setUnreadNotifications(data.unreadCount);
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await api.getAnnouncements();
      setAnnouncements(data.announcements);
      setUnreadAnnouncements(data.announcements.filter((a: Announcement) => !a.isRead).length);
    } catch (err) {
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await api.getConversations();
      setConversations(data.conversations);
      setUnreadMessages(
        data.conversations.reduce((sum: number, c: Conversation) => sum + c.unreadCount, 0),
      );
    } catch (err) {
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch conversation messages
  const fetchConversationMessages = async (userId: number) => {
    try {
      const data = await api.getConversation(userId);
      setOtherUser(data.otherUser);
      setConversationMessages(data.messages);
      // Scroll to bottom
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      setError('Failed to load messages');
    }
  };

  // Initial load based on tab
  useEffect(() => {
    fetchUnreadCounts();
  }, []);

  useEffect(() => {
    setError(null);
    if (activeTab === 'notifications') {
      fetchNotifications();
    } else if (activeTab === 'announcements') {
      fetchAnnouncements();
    } else if (activeTab === 'messages') {
      fetchConversations();
    }
  }, [activeTab, notificationFilter]);

  // Load conversation when selected
  useEffect(() => {
    if (selectedConversation) {
      fetchConversationMessages(selectedConversation);
    }
  }, [selectedConversation]);

  // Handlers
  const handleMarkNotificationRead = async (id: number) => {
    try {
      await api.markMessageAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadNotifications((prev) => Math.max(0, prev - 1));
      dispatchMessageReadEvent(); // Notify sidebar
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.markAllMessagesAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifications(0);
      dispatchMessageReadEvent(); // Notify sidebar
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      await api.deleteMessage(id);
      const deleted = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (deleted && !deleted.isRead) {
        setUnreadNotifications((prev) => Math.max(0, prev - 1));
      }
      dispatchMessageReadEvent(); // Notify sidebar
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleMarkAnnouncementRead = async (id: number) => {
    try {
      await api.markAnnouncementRead(id);
      setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
      setUnreadAnnouncements((prev) => Math.max(0, prev - 1));
      dispatchMessageReadEvent(); // Notify sidebar
    } catch (err) {
      console.error('Failed to mark announcement as read:', err);
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!user || user.role !== 'admin') return;
    if (!confirm('Delete this announcement for everyone?')) return;

    try {
      await api.deleteAnnouncement(id);
      const deleted = announcements.find((a) => a.id === id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      if (deleted && !deleted.isRead) {
        setUnreadAnnouncements((prev) => Math.max(0, prev - 1));
      }
      fetchUnreadCounts();
      dispatchMessageReadEvent(); // Notify sidebar
    } catch (err) {
      console.error('Failed to delete announcement:', err);
    }
  };

  const handleDeleteConversation = async (otherUserId: number) => {
    if (!confirm('Delete this conversation and all messages in it?')) return;

    try {
      await api.deleteConversation(otherUserId);
      const conv = conversations.find((c) => c.otherUserId === otherUserId);
      setConversations((prev) => prev.filter((c) => c.otherUserId !== otherUserId));
      if (conv?.unreadCount) {
        setUnreadMessages((prev) => Math.max(0, prev - conv.unreadCount));
      }
      if (selectedConversation === otherUserId) {
        setSelectedConversation(null);
        setConversationMessages([]);
        setOtherUser(null);
      }
      fetchUnreadCounts();
      dispatchMessageReadEvent(); // Notify sidebar
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleDeleteDirectMessage = async (messageId: number) => {
    if (!selectedConversation) return;
    if (!confirm('Delete this message?')) return;

    try {
      await api.deleteDirectMessage(messageId);
      setConversationMessages((prev) => prev.filter((m) => m.id !== messageId));
      // refresh previews/unread counts
      fetchConversations();
      fetchUnreadCounts();
      dispatchMessageReadEvent(); // Notify sidebar
    } catch (err) {
      console.error('Failed to delete direct message:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const data = await api.sendMessage(selectedConversation, newMessage.trim());
      setConversationMessages((prev) => [
        ...prev,
        {
          id: data.message.id,
          fromUserId: user!.id,
          toUserId: selectedConversation,
          fromUserName: user!.displayName,
          fromUserAvatar: null,
          title: '',
          body: data.message.body,
          createdAt: data.message.createdAt,
          readAt: null,
        },
      ]);
      setNewMessage('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const totalUnread = unreadNotifications + unreadAnnouncements + unreadMessages;

  return (
    <div className="max-w-4xl mx-auto h-full themed-messages-bg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="text-[var(--color-primary)]" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Messages</h1>
            <p className="text-[var(--color-muted-foreground)] text-sm">
              {totalUnread > 0 ? `${totalUnread} unread` : 'All caught up!'}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'notifications') fetchNotifications();
            else if (activeTab === 'announcements') fetchAnnouncements();
            else fetchConversations();
          }}
          className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[var(--color-muted)] p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'notifications'
              ? 'bg-[var(--color-card)] text-[var(--color-primary)] shadow-sm'
              : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
          }`}
        >
          <Bell size={18} />
          Notifications
          {unreadNotifications > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-full">
              {unreadNotifications}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'announcements'
              ? 'bg-[var(--color-card)] text-[var(--color-primary)] shadow-sm'
              : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
          }`}
        >
          <Megaphone size={18} />
          Announcements
          {unreadAnnouncements > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-[var(--color-warning)] text-white rounded-full">
              {unreadAnnouncements}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'messages'
              ? 'bg-[var(--color-card)] text-[var(--color-primary)] shadow-sm'
              : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
          }`}
        >
          <MessageCircle size={18} />
          Direct Messages
          {unreadMessages > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-[var(--color-accent)] text-[var(--color-accent-foreground)] rounded-full">
              {unreadMessages}
            </span>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] rounded-lg">
          {error}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div>
          {/* Filters */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setNotificationFilter(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                    notificationFilter === opt.value
                      ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/80'
                  }`}
                >
                  {opt.icon && <opt.icon size={14} />}
                  {opt.label}
                </button>
              ))}
            </div>
            {unreadNotifications > 0 && (
              <button
                onClick={handleMarkAllNotificationsRead}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary)]/20 transition-colors"
              >
                <CheckCheck size={16} />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          {loading ? (
            <div className="text-center py-12 text-[var(--color-muted-foreground)]">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell size={48} className="mx-auto text-[var(--color-muted-foreground)]/50 mb-3" />
              <p className="text-[var(--color-muted-foreground)]">No notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 themed-card ${
                    !notif.isRead ? 'border-l-4 border-l-[var(--color-primary)]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getTypeIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`font-medium ${!notif.isRead ? 'text-[var(--color-foreground)]' : 'text-[var(--color-muted-foreground)]'}`}
                        >
                          {notif.title}
                        </h3>
                        {!notif.isRead && <span className="w-2 h-2 bg-[var(--color-primary)] rounded-full" />}
                      </div>
                      {notif.body && (
                        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                          {notif.body}
                        </p>
                      )}
                      <p className="text-xs text-[var(--color-muted-foreground)]/70 mt-2">
                        {formatDate(notif.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkNotificationRead(notif.id)}
                          className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-success)] hover:bg-[var(--color-success)]/10 rounded"
                          title="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notif.id)}
                        className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div>
          {user?.role === 'admin' && (
            <div className="mb-4">
              <button
                onClick={() => setShowCreateAnnouncement(true)}
                className="themed-btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                New Announcement
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-[var(--color-muted-foreground)]">Loading...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone size={48} className="mx-auto text-[var(--color-muted-foreground)]/50 mb-3" />
              <p className="text-[var(--color-muted-foreground)]">No announcements</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  onClick={() => !ann.isRead && handleMarkAnnouncementRead(ann.id)}
                  className={`p-4 themed-card cursor-pointer ${getPriorityClass(ann.priority)} ${
                    !ann.isRead ? 'ring-2 ring-[var(--color-warning)]/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getPriorityIcon(ann.priority) || (
                        <Megaphone size={18} className="text-[var(--color-warning)]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[var(--color-foreground)]">
                          {ann.title}
                        </h3>
                        {!ann.isRead && (
                          <span className="px-2 py-0.5 text-xs bg-[var(--color-warning)]/10 text-[var(--color-warning)] rounded">
                            New
                          </span>
                        )}
                        {user?.role === 'admin' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAnnouncement(ann.id);
                            }}
                            className="ml-auto p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded"
                            title="Delete announcement"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <p className="text-[var(--color-foreground)]/80 mt-2 whitespace-pre-wrap">
                        {ann.body}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-[var(--color-muted-foreground)]">
                        <span>From {ann.fromUserName}</span>
                        <span>{formatDate(ann.createdAt)}</span>
                        <span>
                          {ann.readCount} of {ann.totalUsers} read
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {user?.role === 'admin' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAnnouncement(ann.id);
                            }}
                            className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded"
                            title="Delete announcement"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Direct Messages Tab */}
      {activeTab === 'messages' && (
        <div className="flex gap-4 h-[500px]">
          {/* Conversations List */}
          <div
            className={`${selectedConversation ? 'hidden md:block' : ''} w-full md:w-1/3 themed-card overflow-hidden`}
          >
            <div className="p-3 border-b border-[var(--color-border)] flex items-center justify-between">
              <h3 className="font-medium text-[var(--color-foreground)]">Conversations</h3>
              <button
                onClick={() => setShowNewConversation(true)}
                className="p-1.5 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded"
                title="New conversation"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(100%-52px)]">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-[var(--color-muted-foreground)] text-sm">
                  No conversations yet
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.otherUserId}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedConversation(conv.otherUserId)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && setSelectedConversation(conv.otherUserId)
                    }
                    className={`w-full p-3 text-left hover:bg-[var(--color-muted)]/50 border-b border-[var(--color-border)] cursor-pointer ${
                      selectedConversation === conv.otherUserId
                        ? 'bg-[var(--color-primary)]/10'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: conv.otherUserColor || '#6366f1' }}
                      >
                        {conv.otherUserName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-[var(--color-foreground)] truncate">
                            {conv.otherUserName}
                          </span>
                          {conv.unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 text-xs bg-[var(--color-accent)] text-[var(--color-accent-foreground)] rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--color-muted-foreground)] truncate">
                          {conv.lastMessagePreview}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conv.otherUserId);
                        }}
                        className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded"
                        title="Delete conversation"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Conversation View */}
          <div
            className={`${selectedConversation ? '' : 'hidden md:flex'} flex-1 themed-card flex flex-col`}
          >
            {selectedConversation && otherUser ? (
              <>
                {/* Header */}
                <div className="p-3 border-b border-[var(--color-border)] flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                    style={{ backgroundColor: otherUser.color || '#6366f1' }}
                  >
                    {otherUser.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-[var(--color-foreground)]">
                    {otherUser.displayName}
                  </span>
                  <button
                    onClick={() => handleDeleteConversation(selectedConversation)}
                    className="ml-auto p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded"
                    title="Delete conversation"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {conversationMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.fromUserId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="relative max-w-[75%]">
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            msg.fromUserId === user?.id
                              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-br-md'
                              : 'bg-[var(--color-muted)] text-[var(--color-foreground)] rounded-bl-md'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <p className="whitespace-pre-wrap flex-1">{msg.body}</p>
                            {msg.fromUserId === user?.id && (
                              <button
                                onClick={() => handleDeleteDirectMessage(msg.id)}
                                className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded"
                                title="Delete message"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                          <p
                            className={`text-xs mt-1 ${
                              msg.fromUserId === user?.id ? 'opacity-70' : 'text-[var(--color-muted-foreground)]'
                            }`}
                          >
                            {formatDate(msg.createdAt)}
                          </p>
                        </div>
                        {(msg.fromUserId === user?.id || user?.role === 'admin') && (
                          <button
                            onClick={() => handleDeleteDirectMessage(msg.id)}
                            className={`absolute -top-2 ${
                              msg.fromUserId === user?.id ? '-left-2' : '-right-2'
                            } p-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-full text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10`}
                            title="Delete message"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-[var(--color-border)]">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 bg-[var(--color-muted)] rounded-full text-[var(--color-foreground)] placeholder-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="p-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[var(--color-muted-foreground)]">
                <div className="text-center">
                  <MessageCircle
                    size={48}
                    className="mx-auto text-[var(--color-muted-foreground)]/50 mb-3"
                  />
                  <p>Select a conversation or start a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Announcement Modal */}
      {showCreateAnnouncement && (
        <CreateAnnouncementModal
          onClose={() => setShowCreateAnnouncement(false)}
          onCreated={() => {
            setShowCreateAnnouncement(false);
            fetchAnnouncements();
          }}
        />
      )}

      {/* New Conversation Modal */}
      {showNewConversation && (
        <NewConversationModal
          onClose={() => setShowNewConversation(false)}
          onSelect={(userId) => {
            setShowNewConversation(false);
            setSelectedConversation(userId);
          }}
          currentUserId={user?.id || 0}
        />
      )}
    </div>
  );
}

// Create Announcement Modal
function CreateAnnouncementModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setLoading(true);
    try {
      await api.createAnnouncement({ title: title.trim(), body: body.trim(), priority });
      onCreated();
    } catch (err) {
      console.error('Failed to create announcement:', err);
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        className="themed-btn-secondary"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="announcement-form"
        disabled={loading || !title.trim() || !body.trim()}
        className="themed-btn-primary disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send Announcement'}
      </button>
    </div>
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title="New Announcement"
      size="lg"
      footer={footer}
    >
      <ModalBody>
        <form id="announcement-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="themed-input w-full"
              placeholder="Announcement title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="themed-input w-full"
              placeholder="Write your announcement..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="themed-input w-full"
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </form>
      </ModalBody>
    </ModalPortal>
  );
}

// New Conversation Modal
function NewConversationModal({
  onClose,
  onSelect,
  currentUserId,
}: {
  onClose: () => void;
  onSelect: (userId: number) => void;
  currentUserId: number;
}) {
  const [users, setUsers] = useState<
    Array<{ id: number; displayName: string; color: string | null; active: boolean }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await api.getFamilyMembers();
        setUsers(data.members.filter((m) => m.id !== currentUserId && m.active));
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [currentUserId]);

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title="New Message"
      size="sm"
    >
      <ModalBody>
        <div className="max-h-80 overflow-y-auto -mx-4 px-4">
          {loading ? (
            <div className="text-center py-8 text-[var(--color-muted-foreground)]">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-muted-foreground)]">No users available</div>
          ) : (
            users.map((u) => (
              <button
                key={u.id}
                onClick={() => onSelect(u.id)}
                className="w-full p-3 flex items-center gap-3 hover:bg-[var(--color-muted)]/50 rounded-lg"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: u.color || '#6366f1' }}
                >
                  {u.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-[var(--color-foreground)]">
                  {u.displayName}
                </span>
              </button>
            ))
          )}
        </div>
      </ModalBody>
    </ModalPortal>
  );
}
