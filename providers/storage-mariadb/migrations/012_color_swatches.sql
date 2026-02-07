-- Migration 012: Color Swatches
-- User-saved custom color swatches

SET NAMES utf8mb4;

-- ============================================
-- COLOR SWATCHES TABLE
-- Store custom colors that users create
-- ============================================
CREATE TABLE IF NOT EXISTS `color_swatches` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NULL,
  `hexColor` VARCHAR(7) NOT NULL,
  `isDefault` BOOLEAN NOT NULL DEFAULT 0,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `createdBy` BIGINT UNSIGNED NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_color_swatches_default` (`isDefault`),
  KEY `idx_color_swatches_created_by` (`createdBy`),
  CONSTRAINT `fk_color_swatches_created_by` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- RECENT COLORS TABLE
-- Track recently used colors per user
-- ============================================
CREATE TABLE IF NOT EXISTS `recent_colors` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` BIGINT UNSIGNED NOT NULL,
  `hexColor` VARCHAR(7) NOT NULL,
  `usedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_recent_colors_user` (`userId`, `usedAt`),
  CONSTRAINT `fk_recent_colors_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DEFAULT COLOR SWATCHES
-- Ship with a nice set of default colors
-- ============================================
INSERT INTO `color_swatches` (`name`, `hexColor`, `isDefault`, `sortOrder`) VALUES
  -- Primary colors
  ('Red', '#ef4444', 1, 1),
  ('Orange', '#f97316', 1, 2),
  ('Amber', '#f59e0b', 1, 3),
  ('Yellow', '#eab308', 1, 4),
  ('Lime', '#84cc16', 1, 5),
  ('Green', '#22c55e', 1, 6),
  ('Emerald', '#10b981', 1, 7),
  ('Teal', '#14b8a6', 1, 8),
  ('Cyan', '#06b6d4', 1, 9),
  ('Sky', '#0ea5e9', 1, 10),
  ('Blue', '#3b82f6', 1, 11),
  ('Indigo', '#6366f1', 1, 12),
  ('Violet', '#8b5cf6', 1, 13),
  ('Purple', '#a855f7', 1, 14),
  ('Fuchsia', '#d946ef', 1, 15),
  ('Pink', '#ec4899', 1, 16),
  ('Rose', '#f43f5e', 1, 17),
  -- Neutrals
  ('Slate', '#64748b', 1, 18),
  ('Gray', '#6b7280', 1, 19),
  ('Zinc', '#71717a', 1, 20),
  ('Stone', '#78716c', 1, 21),
  -- Dark variants
  ('Dark Red', '#b91c1c', 1, 22),
  ('Dark Green', '#15803d', 1, 23),
  ('Dark Blue', '#1d4ed8', 1, 24),
  ('Dark Purple', '#7c3aed', 1, 25);
