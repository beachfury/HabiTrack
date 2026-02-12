-- Migration: 032_fix_theme_colors.sql
-- Purpose: Add missing destructive, success, and warning colors to default themes

-- Update HabiTrack Classic dark colors
UPDATE themes
SET colorsDark = JSON_SET(
    colorsDark,
    '$.destructive', '#f87171',
    '$.destructiveForeground', '#1f2937',
    '$.success', '#4ade80',
    '$.successForeground', '#1f2937',
    '$.warning', '#fbbf24',
    '$.warningForeground', '#1f2937'
)
WHERE id = 'habitrack-classic';

-- Update HabiTrack Classic light colors
UPDATE themes
SET colorsLight = JSON_SET(
    colorsLight,
    '$.destructive', '#ef4444',
    '$.destructiveForeground', '#ffffff',
    '$.success', '#22c55e',
    '$.successForeground', '#ffffff',
    '$.warning', '#f59e0b',
    '$.warningForeground', '#ffffff'
)
WHERE id = 'habitrack-classic';

-- Update Household Brand dark colors
UPDATE themes
SET colorsDark = JSON_SET(
    colorsDark,
    '$.destructive', '#f87171',
    '$.destructiveForeground', '#1f2937',
    '$.success', '#4ade80',
    '$.successForeground', '#1f2937',
    '$.warning', '#fbbf24',
    '$.warningForeground', '#1f2937'
)
WHERE id = 'household-brand';

-- Update Household Brand light colors
UPDATE themes
SET colorsLight = JSON_SET(
    colorsLight,
    '$.destructive', '#ef4444',
    '$.destructiveForeground', '#ffffff',
    '$.success', '#22c55e',
    '$.successForeground', '#ffffff',
    '$.warning', '#f59e0b',
    '$.warningForeground', '#ffffff'
)
WHERE id = 'household-brand';

-- Also update any other themes that might be missing these colors
-- This ensures all themes have proper semantic colors
UPDATE themes
SET colorsDark = JSON_SET(
    colorsDark,
    '$.destructive', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(colorsDark, '$.destructive')), '#f87171'),
    '$.destructiveForeground', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(colorsDark, '$.destructiveForeground')), '#1f2937'),
    '$.success', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(colorsDark, '$.success')), '#4ade80'),
    '$.successForeground', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(colorsDark, '$.successForeground')), '#1f2937'),
    '$.warning', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(colorsDark, '$.warning')), '#fbbf24'),
    '$.warningForeground', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(colorsDark, '$.warningForeground')), '#1f2937')
)
WHERE JSON_EXTRACT(colorsDark, '$.destructive') IS NULL;

UPDATE themes
SET colorsLight = JSON_SET(
    colorsLight,
    '$.destructive', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(colorsLight, '$.destructive')), '#ef4444'),
    '$.destructiveForeground', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(colorsLight, '$.destructiveForeground')), '#ffffff'),
    '$.success', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(colorsLight, '$.success')), '#22c55e'),
    '$.successForeground', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(colorsLight, '$.successForeground')), '#ffffff'),
    '$.warning', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(colorsLight, '$.warning')), '#f59e0b'),
    '$.warningForeground', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(colorsLight, '$.warningForeground')), '#ffffff')
)
WHERE JSON_EXTRACT(colorsLight, '$.destructive') IS NULL;
