// apps/web/src/api/messages.ts
// Messages/notifications API endpoints

import { apiClient } from './client';
import type { Message } from '../types';

export interface Announcement {
  id: number;
  title: string;
  body: string;
  priority: 'normal' | 'high' | 'urgent';
  fromUserId: number;
  fromUserName: string;
  fromUserAvatar: string | null;
  createdAt: string;
  expiresAt: string | null;
  readCount: number;
  totalUsers: number;
  isRead: boolean;
}

export interface Conversation {
  id: number;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar: string | null;
  otherUserColor: string | null;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
}

export interface DirectMessage {
  id: number;
  fromUserId: number;
  toUserId: number;
  fromUserName: string;
  fromUserAvatar: string | null;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export interface UnreadCounts {
  notifications: number;
  directMessages: number;
  announcements: number;
  total: number;
}

export const messagesApi = {
  // =============================================================================
  // NOTIFICATIONS (System-generated)
  // =============================================================================

  getMessages(params?: {
    type?: string;
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<{ messages: Message[]; unreadCount: number }> {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.unreadOnly) searchParams.set('unreadOnly', 'true');
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return apiClient['get'](`/messages${query ? `?${query}` : ''}`, { params: undefined });
  },

  getUnreadCount(): Promise<{ count: number }> {
    return apiClient['get']('/messages/unread-count', { params: undefined });
  },

  getUnreadTotal(): Promise<UnreadCounts> {
    return apiClient['get']('/messages/unread-total', { params: undefined });
  },

  markAsRead(messageId: number): Promise<{ success: boolean }> {
    return apiClient['post'](`/messages/${messageId}/read`);
  },

  markAllAsRead(): Promise<{ success: boolean }> {
    return apiClient['post']('/messages/read-all');
  },

  deleteMessage(messageId: number): Promise<{ success: boolean }> {
    return apiClient['delete'](`/messages/${messageId}`, undefined);
  },

  // backend returns { deleted: number }
  deleteAllMessages(): Promise<{ deleted: number }> {
    return apiClient['delete']('/messages', undefined);
  },

  // =============================================================================
  // ANNOUNCEMENTS (Admin -> All)
  // =============================================================================

  getAnnouncements(includeExpired?: boolean): Promise<{ announcements: Announcement[] }> {
    const query = includeExpired ? '?includeExpired=true' : '';
    return apiClient['get'](`/messages/announcements${query}`, { params: undefined });
  },

  createAnnouncement(data: {
    title: string;
    body: string;
    priority?: 'normal' | 'high' | 'urgent';
    expiresAt?: string;
  }): Promise<{ announcement: Announcement }> {
    return apiClient['post']('/messages/announcements', data);
  },

  markAnnouncementRead(announcementId: number): Promise<{ success: boolean }> {
    return apiClient['post'](`/messages/announcements/${announcementId}/read`);
  },

  deleteAnnouncement(announcementId: number): Promise<{ success: boolean }> {
    return apiClient['delete'](`/messages/announcements/${announcementId}`, undefined);
  },

  // =============================================================================
  // DIRECT MESSAGES (User -> User)
  // =============================================================================

  getConversations(): Promise<{ conversations: Conversation[] }> {
    return apiClient['get']('/messages/conversations', {
      params: undefined,
    });
  },

  getConversation(
    userId: number,
    params?: {
      limit?: number;
      before?: string;
    },
  ): Promise<{
    otherUser: { id: number; displayName: string; avatarUrl: string | null; color: string | null };
    messages: DirectMessage[];
  }> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.before) searchParams.set('before', params.before);
    const query = searchParams.toString();

    return apiClient['get'](`/messages/conversations/${userId}${query ? `?${query}` : ''}`, {
      params: params ? { limit: params.limit, before: params.before } : undefined,
    });
  },

  sendMessage(
    toUserId: number,
    body: string,
    title?: string,
  ): Promise<{
    message: { id: number; toUserId: number; toUserName: string; body: string; createdAt: string };
  }> {
    return apiClient['post']('/messages/send', { toUserId, body, title });
  },

  // =============================================================================
  // NEW DELETION ENDPOINTS (from apps/api/src/routes/messages/direct.ts)
  // =============================================================================

  deleteDirectMessage(messageId: number): Promise<{ success: boolean }> {
    return apiClient['delete'](`/messages/direct/${messageId}`, undefined);
  },

  deleteConversation(otherUserId: number): Promise<{ success: boolean; deleted?: number }> {
    return apiClient['delete'](`/messages/conversations/${otherUserId}`, undefined);
  },
};
