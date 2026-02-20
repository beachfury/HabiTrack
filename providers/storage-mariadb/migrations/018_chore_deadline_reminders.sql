-- Migration 018: Chore Deadline Reminders
-- Household-wide settings for timed chore completion reminders
-- Up to 4 configurable check times per day

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- ADD DEADLINE REMINDER COLUMNS TO SETTINGS
-- Admin-configurable check times (up to 4)
-- ============================================
ALTER TABLE `settings`
  ADD COLUMN IF NOT EXISTS `choreDeadlineReminder1Enabled` BOOLEAN NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `choreDeadlineReminder1Time` TIME NOT NULL DEFAULT '12:00:00',
  ADD COLUMN IF NOT EXISTS `choreDeadlineReminder2Enabled` BOOLEAN NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `choreDeadlineReminder2Time` TIME NOT NULL DEFAULT '19:00:00',
  ADD COLUMN IF NOT EXISTS `choreDeadlineReminder3Enabled` BOOLEAN NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `choreDeadlineReminder3Time` TIME NOT NULL DEFAULT '15:00:00',
  ADD COLUMN IF NOT EXISTS `choreDeadlineReminder4Enabled` BOOLEAN NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `choreDeadlineReminder4Time` TIME NOT NULL DEFAULT '21:00:00';

-- ============================================
-- CHORE DEADLINE REMINDERS SENT (dedup table)
-- Tracks which reminders have been sent to prevent duplicates
-- ============================================
CREATE TABLE IF NOT EXISTS `chore_deadline_reminders_sent` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `instanceId` BIGINT UNSIGNED NOT NULL,
  `reminderSlot` TINYINT NOT NULL,
  `sentDate` DATE NOT NULL,
  `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_deadline_reminder` (`instanceId`, `reminderSlot`, `sentDate`),
  KEY `idx_deadline_sent_date` (`sentDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
