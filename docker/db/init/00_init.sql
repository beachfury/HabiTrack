-- Minimal init for HabiTrack database
-- The API migration script handles the full schema

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- This table is managed by the migration script, but needs to exist
CREATE TABLE IF NOT EXISTS `schema_migrations` (
  `filename` VARCHAR(255) NOT NULL PRIMARY KEY,
  `applied_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
