-- Migration 022: Extended Theme System
-- Adds element-level customization, per-widget overrides, login page styling, and LCARS mode

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- EXTEND THEMES TABLE WITH ELEMENT STYLES
-- ============================================

-- Add element styles column (per-element type customization)
-- Stores: { 'card': { backgroundColor, textColor, borderRadius, ... }, 'sidebar': {...}, ... }
ALTER TABLE `themes`
  ADD COLUMN `elementStyles` JSON NULL AFTER `icons`;

-- Add widget overrides column (per-widget customization)
-- Stores: [{ widgetId: 'weather', style: {...} }, { widgetId: 'chores', pageId: 'home', style: {...} }]
ALTER TABLE `themes`
  ADD COLUMN `widgetOverrides` JSON NULL AFTER `elementStyles`;

-- Add login page styling column (admin-only)
-- Stores: { backgroundType: 'gradient'|'solid'|'image', backgroundValue, logoUrl, brandName, brandColor }
ALTER TABLE `themes`
  ADD COLUMN `loginPage` JSON NULL AFTER `widgetOverrides`;

-- Add LCARS mode column (for radical customization)
-- Stores: { enabled: boolean, cornerStyle: 'rounded'|'sharp'|'lcars-curve', customCSS: string }
ALTER TABLE `themes`
  ADD COLUMN `lcarsMode` JSON NULL AFTER `loginPage`;

-- ============================================
-- CREATE ELEMENT STYLE PRESETS TABLE
-- ============================================
-- Allows saving and reusing element styles across themes

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

-- ============================================
-- INSERT DEFAULT ELEMENT PRESETS
-- ============================================

-- Note: Using createdBy = 1 assuming first user is admin
-- These are system presets that will be available to all users

-- Default card styles
INSERT INTO `theme_element_presets` (`id`, `name`, `elementType`, `style`, `isDefault`, `createdBy`) VALUES
  (UUID(), 'Default Card', 'card', '{"backgroundColor": null, "borderRadius": 12, "borderWidth": 1, "boxShadow": "subtle"}', 1, 1),
  (UUID(), 'Sharp Card', 'card', '{"backgroundColor": null, "borderRadius": 0, "borderWidth": 1, "boxShadow": "none"}', 0, 1),
  (UUID(), 'Rounded Card', 'card', '{"backgroundColor": null, "borderRadius": 24, "borderWidth": 0, "boxShadow": "medium"}', 0, 1);

-- Default button styles
INSERT INTO `theme_element_presets` (`id`, `name`, `elementType`, `style`, `isDefault`, `createdBy`) VALUES
  (UUID(), 'Default Button', 'button-primary', '{"borderRadius": 8, "padding": "8px 16px"}', 1, 1),
  (UUID(), 'Pill Button', 'button-primary', '{"borderRadius": 9999, "padding": "8px 24px"}', 0, 1),
  (UUID(), 'Square Button', 'button-primary', '{"borderRadius": 0, "padding": "10px 20px"}', 0, 1);

-- LCARS-style presets
INSERT INTO `theme_element_presets` (`id`, `name`, `elementType`, `style`, `isDefault`, `createdBy`) VALUES
  (UUID(), 'LCARS Sidebar', 'sidebar', '{"backgroundColor": "#000000", "borderRadius": 0, "customCSS": "border-top-right-radius: 40px; border-bottom-right-radius: 40px;"}', 0, 1),
  (UUID(), 'LCARS Card', 'card', '{"backgroundColor": "rgba(204, 153, 0, 0.15)", "borderColor": "#cc9900", "borderWidth": 2, "borderRadius": 0}', 0, 1),
  (UUID(), 'LCARS Button', 'button-primary', '{"backgroundColor": "#cc9900", "borderRadius": 15, "customCSS": "clip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%, 0 25%);"}', 0, 1);

SET FOREIGN_KEY_CHECKS = 1;
