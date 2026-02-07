// apps/web/src/types/messages.ts
// Message and notification related types

export type MessageType = 'chore' | 'calendar' | 'family' | 'system' | 'shopping';

export interface Message {
  id: number;
  type: MessageType;
  title: string;
  body: string | null;
  link: string | null;
  relatedId: number | null;
  relatedType: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface MessageThread {
  id: number;
  type: MessageType;
  title: string;
  lastMessage: string | null;
  unreadCount: number;
  updatedAt: string;
}
