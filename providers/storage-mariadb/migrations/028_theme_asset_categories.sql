-- Migration 028: Theme Asset Categories
-- Adds category and name columns to theme_assets for better organization

SET NAMES utf8mb4;

-- Add category column for organizing images (cyberpunk, modern, nature, etc.)
ALTER TABLE `theme_assets`
  ADD COLUMN `category` VARCHAR(50) NULL AFTER `assetType`,
  ADD COLUMN `name` VARCHAR(100) NULL AFTER `category`;

-- Add index for category filtering
ALTER TABLE `theme_assets`
  ADD KEY `idx_assets_category` (`category`);

-- Update assetType enum to include more specific types
ALTER TABLE `theme_assets`
  MODIFY COLUMN `assetType` ENUM(
    'sidebar-image',
    'header-image',
    'background-image',
    'pattern',
    'thumbnail',
    'icon-pack',
    'page-background',
    'card-background',
    'widget-background'
  ) NOT NULL;
