-- Migration: Update HabiTrack Classic theme to use new brand colors (green/navy)
-- This updates the default theme from purple to the official HabiTrack brand colors

UPDATE themes
SET
  description = 'The official HabiTrack theme with green and navy brand colors',
  colorsLight = JSON_OBJECT(
    'primary', '#3cb371',
    'primaryForeground', '#ffffff',
    'secondary', '#f3f4f6',
    'secondaryForeground', '#3d4f5f',
    'accent', '#3cb371',
    'accentForeground', '#ffffff',
    'background', '#ffffff',
    'foreground', '#3d4f5f',
    'card', '#ffffff',
    'cardForeground', '#3d4f5f',
    'muted', '#f3f4f6',
    'mutedForeground', '#6b7280',
    'border', '#e5e7eb'
  ),
  colorsDark = JSON_OBJECT(
    'primary', '#4fd693',
    'primaryForeground', '#1a2e26',
    'secondary', '#374151',
    'secondaryForeground', '#f9fafb',
    'accent', '#4fd693',
    'accentForeground', '#1a2e26',
    'background', '#1a2530',
    'foreground', '#f9fafb',
    'card', '#243340',
    'cardForeground', '#f9fafb',
    'muted', '#2d3e4e',
    'mutedForeground', '#9ca3af',
    'border', '#3d4f5f'
  )
WHERE id = 'habitrack-classic';
