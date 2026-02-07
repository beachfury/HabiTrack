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
      return <CheckSquare size={18} className="text-green-500" />;
    case 'calendar':
      return <Calendar size={18} className="text-blue-500" />;
    case 'shopping':
      return <ShoppingCart size={18} className="text-orange-500" />;
    case 'family':
      return <Users size={18} className="text-purple-500" />;
    case 'system':
    default:
      return <Info size={18} className="text-gray-500" />;
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
      return <AlertTriangle size={16} className="text-red-500" />;
    case 'high':
      return <AlertCircle size={16} className="text-orange-500" />;
    default:
      return null;
  }
}

function getPriorityClass(priority: string) {
  switch (priority) {
    case 'urgent':
      return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20';
    case 'high':
      return 'border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20';
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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="text-purple-500" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Messages</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
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
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'notifications'
              ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Bell size={18} />
          Notifications
          {unreadNotifications > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-purple-500 text-white rounded-full">
              {unreadNotifications}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'announcements'
              ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Megaphone size={18} />
          Announcements
          {unreadAnnouncements > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
              {unreadAnnouncements}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'messages'
              ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <MessageCircle size={18} />
          Direct Messages
          {unreadMessages > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
              {unreadMessages}
            </span>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
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
                      ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors"
              >
                <CheckCheck size={16} />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 ${
                    !notif.isRead ? 'border-l-4 border-l-purple-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getTypeIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`font-medium ${!notif.isRead ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}
                        >
                          {notif.title}
                        </h3>
                        {!notif.isRead && <span className="w-2 h-2 bg-purple-500 rounded-full" />}
                      </div>
                      {notif.body && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {notif.body}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {formatDate(notif.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkNotificationRead(notif.id)}
                          className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                          title="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notif.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
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
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus size={18} />
                New Announcement
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No announcements</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  onClick={() => !ann.isRead && handleMarkAnnouncementRead(ann.id)}
                  className={`p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 cursor-pointer ${getPriorityClass(ann.priority)} ${
                    !ann.isRead ? 'ring-2 ring-orange-200 dark:ring-orange-800' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getPriorityIcon(ann.priority) || (
                        <Megaphone size={18} className="text-orange-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {ann.title}
                        </h3>
                        {!ann.isRead && (
                          <span className="px-2 py-0.5 text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded">
                            New
                          </span>
                        )}
                        {user?.role === 'admin' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAnnouncement(ann.id);
                            }}
                            className="ml-auto p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            title="Delete announcement"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mt-2 whitespace-pre-wrap">
                        {ann.body}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 dark:text-gray-500">
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
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
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
            className={`${selectedConversation ? 'hidden md:block' : ''} w-full md:w-1/3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden`}
          >
            <div className="p-3 border-b dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Conversations</h3>
              <button
                onClick={() => setShowNewConversation(true)}
                className="p-1.5 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                title="New conversation"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(100%-52px)]">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
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
                    className={`w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-700 cursor-pointer ${
                      selectedConversation === conv.otherUserId
                        ? 'bg-purple-50 dark:bg-purple-900/20'
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
                          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {conv.otherUserName}
                          </span>
                          {conv.unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {conv.lastMessagePreview}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conv.otherUserId);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
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
            className={`${selectedConversation ? '' : 'hidden md:flex'} flex-1 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 flex flex-col`}
          >
            {selectedConversation && otherUser ? (
              <>
                {/* Header */}
                <div className="p-3 border-b dark:border-gray-700 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-1 text-gray-500 hover:text-gray-700"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                    style={{ backgroundColor: otherUser.color || '#6366f1' }}
                  >
                    {otherUser.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {otherUser.displayName}
                  </span>
                  <button
                    onClick={() => handleDeleteConversation(selectedConversation)}
                    className="ml-auto p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
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
                              ? 'bg-purple-500 text-white rounded-br-md'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md'
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
                              msg.fromUserId === user?.id ? 'text-purple-200' : 'text-gray-400'
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
                            } p-1 bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`}
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
                <div className="p-3 border-t dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <MessageCircle
                    size={48}
                    className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            New Announcement
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Announcement title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Write your announcement..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !body.trim()}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-sm">
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Message</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="p-2 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users available</div>
          ) : (
            users.map((u) => (
              <button
                key={u.id}
                onClick={() => onSelect(u.id)}
                className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: u.color || '#6366f1' }}
                >
                  {u.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {u.displayName}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
