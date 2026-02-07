-- Migration 018: Paid Chores (Chore Race Feature)
-- Admin creates paid chores, users race to claim them first

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- PAID CHORES TABLE
-- Chores with monetary rewards that users race to claim
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
