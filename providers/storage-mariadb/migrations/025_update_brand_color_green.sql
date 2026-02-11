-- Migration: Update household brand color to HabiTrack Green
-- This updates the default brand color from purple to the official HabiTrack green

UPDATE settings
SET brandColor = '#3cb371'
WHERE brandColor = '#8b5cf6' OR brandColor IS NULL;
