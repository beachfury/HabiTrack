// apps/api/src/routes/messages/direct.ts
// Re-exports from split modules for backward compatibility
// Direct messaging and announcements API

// Announcements (Admin -> All Users)
export {
  createAnnouncementInternal,
  createAnnouncement,
  getAnnouncements,
  markAnnouncementRead,
  deleteAnnouncement,
  type CreateAnnouncementParams,
} from './announcements';

// Direct Messages (User -> User)
export {
  sendDirectMessage,
  deleteDirectMessage,
} from './direct-messages';

// Conversations
export {
  getConversations,
  getConversation,
  deleteConversation,
  getUnreadTotal,
} from './conversations';
