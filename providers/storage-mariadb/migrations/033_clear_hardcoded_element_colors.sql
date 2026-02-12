-- Migration: 033_clear_hardcoded_element_colors.sql
-- Purpose: Clear hardcoded color properties from elementStyles in default themes
-- Element styles should only contain structural properties (borderRadius, padding, etc.)
-- Colors should come from the theme's mode-aware colorsLight/colorsDark

-- Clear ALL elementStyles for default themes to reset to clean state
-- This forces colors to fall back to the theme's base colors which ARE mode-aware
UPDATE themes
SET elementStyles = NULL
WHERE id IN ('habitrack-classic', 'household-brand');

-- Also clear any widgetOverrides that might have hardcoded colors
UPDATE themes
SET widgetOverrides = NULL
WHERE id IN ('habitrack-classic', 'household-brand');
