-- Migration 004: Notifications and Messages
-- Email outbox, in-app notifications, messages

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
-- MESSAGES (User-to-user or system messages)
-- ============================================
CREATE TABLE IF NOT EXISTS `messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` BIGINT UNSIGNED NOT NULL,
  `type` ENUM('chore', 'calendar', 'shopping', 'family', 'system') NOT NULL DEFAULT 'system',
  `title` VARCHAR(255) NOT NULL,
  `body` TEXT NULL,
  `link` VARCHAR(500) NULL,
  `relatedId` BIGINT UNSIGNED NULL,
  `relatedType` VARCHAR(50) NULL,
  `readAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_messages_user` (`userId`),
  KEY `idx_messages_read` (`userId`, `readAt`),
  CONSTRAINT `fk_messages_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
