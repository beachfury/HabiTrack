-- Migration 007: Chore Instances and Tracking
-- Individual chore instances, points, streaks

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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
  -- Composite indexes for common queries
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

SET FOREIGN_KEY_CHECKS = 1;
