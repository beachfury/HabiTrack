-- Migration 009: Shopping System
-- Shopping categories, stores, catalog, lists

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- SHOPPING CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `shopping_categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `icon` VARCHAR(50) NULL,
  `color` VARCHAR(7) NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `active` BOOLEAN NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default shopping categories
INSERT IGNORE INTO `shopping_categories` (`name`, `icon`, `color`, `sortOrder`) VALUES
  ('Produce', 'carrot', '#22c55e', 1),
  ('Dairy', 'milk', '#3b82f6', 2),
  ('Meat', 'beef', '#ef4444', 3),
  ('Bakery', 'croissant', '#f59e0b', 4),
  ('Frozen', 'snowflake', '#06b6d4', 5),
  ('Pantry', 'package', '#8b5cf6', 6),
  ('Beverages', 'cup-soda', '#ec4899', 7),
  ('Household', 'home', '#6b7280', 8),
  ('Personal Care', 'heart', '#f43f5e', 9),
  ('Other', 'box', '#9ca3af', 99);

-- ============================================
-- STORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `stores` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `address` VARCHAR(500) NULL,
  `latitude` DECIMAL(10, 8) NULL,
  `longitude` DECIMAL(11, 8) NULL,
  `isDefault` BOOLEAN NOT NULL DEFAULT 0,
  `active` BOOLEAN NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default stores
INSERT IGNORE INTO `stores` (`name`, `isDefault`) VALUES
  ('Costco', 1),
  ('Walmart', 0),
  ('Target', 0),
  ('Grocery Store', 0);

-- ============================================
-- STORE REQUESTS TABLE
-- User requests to add new stores
-- ============================================
CREATE TABLE IF NOT EXISTS `store_requests` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `address` VARCHAR(500) NULL,
  `requestedBy` BIGINT UNSIGNED NULL,
  `status` ENUM('pending', 'approved', 'denied') NOT NULL DEFAULT 'pending',
  `reviewedBy` BIGINT UNSIGNED NULL,
  `reviewedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_store_requests_requested_by` FOREIGN KEY (`requestedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_store_requests_reviewed_by` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CATALOG ITEMS TABLE
-- Master product catalog
-- ============================================
CREATE TABLE IF NOT EXISTS `catalog_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `brand` VARCHAR(100) NULL,
  `sizeText` VARCHAR(100) NULL,
  `upc` VARCHAR(50) NULL,
  `categoryId` BIGINT UNSIGNED NULL,
  `unit` VARCHAR(50) NULL,
  `unitSize` DECIMAL(10, 2) NULL,
  `imageUrl` VARCHAR(500) NULL,
  `active` BOOLEAN NOT NULL DEFAULT 1,
  `createdBy` BIGINT UNSIGNED NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_catalog_items_active` (`active`),
  KEY `idx_catalog_items_category` (`categoryId`),
  KEY `idx_catalog_items_name` (`name`),
  UNIQUE KEY `uk_catalog_items_upc` (`upc`),
  CONSTRAINT `fk_catalog_items_category` FOREIGN KEY (`categoryId`) REFERENCES `shopping_categories`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_catalog_items_created_by` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ITEM PRICES TABLE
-- Current prices at each store
-- ============================================
CREATE TABLE IF NOT EXISTS `item_prices` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `catalogItemId` BIGINT UNSIGNED NOT NULL,
  `storeId` BIGINT UNSIGNED NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `unit` VARCHAR(50) NULL,
  `observedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_item_prices_item_store` (`catalogItemId`, `storeId`),
  KEY `idx_item_prices_store` (`storeId`),
  CONSTRAINT `fk_item_prices_item` FOREIGN KEY (`catalogItemId`) REFERENCES `catalog_items`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_item_prices_store` FOREIGN KEY (`storeId`) REFERENCES `stores`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ITEM PRICE HISTORY TABLE
-- Historical price tracking
-- ============================================
CREATE TABLE IF NOT EXISTS `item_price_history` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `catalogItemId` BIGINT UNSIGNED NOT NULL,
  `storeId` BIGINT UNSIGNED NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_price_history_item` (`catalogItemId`, `recordedAt`),
  CONSTRAINT `fk_price_hist_item` FOREIGN KEY (`catalogItemId`) REFERENCES `catalog_items`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SHOPPING REQUESTS TABLE
-- User requests to add items to list
-- ============================================
CREATE TABLE IF NOT EXISTS `shopping_requests` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `brand` VARCHAR(100) NULL,
  `categoryId` BIGINT UNSIGNED NULL,
  `imageUrl` VARCHAR(500) NULL,
  `requestType` ENUM('need', 'want') NOT NULL DEFAULT 'need',
  `status` ENUM('pending', 'approved', 'denied') NOT NULL DEFAULT 'pending',
  `requestedBy` BIGINT UNSIGNED NULL,
  `reviewedBy` BIGINT UNSIGNED NULL,
  `reviewedAt` DATETIME(3) NULL,
  `reviewNote` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_shopping_requests_status` (`status`),
  CONSTRAINT `fk_shopping_requests_category` FOREIGN KEY (`categoryId`) REFERENCES `shopping_categories`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_shopping_requests_requested_by` FOREIGN KEY (`requestedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_shopping_requests_reviewed_by` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SHOPPING LIST TABLE
-- Active shopping list items
-- ============================================
CREATE TABLE IF NOT EXISTS `shopping_list` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `catalogItemId` BIGINT UNSIGNED NOT NULL,
  `listType` ENUM('need', 'want') NOT NULL DEFAULT 'need',
  `storeId` BIGINT UNSIGNED NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `notes` TEXT NULL,
  `priority` ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
  `addedBy` BIGINT UNSIGNED NULL,
  `active` BOOLEAN NOT NULL DEFAULT 1,
  `purchasedAt` DATETIME(3) NULL,
  `purchasedBy` BIGINT UNSIGNED NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_shopping_list_active` (`active`),
  KEY `idx_shopping_list_store` (`storeId`),
  CONSTRAINT `fk_shopping_list_item` FOREIGN KEY (`catalogItemId`) REFERENCES `catalog_items`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shopping_list_store` FOREIGN KEY (`storeId`) REFERENCES `stores`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_shopping_list_added_by` FOREIGN KEY (`addedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_shopping_list_purchased_by` FOREIGN KEY (`purchasedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SHOPPING PURCHASE EVENTS TABLE
-- Track individual item purchases
-- ============================================
CREATE TABLE IF NOT EXISTS `shopping_purchase_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `catalogItemId` BIGINT UNSIGNED NOT NULL,
  `storeId` BIGINT UNSIGNED NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `price` DECIMAL(10, 2) NULL,
  `purchasedBy` BIGINT UNSIGNED NULL,
  `purchasedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_purchase_item` (`catalogItemId`, `purchasedAt`),
  KEY `idx_purchase_store` (`storeId`),
  KEY `idx_purchase_date` (`purchasedAt`),
  CONSTRAINT `fk_purchase_item` FOREIGN KEY (`catalogItemId`) REFERENCES `catalog_items`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_purchase_store` FOREIGN KEY (`storeId`) REFERENCES `stores`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_purchase_by` FOREIGN KEY (`purchasedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
