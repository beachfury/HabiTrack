-- Migration 017: Themes System
-- Theme library, user preferences, and assets for comprehensive UI theming

SET NAMES utf8mb4;

-- ============================================
-- THEMES TABLE (Shared Library)
-- ============================================
CREATE TABLE IF NOT EXISTS `themes` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(500) NULL,
  `thumbnailUrl` VARCHAR(500) NULL,

  -- Layout settings
  `layout` JSON NOT NULL COMMENT '{"type": "sidebar-left|sidebar-right|top-header|minimal", "sidebarWidth": 256, "headerHeight": 64, "navStyle": "icons-text|icons-only|text-only"}',

  -- Color schemes (separate light/dark)
  `colorsLight` JSON NOT NULL COMMENT 'Light mode color scheme',
  `colorsDark` JSON NOT NULL COMMENT 'Dark mode color scheme',

  -- Typography
  `typography` JSON NOT NULL COMMENT '{"fontFamily": "system-ui", "baseFontSize": 16, "lineHeight": "normal"}',

  -- Sidebar/Header customization
  `sidebar` JSON NULL COMMENT '{"backgroundType": "solid|gradient|image", "imageUrl": null, "opacity": 100, "blur": 0, "textColor": null}',
  `header` JSON NULL COMMENT 'For top-header layout',

  -- Page background
  `pageBackground` JSON NOT NULL COMMENT '{"type": "solid|gradient|image|pattern", "color": null, "imageUrl": null, "pattern": "none"}',

  -- UI preferences
  `ui` JSON NOT NULL COMMENT '{"borderRadius": "large", "shadowIntensity": "subtle"}',

  -- Icon preferences
  `icons` JSON NOT NULL COMMENT '{"style": "outline|solid"}',

  -- Metadata
  `createdBy` BIGINT UNSIGNED NOT NULL,
  `isPublic` BOOLEAN NOT NULL DEFAULT 1,
  `isApprovedForKids` BOOLEAN NOT NULL DEFAULT 0,
  `isDefault` BOOLEAN NOT NULL DEFAULT 0,
  `usageCount` INT UNSIGNED NOT NULL DEFAULT 0,
  `version` INT UNSIGNED NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  KEY `idx_themes_public` (`isPublic`),
  KEY `idx_themes_kid_approved` (`isApprovedForKids`),
  KEY `idx_themes_creator` (`createdBy`),
  KEY `idx_themes_default` (`isDefault`),
  KEY `idx_themes_usage` (`usageCount` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- USER THEME PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `user_theme_preferences` (
  `userId` BIGINT UNSIGNED NOT NULL,
  `themeId` VARCHAR(36) NULL COMMENT 'Selected theme from library',
  `mode` ENUM('light', 'dark', 'system', 'auto') NOT NULL DEFAULT 'system',
  `overrides` JSON NULL COMMENT 'User customizations on top of selected theme',
  `personalThemes` JSON NULL COMMENT 'User private themes not in library',
  `accentColorOverride` VARCHAR(7) NULL COMMENT 'Quick accent color override',
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`userId`),
  KEY `idx_prefs_theme` (`themeId`),
  CONSTRAINT `fk_prefs_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- THEME ASSETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `theme_assets` (
  `id` VARCHAR(36) NOT NULL,
  `themeId` VARCHAR(36) NULL COMMENT 'NULL for user uploads not tied to theme',
  `uploadedBy` BIGINT UNSIGNED NOT NULL,
  `assetType` ENUM('sidebar-image', 'header-image', 'background-image', 'thumbnail', 'icon-pack') NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `url` VARCHAR(500) NOT NULL,
  `mimeType` VARCHAR(50) NOT NULL,
  `sizeBytes` INT UNSIGNED NOT NULL,
  `width` INT UNSIGNED NULL,
  `height` INT UNSIGNED NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  KEY `idx_assets_theme` (`themeId`),
  KEY `idx_assets_uploader` (`uploadedBy`),
  KEY `idx_assets_type` (`assetType`),
  CONSTRAINT `fk_assets_theme` FOREIGN KEY (`themeId`) REFERENCES `themes`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assets_uploader` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ALTER SETTINGS TABLE
-- ============================================
ALTER TABLE `settings`
  ADD COLUMN IF NOT EXISTS `defaultThemeId` VARCHAR(36) NULL AFTER `loginBackgroundValue`,
  ADD COLUMN IF NOT EXISTS `kidAllowedThemeIds` JSON NULL AFTER `defaultThemeId`;

-- Note: Default themes will be created via API when first admin is created,
-- since we need a valid user ID for the createdBy field
