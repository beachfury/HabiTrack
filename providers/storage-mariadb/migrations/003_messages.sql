-- Migration 003: Messages and Notifications
-- Email outbox, in-app notifications, messages, announcements, conversations
-- Consolidated from migrations 004, 015, 016

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- NOTIFICATIONS OUTBOX (Email queue)
-- ============================================
CREATE TABLE IF NOT EXISTS `notifications_outbox` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kind` VARCHAR(64) NOT NULL,
  `userId` BIGINT UNSIGNED NOT NULL,
  `to_email` VARCHAR(255) NULL,
  `subject` VARCHAR(255) NOT NULL,
  `body_text` TEXT NULL,
  `body_html` TEXT NULL,
  `attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `last_error` TEXT NULL,
  `scheduledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `sentAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_outbox_user` (`userId`),
  KEY `idx_outbox_pending` (`sentAt`, `scheduledAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- NOTIFICATIONS (In-app)
-- ============================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` BIGINT UNSIGNED NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'system',
  `title` VARCHAR(255) NOT NULL,
  `body` TEXT NULL,
  `link` VARCHAR(500) NULL,
  `relatedId` BIGINT UNSIGNED NULL,
  `relatedType` VARCHAR(50) NULL,
  `read` BOOLEAN NOT NULL DEFAULT 0,
  `readAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`userId`),
  KEY `idx_notifications_read` (`userId`, `read`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MESSAGES TABLE
-- User-to-user messages and announcements
-- ============================================
CREATE TABLE IF NOT EXISTS `messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` BIGINT UNSIGNED NOT NULL,
  `fromUserId` BIGINT UNSIGNED NULL,
  `toUserId` BIGINT UNSIGNED NULL,
  `type` ENUM('chore', 'calendar', 'shopping', 'family', 'system') NOT NULL DEFAULT 'system',
  `isAnnouncement` TINYINT(1) NOT NULL DEFAULT 0,
  `title` VARCHAR(255) NOT NULL,
  `body` TEXT NULL,
  `priority` ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
  `expiresAt` DATETIME(3) NULL,
  `link` VARCHAR(500) NULL,
  `relatedId` BIGINT UNSIGNED NULL,
  `relatedType` VARCHAR(50) NULL,
  `readAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_messages_user` (`userId`),
  KEY `idx_messages_read` (`userId`, `readAt`),
  KEY `idx_messages_announcement` (`isAnnouncement`),
  KEY `idx_messages_from_user` (`fromUserId`),
  KEY `idx_messages_to_user` (`toUserId`),
  KEY `idx_messages_expires` (`expiresAt`),
  CONSTRAINT `fk_messages_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_from_user` FOREIGN KEY (`fromUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_messages_to_user` FOREIGN KEY (`toUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ANNOUNCEMENT READS TABLE
-- Track which users have read announcements
-- ============================================
CREATE TABLE IF NOT EXISTS `announcement_reads` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `messageId` BIGINT UNSIGNED NOT NULL,
  `userId` BIGINT UNSIGNED NOT NULL,
  `readAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_announcement_user` (`messageId`, `userId`),
  KEY `idx_announcement_reads_user` (`userId`),
  CONSTRAINT `fk_announcement_reads_message` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_announcement_reads_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CONVERSATIONS TABLE
-- Direct message threads between users
-- ============================================
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user1Id` BIGINT UNSIGNED NOT NULL,
  `user2Id` BIGINT UNSIGNED NOT NULL,
  `lastMessageAt` DATETIME(3) NULL,
  `lastMessagePreview` VARCHAR(100) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conversation_users` (`user1Id`, `user2Id`),
  KEY `idx_conversations_user1` (`user1Id`),
  KEY `idx_conversations_user2` (`user2Id`),
  CONSTRAINT `fk_conversations_user1` FOREIGN KEY (`user1Id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_conversations_user2` FOREIGN KEY (`user2Id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
