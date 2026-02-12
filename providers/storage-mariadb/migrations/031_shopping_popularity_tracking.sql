-- Migration 031: Shopping Popularity Tracking
-- Tracks how often items are added to shopping lists for better suggestions

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- ITEM ADD EVENTS TABLE
-- Tracks every time an item is added to the shopping list
-- Used to calculate popularity for suggestions
-- ============================================
CREATE TABLE IF NOT EXISTS `item_add_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `catalogItemId` BIGINT UNSIGNED NOT NULL,
  `addedBy` BIGINT UNSIGNED NULL,
  `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_item_add_events_catalog` (`catalogItemId`),
  KEY `idx_item_add_events_date` (`addedAt`),
  CONSTRAINT `fk_item_add_events_catalog` FOREIGN KEY (`catalogItemId`) REFERENCES `catalog_items`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_item_add_events_user` FOREIGN KEY (`addedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ITEM POPULARITY CACHE TABLE
-- Precomputed popularity scores updated periodically
-- Avoids expensive COUNT queries on every suggestion request
-- ============================================
CREATE TABLE IF NOT EXISTS `item_popularity` (
  `catalogItemId` BIGINT UNSIGNED NOT NULL,
  `addCount30Days` INT UNSIGNED NOT NULL DEFAULT 0,
  `addCount90Days` INT UNSIGNED NOT NULL DEFAULT 0,
  `addCountAllTime` INT UNSIGNED NOT NULL DEFAULT 0,
  `lastAddedAt` DATETIME(3) NULL,
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`catalogItemId`),
  KEY `idx_item_popularity_30d` (`addCount30Days` DESC),
  KEY `idx_item_popularity_90d` (`addCount90Days` DESC),
  CONSTRAINT `fk_item_popularity_catalog` FOREIGN KEY (`catalogItemId`) REFERENCES `catalog_items`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
