-- Migration 020: Budget Management System
-- Admin-only household financial tracking

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- BUDGET CATEGORIES TABLE
-- Color-coded expense categories with icons
-- ============================================
CREATE TABLE IF NOT EXISTS `budget_categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `icon` VARCHAR(50) NULL,
  `color` VARCHAR(7) NULL,
  `parentId` BIGINT UNSIGNED NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `active` BOOLEAN NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_budget_categories_parent` (`parentId`),
  KEY `idx_budget_categories_active` (`active`),
  CONSTRAINT `fk_budget_categories_parent` FOREIGN KEY (`parentId`)
    REFERENCES `budget_categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default budget categories
INSERT INTO `budget_categories` (`name`, `icon`, `color`, `sortOrder`) VALUES
  ('Housing', 'home', '#6366f1', 1),
  ('Utilities', 'zap', '#f59e0b', 2),
  ('Transportation', 'car', '#3b82f6', 3),
  ('Food', 'utensils', '#22c55e', 4),
  ('Insurance', 'shield', '#8b5cf6', 5),
  ('Debt', 'credit-card', '#ef4444', 6),
  ('Savings', 'piggy-bank', '#10b981', 7),
  ('Entertainment', 'tv', '#ec4899', 8),
  ('Personal', 'user', '#f97316', 9),
  ('Family', 'users', '#14b8a6', 10),
  ('Other', 'more-horizontal', '#6b7280', 99);

-- ============================================
-- BUDGETS TABLE
-- Individual budget items (Electric Bill, Car Payment, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS `budgets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `categoryId` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `budgetAmount` DECIMAL(10, 2) NOT NULL,
  `periodType` ENUM('monthly', 'yearly', 'weekly', 'one-time') NOT NULL DEFAULT 'monthly',
  `startDate` DATE NULL,
  `endDate` DATE NULL,
  `isRecurring` BOOLEAN NOT NULL DEFAULT 1,
  `dueDay` INT NULL,
  `active` BOOLEAN NOT NULL DEFAULT 1,
  `createdBy` BIGINT UNSIGNED NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_budgets_category` (`categoryId`),
  KEY `idx_budgets_active` (`active`),
  KEY `idx_budgets_period` (`periodType`),
  CONSTRAINT `fk_budgets_category` FOREIGN KEY (`categoryId`)
    REFERENCES `budget_categories`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_budgets_created_by` FOREIGN KEY (`createdBy`)
    REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BUDGET ENTRIES TABLE
-- Individual transactions/expenses
-- ============================================
CREATE TABLE IF NOT EXISTS `budget_entries` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `budgetId` BIGINT UNSIGNED NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `description` TEXT NULL,
  `transactionDate` DATE NOT NULL,
  `paymentMethod` VARCHAR(100) NULL,
  `vendor` VARCHAR(255) NULL,
  `receiptUrl` VARCHAR(500) NULL,
  `notes` TEXT NULL,
  `createdBy` BIGINT UNSIGNED NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_budget_entries_budget` (`budgetId`),
  KEY `idx_budget_entries_date` (`transactionDate`),
  KEY `idx_budget_entries_created` (`createdAt`),
  CONSTRAINT `fk_budget_entries_budget` FOREIGN KEY (`budgetId`)
    REFERENCES `budgets`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_budget_entries_created_by` FOREIGN KEY (`createdBy`)
    REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BUDGET HISTORY TABLE
-- Track budget limit changes over time
-- ============================================
CREATE TABLE IF NOT EXISTS `budget_history` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `budgetId` BIGINT UNSIGNED NOT NULL,
  `previousAmount` DECIMAL(10, 2) NOT NULL,
  `newAmount` DECIMAL(10, 2) NOT NULL,
  `reason` TEXT NULL,
  `changedBy` BIGINT UNSIGNED NOT NULL,
  `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_budget_history_budget` (`budgetId`),
  KEY `idx_budget_history_changed` (`changedAt`),
  CONSTRAINT `fk_budget_history_budget` FOREIGN KEY (`budgetId`)
    REFERENCES `budgets`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_budget_history_changed_by` FOREIGN KEY (`changedBy`)
    REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
