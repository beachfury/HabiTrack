-- 016_theme_tags.sql
-- Seed tags and author for built-in themes so they show properly in the Store

UPDATE themes SET tags = '["official", "clean", "green"]', author = 'HabiTrack'
WHERE id = 'habitrack-classic';

UPDATE themes SET tags = '["customizable", "household", "default"]', author = 'HabiTrack'
WHERE id = 'household-brand';
