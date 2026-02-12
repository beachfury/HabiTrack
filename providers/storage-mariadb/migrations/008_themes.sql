-- Migration 008: Themes System
-- Theme library, user preferences, assets, element presets
-- Consolidated from migrations 017, 022, 027, 028
-- Note: Theme color updates (024-026, 029, 032-033) are incorporated into default values

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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

  -- Extended theme: Element-level customization
  `elementStyles` JSON NULL COMMENT 'Per-element type customization',
  `widgetOverrides` JSON NULL COMMENT 'Per-widget customization',
  `loginPage` JSON NULL COMMENT 'Login page styling (admin-only)',
  `lcarsMode` JSON NULL COMMENT 'LCARS mode settings',

  -- Metadata
  `createdBy` BIGINT UNSIGNED NOT NULL,
  `isPublic` BOOLEAN NOT NULL DEFAULT 1,
  `isApprovedForKids` BOOLEAN NOT NULL DEFAULT 0,
  `isDefault` BOOLEAN NOT NULL DEFAULT 0,
  `isSystemTheme` TINYINT(1) DEFAULT 0 COMMENT 'If 1, theme cannot be edited or deleted',
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
  `assetType` ENUM(
    'sidebar-image',
    'header-image',
    'background-image',
    'pattern',
    'thumbnail',
    'icon-pack',
    'page-background',
    'card-background',
    'widget-background'
  ) NOT NULL,
  `category` VARCHAR(50) NULL,
  `name` VARCHAR(100) NULL,
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
  KEY `idx_assets_category` (`category`),
  CONSTRAINT `fk_assets_theme` FOREIGN KEY (`themeId`) REFERENCES `themes`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assets_uploader` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- THEME ELEMENT PRESETS TABLE
-- Reusable element styles across themes
-- ============================================
CREATE TABLE IF NOT EXISTS `theme_element_presets` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `elementType` ENUM(
    'page-background', 'sidebar', 'header', 'card', 'widget',
    'button-primary', 'button-secondary', 'modal', 'input', 'login-page'
  ) NOT NULL,
  `style` JSON NOT NULL,
  `isDefault` BOOLEAN NOT NULL DEFAULT 0,
  `createdBy` BIGINT UNSIGNED NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_presets_type` (`elementType`),
  KEY `idx_presets_creator` (`createdBy`),
  CONSTRAINT `fk_presets_creator` FOREIGN KEY (`createdBy`)
    REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Note: Default themes (HabiTrack Classic, Household Brand) and element presets
-- are created via API when first admin is created, since they need a valid userId.
-- Color schemes include the full HabiTrack brand colors (green/navy) and
-- all semantic colors (destructive, success, warning) with proper foregrounds.
