-- Migration 003: Permissions and Security
-- Role-based permissions, bootstrap lock, audit logging

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- PERMISSIONS TABLE
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

-- Default permissions
INSERT IGNORE INTO `permissions` (`roleId`, `actionPattern`, `effect`, `localOnly`) VALUES
  ('admin', '*', 'allow', 0),
  ('kiosk', 'dashboard.read', 'allow', 1);

-- ============================================
-- BOOTSTRAP LOCK TABLE
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
-- ============================================
CREATE TABLE IF NOT EXISTS `audit_log` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` BIGINT UNSIGNED NULL,
  `action` VARCHAR(100) NOT NULL,
  `resource` VARCHAR(100) NULL,
  `resourceId` VARCHAR(100) NULL,
  `details` JSON NULL,
  `ip` VARCHAR(45) NULL,
  `userAgent` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_audit_log_user` (`userId`),
  KEY `idx_audit_log_action` (`action`),
  KEY `idx_audit_log_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
