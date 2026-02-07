-- Migration 006: Chores Core Tables
-- Categories, templates, and chore definitions

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- CHORE CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `chore_categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `icon` VARCHAR(50) NULL,
  `color` VARCHAR(7) NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `active` BOOLEAN NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default categories
INSERT IGNORE INTO `chore_categories` (`name`, `icon`, `color`, `sortOrder`) VALUES
  ('Cleaning', 'spray-can', '#10b981', 1),
  ('Kitchen', 'utensils', '#f59e0b', 2),
  ('Laundry', 'shirt', '#3b82f6', 3),
  ('Outdoor', 'tree', '#22c55e', 4),
  ('Pet Care', 'paw-print', '#ec4899', 5),
  ('Other', 'box', '#6b7280', 99);

-- ============================================
-- CHORE TEMPLATES TABLE
-- Reusable chore definitions for quick assignment
-- ============================================
CREATE TABLE IF NOT EXISTS `chore_templates` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `categoryId` BIGINT UNSIGNED NULL,
  `defaultPoints` INT NOT NULL DEFAULT 10,
  `estimatedMinutes` INT NULL,
  `difficulty` ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
  `requiresPhoto` BOOLEAN NOT NULL DEFAULT 0,
  `requireApproval` BOOLEAN NOT NULL DEFAULT 0,
  `isSystem` BOOLEAN NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_chore_templates_category` (`categoryId`),
  CONSTRAINT `fk_chore_templates_category` FOREIGN KEY (`categoryId`) REFERENCES `chore_categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CHORES TABLE
-- Active chore definitions assigned to family members
-- ============================================
CREATE TABLE IF NOT EXISTS `chores` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `categoryId` BIGINT UNSIGNED NULL,
  `difficulty` ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
  `estimatedMinutes` INT NULL,
  `points` INT NOT NULL DEFAULT 10,
  `recurrenceType` ENUM('once', 'daily', 'weekly', 'monthly', 'yearly', 'custom', 'x_days') NOT NULL DEFAULT 'once',
  `recurrenceInterval` INT NOT NULL DEFAULT 1,
  `recurrenceDays` VARCHAR(50) NULL,
  `dueTime` TIME NULL,
  `assignedTo` BIGINT UNSIGNED NULL,
  `assignmentMode` ENUM('fixed', 'rotating', 'fair', 'anyone') NOT NULL DEFAULT 'fixed',
  `requirePhoto` BOOLEAN NOT NULL DEFAULT 0,
  `requireApproval` BOOLEAN NOT NULL DEFAULT 0,
  `startDate` DATE NULL,
  `endDate` DATE NULL,
  `active` BOOLEAN NOT NULL DEFAULT 1,
  `createdBy` BIGINT UNSIGNED NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_chores_category` (`categoryId`),
  KEY `idx_chores_assigned` (`assignedTo`),
  KEY `idx_chores_active` (`active`),
  CONSTRAINT `fk_chores_category` FOREIGN KEY (`categoryId`) REFERENCES `chore_categories`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_chores_assigned` FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_chores_created_by` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
