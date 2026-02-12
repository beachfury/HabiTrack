-- Migration 030: Kiosk Sessions and Notification Preferences
-- Adds kiosk session flag for security and notification preferences for email

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- SESSIONS TABLE - Add kiosk flag
-- ============================================
-- Add is_kiosk column to track kiosk sessions
-- Kiosk sessions have restricted permissions and shorter TTL
ALTER TABLE `sessions`
  ADD COLUMN `is_kiosk` BOOLEAN NOT NULL DEFAULT 0 AFTER `impersonated_by`,
  ADD COLUMN `client_ip` VARCHAR(45) NULL AFTER `is_kiosk`;

-- Index for finding kiosk sessions (for security auditing)
ALTER TABLE `sessions`
  ADD KEY `idx_sessions_kiosk` (`is_kiosk`);

-- ============================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================
-- User preferences for email notifications
CREATE TABLE IF NOT EXISTS `notification_preferences` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` BIGINT UNSIGNED NOT NULL,

  -- Master email toggle
  `emailEnabled` BOOLEAN NOT NULL DEFAULT 1,

  -- Specific notification types
  `choreReminders` BOOLEAN NOT NULL DEFAULT 1,
  `choreAssignments` BOOLEAN NOT NULL DEFAULT 1,
  `choreCompletions` BOOLEAN NOT NULL DEFAULT 0,
  `eventReminders` BOOLEAN NOT NULL DEFAULT 1,
  `shoppingUpdates` BOOLEAN NOT NULL DEFAULT 0,
  `messageNotifications` BOOLEAN NOT NULL DEFAULT 1,
  `achievementNotifications` BOOLEAN NOT NULL DEFAULT 1,

  -- Reminder timing (hours before due)
  `reminderLeadTime` INT NOT NULL DEFAULT 24,

  -- Digest mode: instant, daily, or weekly summary
  `digestMode` ENUM('instant', 'daily', 'weekly') NOT NULL DEFAULT 'instant',
  `digestTime` TIME NOT NULL DEFAULT '09:00:00',
  `digestDayOfWeek` TINYINT NOT NULL DEFAULT 1, -- 1=Monday, 7=Sunday

  -- Quiet hours (no notifications during these times)
  `quietHoursEnabled` BOOLEAN NOT NULL DEFAULT 0,
  `quietHoursStart` TIME NOT NULL DEFAULT '22:00:00',
  `quietHoursEnd` TIME NOT NULL DEFAULT '07:00:00',

  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_notification_prefs_user` (`userId`),
  CONSTRAINT `fk_notification_prefs_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- EMAIL SETTINGS TABLE (Admin-only)
-- ============================================
-- Stores SMTP configuration for email sending
CREATE TABLE IF NOT EXISTS `email_settings` (
  `id` INT NOT NULL DEFAULT 1,

  -- SMTP Configuration
  `smtpHost` VARCHAR(255) NULL,
  `smtpPort` INT NULL DEFAULT 587,
  `smtpUser` VARCHAR(255) NULL,
  `smtpPassword` VARBINARY(512) NULL, -- Encrypted
  `smtpSecure` BOOLEAN NOT NULL DEFAULT 1, -- TLS

  -- From address
  `fromEmail` VARCHAR(255) NULL,
  `fromName` VARCHAR(255) NULL DEFAULT 'HabiTrack',

  -- Rate limiting
  `maxEmailsPerHour` INT NOT NULL DEFAULT 100,
  `maxEmailsPerUserPerHour` INT NOT NULL DEFAULT 20,

  -- Testing
  `lastTestSentAt` DATETIME(3) NULL,
  `lastTestResult` TEXT NULL,

  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default row
INSERT INTO `email_settings` (`id`) VALUES (1)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ============================================
-- KIOSK LOGIN AUDIT TABLE
-- ============================================
-- Tracks all kiosk login attempts for security monitoring
CREATE TABLE IF NOT EXISTS `kiosk_login_audit` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` BIGINT UNSIGNED NULL,
  `success` BOOLEAN NOT NULL,
  `ip` VARCHAR(45) NOT NULL,
  `userAgent` VARCHAR(512) NULL,
  `attemptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `failureReason` VARCHAR(100) NULL,

  PRIMARY KEY (`id`),
  KEY `idx_kiosk_audit_user` (`userId`, `attemptedAt`),
  KEY `idx_kiosk_audit_ip` (`ip`, `attemptedAt`),
  KEY `idx_kiosk_audit_success` (`success`, `attemptedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
