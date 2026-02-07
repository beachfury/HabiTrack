// apps/api/src/routes/messages/index.ts
// Messages routes - central export

// Notifications (system-generated)
export {
  createNotification,
  getMessages,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteMessage,
  deleteAllRead,
} from './notifications';

// Direct messages and announcements
export {
  createAnnouncement,
  createAnnouncementInternal,
  getAnnouncements,
  markAnnouncementRead,
  deleteAnnouncement,
  sendDirectMessage,
  getConversations,
  getConversation,
  getUnreadTotal,
} from './direct';
