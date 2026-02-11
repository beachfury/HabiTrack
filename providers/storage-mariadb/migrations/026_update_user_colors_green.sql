-- Migration: Update user profile colors from purple to HabiTrack Green
-- This updates any user colors that were set to the old purple default

UPDATE users
SET color = '#3cb371'
WHERE color = '#8b5cf6';
