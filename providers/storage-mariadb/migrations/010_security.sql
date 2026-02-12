-- Migration 010: Security & Notifications
-- Notification preferences, email settings, kiosk audit, color swatches
-- Consolidated from migrations 012, 030

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- NOTIFICATION PREFERENCES TABLE
-- User preferences for email notifications
-- ============================================
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
-- Stores SMTP configuration for email sending
-- ============================================
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
-- Tracks all kiosk login attempts for security monitoring
-- ============================================
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

-- ============================================
-- COLOR SWATCHES TABLE
-- Store custom colors that users create
-- ============================================
CREATE TABLE IF NOT EXISTS `color_swatches` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NULL,
  `hexColor` VARCHAR(7) NOT NULL,
  `isDefault` BOOLEAN NOT NULL DEFAULT 0,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `createdBy` BIGINT UNSIGNED NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_color_swatches_default` (`isDefault`),
  KEY `idx_color_swatches_created_by` (`createdBy`),
  CONSTRAINT `fk_color_swatches_created_by` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- RECENT COLORS TABLE
-- Track recently used colors per user
-- ============================================
CREATE TABLE IF NOT EXISTS `recent_colors` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` BIGINT UNSIGNED NOT NULL,
  `hexColor` VARCHAR(7) NOT NULL,
  `usedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_recent_colors_user` (`userId`, `usedAt`),
  CONSTRAINT `fk_recent_colors_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DEFAULT COLOR SWATCHES
-- ============================================
INSERT INTO `color_swatches` (`name`, `hexColor`, `isDefault`, `sortOrder`) VALUES
  -- Primary colors
  ('Red', '#ef4444', 1, 1),
  ('Orange', '#f97316', 1, 2),
  ('Amber', '#f59e0b', 1, 3),
  ('Yellow', '#eab308', 1, 4),
  ('Lime', '#84cc16', 1, 5),
  ('Green', '#22c55e', 1, 6),
  ('Emerald', '#10b981', 1, 7),
  ('Teal', '#14b8a6', 1, 8),
  ('Cyan', '#06b6d4', 1, 9),
  ('Sky', '#0ea5e9', 1, 10),
  ('Blue', '#3b82f6', 1, 11),
  ('Indigo', '#6366f1', 1, 12),
  ('Violet', '#8b5cf6', 1, 13),
  ('Purple', '#a855f7', 1, 14),
  ('Fuchsia', '#d946ef', 1, 15),
  ('Pink', '#ec4899', 1, 16),
  ('Rose', '#f43f5e', 1, 17),
  -- Neutrals
  ('Slate', '#64748b', 1, 18),
  ('Gray', '#6b7280', 1, 19),
  ('Zinc', '#71717a', 1, 20),
  ('Stone', '#78716c', 1, 21),
  -- Dark variants
  ('Dark Red', '#b91c1c', 1, 22),
  ('Dark Green', '#15803d', 1, 23),
  ('Dark Blue', '#1d4ed8', 1, 24),
  ('Dark Purple', '#7c3aed', 1, 25);

SET FOREIGN_KEY_CHECKS = 1;
