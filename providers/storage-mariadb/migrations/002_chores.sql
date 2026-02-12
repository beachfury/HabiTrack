-- Migration 002: Chores System
-- Categories, templates, chores, instances, points, streaks, achievements, paid chores
-- Consolidated from migrations 006, 007, 008, 018

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

-- ============================================
-- CHORE INSTANCES TABLE
-- Individual scheduled occurrences of chores
-- ============================================
CREATE TABLE IF NOT EXISTS `chore_instances` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `choreId` BIGINT UNSIGNED NOT NULL,
  `dueDate` DATE NOT NULL,
  `assignedTo` BIGINT UNSIGNED NULL,
  `status` ENUM('pending', 'completed', 'approved', 'skipped', 'rejected') NOT NULL DEFAULT 'pending',
  `completedBy` BIGINT UNSIGNED NULL,
  `completedAt` DATETIME(3) NULL,
  `completionNotes` TEXT NULL,
  `photoUrl` VARCHAR(500) NULL,
  `pointsAwarded` INT NULL,
  `approvedBy` BIGINT UNSIGNED NULL,
  `approvedAt` DATETIME(3) NULL,
  `rejectionReason` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_chore_instances_chore` (`choreId`),
  KEY `idx_chore_instances_due` (`dueDate`),
  KEY `idx_chore_instances_assigned` (`assignedTo`),
  KEY `idx_chore_instances_status` (`status`),
  KEY `idx_chore_instances_assigned_date_status` (`assignedTo`, `dueDate`, `status`),
  KEY `idx_chore_instances_completed_by_status` (`completedBy`, `status`, `completedAt`),
  CONSTRAINT `fk_chore_instances_chore` FOREIGN KEY (`choreId`) REFERENCES `chores`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chore_instances_assigned` FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_chore_instances_completed_by` FOREIGN KEY (`completedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_chore_instances_approved_by` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CHORE POINTS TABLE
-- Point transaction history
-- ============================================
CREATE TABLE IF NOT EXISTS `chore_points` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` BIGINT UNSIGNED NOT NULL,
  `points` INT NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `choreInstanceId` BIGINT UNSIGNED NULL,
  `awardedBy` BIGINT UNSIGNED NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_chore_points_user` (`userId`),
  KEY `idx_chore_points_created` (`createdAt`),
  CONSTRAINT `fk_chore_points_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chore_points_instance` FOREIGN KEY (`choreInstanceId`) REFERENCES `chore_instances`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_chore_points_awarded_by` FOREIGN KEY (`awardedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CHORE STREAKS TABLE
-- Track consecutive completion streaks
-- ============================================
CREATE TABLE IF NOT EXISTS `chore_streaks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` BIGINT UNSIGNED NOT NULL,
  `choreId` BIGINT UNSIGNED NULL,
  `currentStreak` INT NOT NULL DEFAULT 0,
  `longestStreak` INT NOT NULL DEFAULT 0,
  `lastCompletedDate` DATE NULL,
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_chore_streaks_user_chore` (`userId`, `choreId`),
  CONSTRAINT `fk_chore_streaks_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chore_streaks_chore` FOREIGN KEY (`choreId`) REFERENCES `chores`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CHORE ACHIEVEMENTS TABLE
-- Achievement definitions
-- ============================================
CREATE TABLE IF NOT EXISTS `chore_achievements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `icon` VARCHAR(50) NULL,
  `criteria` JSON NULL,
  `points` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default achievements
INSERT IGNORE INTO `chore_achievements` (`name`, `description`, `icon`, `points`) VALUES
  ('First Chore', 'Complete your first chore', 'star', 10),
  ('Week Warrior', 'Complete 7 chores in a week', 'calendar', 50),
  ('Streak Master', 'Maintain a 30-day streak', 'flame', 100),
  ('Point Collector', 'Earn 1000 total points', 'coins', 200),
  ('Early Bird', 'Complete a chore before 8 AM', 'sunrise', 25),
  ('Night Owl', 'Complete a chore after 9 PM', 'moon', 25),
  ('Team Player', 'Help complete 10 chores for others', 'users', 75),
  ('Perfectionist', 'Get 10 chores approved without rejection', 'check-circle', 100);

-- ============================================
-- USER ACHIEVEMENTS TABLE
-- Track which users have earned which achievements
-- ============================================
CREATE TABLE IF NOT EXISTS `user_achievements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` BIGINT UNSIGNED NOT NULL,
  `achievementId` BIGINT UNSIGNED NOT NULL,
  `earnedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_achievements` (`userId`, `achievementId`),
  CONSTRAINT `fk_user_achievements_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_achievements_achievement` FOREIGN KEY (`achievementId`) REFERENCES `chore_achievements`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PAID CHORES TABLE
-- Chores with monetary rewards (Chore Race feature)
-- ============================================
CREATE TABLE IF NOT EXISTS `paid_chores` (
  `id` CHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `categoryId` BIGINT UNSIGNED NULL,
  `difficulty` ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
  `estimatedMinutes` INT NULL,
  `requirePhoto` BOOLEAN NOT NULL DEFAULT 0,
  `status` ENUM('available', 'claimed', 'completed', 'verified', 'cancelled') NOT NULL DEFAULT 'available',
  `claimedBy` BIGINT UNSIGNED NULL,
  `claimedAt` DATETIME(3) NULL,
  `completedAt` DATETIME(3) NULL,
  `verifiedAt` DATETIME(3) NULL,
  `verifiedBy` BIGINT UNSIGNED NULL,
  `completionNotes` TEXT NULL,
  `completionPhotoUrl` VARCHAR(500) NULL,
  `expiresAt` DATETIME(3) NULL,
  `createdBy` BIGINT UNSIGNED NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_paid_chores_status` (`status`),
  KEY `idx_paid_chores_claimed_by` (`claimedBy`),
  KEY `idx_paid_chores_created_by` (`createdBy`),
  KEY `idx_paid_chores_category` (`categoryId`),
  CONSTRAINT `fk_paid_chores_claimed_by` FOREIGN KEY (`claimedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_paid_chores_created_by` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_paid_chores_verified_by` FOREIGN KEY (`verifiedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_paid_chores_category` FOREIGN KEY (`categoryId`) REFERENCES `chore_categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PAID CHORE EARNINGS TABLE
-- Track total earnings per user
-- ============================================
CREATE TABLE IF NOT EXISTS `paid_chore_earnings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` BIGINT UNSIGNED NOT NULL,
  `paidChoreId` CHAR(36) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `earnedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_earnings_user` (`userId`),
  KEY `idx_earnings_chore` (`paidChoreId`),
  CONSTRAINT `fk_earnings_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_earnings_chore` FOREIGN KEY (`paidChoreId`) REFERENCES `paid_chores`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
