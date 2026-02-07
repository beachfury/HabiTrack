-- Migration 001: Core Settings and Users
-- Foundation tables for the application

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `householdName` VARCHAR(100) NULL DEFAULT 'Our Family',
  `brandColor` VARCHAR(7) NULL DEFAULT '#8b5cf6',
  `logoUrl` VARCHAR(500) NULL,
  `loginBackground` ENUM('gradient', 'solid', 'image') NOT NULL DEFAULT 'gradient',
  `loginBackgroundValue` VARCHAR(500) NULL,
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
-- ============================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NULL,
  `displayName` VARCHAR(100) NOT NULL,
  `nickname` VARCHAR(50) NULL,
  `color` VARCHAR(7) NULL DEFAULT '#3b82f6',
  `avatarUrl` VARCHAR(500) NULL,
  `roleId` ENUM('admin', 'member', 'kid', 'kiosk') NOT NULL DEFAULT 'member',
  `pin` VARCHAR(255) NULL,
  `dateOfBirth` DATE NULL,
  `kioskOnly` BOOLEAN NOT NULL DEFAULT 0,
  `active` BOOLEAN NOT NULL DEFAULT 1,
  `firstLoginRequired` BOOLEAN NOT NULL DEFAULT 0,
  `totalPoints` INT NOT NULL DEFAULT 0,
  `theme` VARCHAR(20) NULL DEFAULT 'system',
  `accentColor` VARCHAR(7) NULL DEFAULT '#3b82f6',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`),
  KEY `idx_users_active` (`active`),
  KEY `idx_users_role` (`roleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
