-- Migration 014: Income Tracking & Holiday Settings
-- Adds monthly income management tables and holiday country configuration

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- MONTHLY INCOME TABLE
-- Track income sources (salary, bonus, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS `monthly_income` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `incomeType` ENUM('salary', 'bonus', 'side-income', 'investment', 'other') NOT NULL DEFAULT 'salary',
  `frequency` ENUM('monthly', 'bi-weekly', 'weekly', 'yearly', 'one-time', 'irregular') NOT NULL DEFAULT 'monthly',
  `dayOfMonth` INT NULL,
  `startDate` DATE NULL,
  `endDate` DATE NULL,
  `active` BOOLEAN NOT NULL DEFAULT 1,
  `createdBy` BIGINT UNSIGNED NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_monthly_income_active` (`active`),
  KEY `idx_monthly_income_created_by` (`createdBy`),
  CONSTRAINT `fk_monthly_income_created_by` FOREIGN KEY (`createdBy`)
    REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MONTHLY INCOME ENTRIES TABLE
-- Track actual received income
-- ============================================
CREATE TABLE IF NOT EXISTS `monthly_income_entries` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `incomeId` BIGINT UNSIGNED NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `receivedDate` DATE NOT NULL,
  `notes` TEXT NULL,
  `createdBy` BIGINT UNSIGNED NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_income_entries_income` (`incomeId`),
  KEY `idx_income_entries_date` (`receivedDate`),
  CONSTRAINT `fk_income_entries_income` FOREIGN KEY (`incomeId`)
    REFERENCES `monthly_income`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_income_entries_created_by` FOREIGN KEY (`createdBy`)
    REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- HOLIDAY SETTINGS
-- Add holidayCountries JSON column to settings
-- ============================================
ALTER TABLE `settings` ADD COLUMN IF NOT EXISTS `holidayCountries` JSON NULL;

SET FOREIGN_KEY_CHECKS = 1;
