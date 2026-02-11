-- Migration 027: Theme System Cleanup
-- - Add isSystemTheme column to prevent editing of HabiTrack Classic
-- - Add Household Brand theme
-- - Clean up old default themes (Ocean Blue, Forest Green, Sunset Orange, Rose Pink)

-- Add isSystemTheme column if it doesn't exist
ALTER TABLE `themes`
ADD COLUMN IF NOT EXISTS `isSystemTheme` TINYINT(1) DEFAULT 0 COMMENT 'If 1, theme cannot be edited or deleted';

-- Mark HabiTrack Classic as a system theme (cannot be edited)
UPDATE `themes` SET `isSystemTheme` = 1 WHERE `id` = 'habitrack-classic';

-- Insert Household Brand theme if it doesn't exist
INSERT INTO `themes` (
  `id`, `name`, `description`,
  `layout`, `colorsLight`, `colorsDark`, `typography`,
  `sidebar`, `pageBackground`, `ui`, `icons`,
  `createdBy`, `isPublic`, `isApprovedForKids`, `isDefault`, `isSystemTheme`
) VALUES (
  'household-brand',
  'Household Brand',
  'Your household''s custom default theme - customize to match your family style',
  '{"type":"sidebar-left","sidebarWidth":256,"navStyle":"icons-text"}',
  '{"primary":"#3cb371","primaryForeground":"#ffffff","secondary":"#f3f4f6","secondaryForeground":"#3d4f5f","accent":"#3cb371","accentForeground":"#ffffff","background":"#ffffff","foreground":"#3d4f5f","card":"#ffffff","cardForeground":"#3d4f5f","muted":"#f3f4f6","mutedForeground":"#6b7280","border":"#e5e7eb"}',
  '{"primary":"#4fd693","primaryForeground":"#1a2e26","secondary":"#374151","secondaryForeground":"#f9fafb","accent":"#4fd693","accentForeground":"#1a2e26","background":"#1a2530","foreground":"#f9fafb","card":"#243340","cardForeground":"#f9fafb","muted":"#2d3e4e","mutedForeground":"#9ca3af","border":"#3d4f5f"}',
  '{"fontFamily":"system-ui, -apple-system, sans-serif","baseFontSize":16,"lineHeight":"normal"}',
  '{"backgroundType":"solid","backgroundColor":null,"textColor":null}',
  '{"type":"solid","color":null}',
  '{"borderRadius":"large","shadowIntensity":"subtle"}',
  '{"style":"outline"}',
  1, 1, 1, 1, 0
) ON DUPLICATE KEY UPDATE `name` = `name`;

-- Update default theme to Household Brand for households that haven't customized
UPDATE `settings` SET `defaultThemeId` = 'household-brand' WHERE `id` = 1 AND `defaultThemeId` = 'habitrack-classic';

-- Delete old default themes that are no longer in use
-- Only delete if no users are actively using them
DELETE t FROM `themes` t
LEFT JOIN `user_theme_preferences` utp ON t.id = utp.themeId
WHERE t.id IN ('ocean-blue', 'forest-green', 'sunset-orange', 'rose-pink')
  AND t.isDefault = 1
  AND utp.themeId IS NULL;
