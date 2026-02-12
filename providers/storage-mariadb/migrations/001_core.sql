-- Migration 001: Core System
-- Foundation tables: settings, users, auth, permissions, audit
-- Consolidated from migrations 001, 002, 003, 013, 014

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- SETTINGS TABLE
-- Global household configuration
-- ============================================
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `householdName` VARCHAR(100) NULL DEFAULT 'Our Family',
  `brandColor` VARCHAR(7) NULL DEFAULT '#3cb371',
  `logoUrl` VARCHAR(500) NULL,
  `loginBackground` ENUM('gradient', 'solid', 'image') NOT NULL DEFAULT 'gradient',
  `loginBackgroundValue` VARCHAR(500) NULL,
  `defaultThemeId` VARCHAR(36) NULL,
  `kidAllowedThemeIds` JSON NULL,
  `isBootstrapped` BOOLEAN NOT NULL DEFAULT 0,
  `timezone` VARCHAR(50) NULL DEFAULT 'America/Los_Angeles',
  `locale` VARCHAR(10) NULL DEFAULT 'en-US',
  `allowedOrigins` TEXT NULL,
  `trustedProxies` TEXT NULL,
  `localCidrs` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `settings` (`id`, `householdName`, `isBootstrapped`) VALUES (1, 'Our Family', 0);

-- ============================================
-- USERS TABLE
-- Family members
-- ============================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NULL,
  `displayName` VARCHAR(100) NOT NULL,
  `nickname` VARCHAR(50) NULL,
  `color` VARCHAR(7) NULL DEFAULT '#3cb371',
  `avatarUrl` VARCHAR(500) NULL,
  `roleId` ENUM('admin', 'member', 'kid', 'kiosk') NOT NULL DEFAULT 'member',
  `pin` VARCHAR(255) NULL,
  `dateOfBirth` DATE NULL,
  `kioskOnly` BOOLEAN NOT NULL DEFAULT 0,
  `active` BOOLEAN NOT NULL DEFAULT 1,
  `firstLoginRequired` BOOLEAN NOT NULL DEFAULT 0,
  `totalPoints` INT NOT NULL DEFAULT 0,
  `theme` VARCHAR(20) NULL DEFAULT 'system',
  `accentColor` VARCHAR(7) NULL DEFAULT '#3cb371',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`),
  KEY `idx_users_active` (`active`),
  KEY `idx_users_role` (`roleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CREDENTIALS TABLE
-- Password hashes and external auth
-- ============================================
CREATE TABLE IF NOT EXISTS `credentials` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` BIGINT UNSIGNED NOT NULL,
  `provider` VARCHAR(50) NOT NULL DEFAULT 'password',
  `algo` VARCHAR(20) NULL,
  `salt` VARBINARY(64) NULL,
  `hash` VARBINARY(128) NULL,
  `externalId` VARCHAR(255) NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_credentials_user` (`userId`),
  KEY `idx_credentials_provider` (`provider`),
  CONSTRAINT `fk_credentials_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SESSIONS TABLE
-- Active login sessions
-- ============================================
CREATE TABLE IF NOT EXISTS `sessions` (
  `sid` VARCHAR(64) NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `role` VARCHAR(20) NOT NULL,
  `created_at` DATETIME(3) NOT NULL,
  `last_seen_at` DATETIME(3) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `impersonated_by` BIGINT UNSIGNED NULL,
  `is_kiosk` BOOLEAN NOT NULL DEFAULT 0,
  `client_ip` VARCHAR(45) NULL,
  PRIMARY KEY (`sid`),
  KEY `idx_sessions_user` (`user_id`),
  KEY `idx_sessions_expires` (`expires_at`),
  KEY `idx_sessions_kiosk` (`is_kiosk`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PASSWORD RESETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` BIGINT UNSIGNED NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `usedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_password_resets_token` (`token`),
  KEY `idx_password_resets_user` (`userId`),
  CONSTRAINT `fk_password_resets_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- LOGIN ATTEMPTS TABLE
-- Rate limiting and security
-- ============================================
CREATE TABLE IF NOT EXISTS `login_attempts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` BIGINT UNSIGNED NOT NULL,
  `ip` VARCHAR(45) NULL,
  `success` BOOLEAN NOT NULL DEFAULT 0,
  `attemptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_login_attempts_user` (`userId`, `attemptedAt`),
  KEY `idx_login_attempts_ip` (`ip`, `attemptedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PERMISSIONS TABLE
-- Role-based access control
-- ============================================
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `roleId` ENUM('admin', 'member', 'kid', 'kiosk') NOT NULL,
  `actionPattern` VARCHAR(255) NOT NULL,
  `effect` ENUM('allow', 'deny') NOT NULL DEFAULT 'allow',
  `localOnly` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_permissions_role_action` (`roleId`, `actionPattern`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `permissions` (`roleId`, `actionPattern`, `effect`, `localOnly`) VALUES
  ('admin', '*', 'allow', 0),
  ('kiosk', 'dashboard.read', 'allow', 1);

-- ============================================
-- BOOTSTRAP LOCK TABLE
-- Prevents multiple bootstrap operations
-- ============================================
CREATE TABLE IF NOT EXISTS `bootstrap_lock` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `locked` BOOLEAN NOT NULL DEFAULT 0,
  `lockedAt` DATETIME(3) NULL,
  `lockedBy` VARCHAR(255) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `bootstrap_lock` (`id`, `locked`) VALUES (1, 0);

-- ============================================
-- AUDIT LOG TABLE
-- Security and activity tracking
-- ============================================
CREATE TABLE IF NOT EXISTS `audit_log` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actorId` INT UNSIGNED NULL,
  `userId` BIGINT UNSIGNED NULL,
  `action` VARCHAR(100) NOT NULL,
  `target` VARCHAR(255) NULL,
  `result` ENUM('ok', 'deny', 'error') NULL DEFAULT 'ok',
  `resource` VARCHAR(100) NULL,
  `resourceId` VARCHAR(100) NULL,
  `details` JSON NULL,
  `ip` VARCHAR(45) NULL,
  `ua` TEXT NULL,
  `userAgent` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_audit_log_user` (`userId`),
  KEY `idx_audit_log_action` (`action`),
  KEY `idx_audit_log_created` (`createdAt`),
  KEY `idx_audit_actorId` (`actorId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- POINTS ADJUSTMENTS TABLE
-- Manual point adjustments by admins
-- ============================================
CREATE TABLE IF NOT EXISTS `points_adjustments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` BIGINT UNSIGNED NOT NULL,
  `amount` INT NOT NULL,
  `reason` VARCHAR(255),
  `adjustedBy` BIGINT UNSIGNED NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_points_adjustments_userId` (`userId`),
  KEY `idx_points_adjustments_createdAt` (`createdAt`),
  CONSTRAINT `fk_points_adj_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_points_adj_admin` FOREIGN KEY (`adjustedBy`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
