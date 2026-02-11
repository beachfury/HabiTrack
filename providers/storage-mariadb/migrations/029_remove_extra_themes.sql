-- Migration 029: Remove Extra Themes
-- Keep only HabiTrack Classic and Household Brand themes
-- All other themes will be deleted so we can build fresh custom themes

-- First, reset any user preferences that point to themes being deleted
-- Set them to use household-brand instead
UPDATE `user_theme_preferences`
SET `themeId` = 'household-brand'
WHERE `themeId` NOT IN ('habitrack-classic', 'household-brand');

-- Delete all themes except the two core ones
DELETE FROM `themes`
WHERE `id` NOT IN ('habitrack-classic', 'household-brand');

-- Ensure the default theme is set to household-brand
UPDATE `settings`
SET `defaultThemeId` = 'household-brand'
WHERE `id` = 1 AND (`defaultThemeId` IS NULL OR `defaultThemeId` NOT IN ('habitrack-classic', 'household-brand'));
