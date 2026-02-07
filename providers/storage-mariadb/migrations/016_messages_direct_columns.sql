-- Migration 016: Add direct messaging columns to messages table
-- Required for announcements and direct messages

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Add missing columns to messages table
ALTER TABLE `messages`
  ADD COLUMN IF NOT EXISTS `fromUserId` BIGINT UNSIGNED NULL AFTER `userId`,
  ADD COLUMN IF NOT EXISTS `toUserId` BIGINT UNSIGNED NULL AFTER `fromUserId`,
  ADD COLUMN IF NOT EXISTS `isAnnouncement` TINYINT(1) NOT NULL DEFAULT 0 AFTER `type`,
  ADD COLUMN IF NOT EXISTS `priority` ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal' AFTER `body`,
  ADD COLUMN IF NOT EXISTS `expiresAt` DATETIME(3) NULL AFTER `priority`;

-- Add foreign keys for the new columns
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_messages_from_user` FOREIGN KEY (`fromUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_messages_to_user` FOREIGN KEY (`toUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE;

-- Add indexes for efficient queries
ALTER TABLE `messages`
  ADD INDEX IF NOT EXISTS `idx_messages_announcement` (`isAnnouncement`),
  ADD INDEX IF NOT EXISTS `idx_messages_from_user` (`fromUserId`),
  ADD INDEX IF NOT EXISTS `idx_messages_to_user` (`toUserId`),
  ADD INDEX IF NOT EXISTS `idx_messages_expires` (`expiresAt`);

SET FOREIGN_KEY_CHECKS = 1;
