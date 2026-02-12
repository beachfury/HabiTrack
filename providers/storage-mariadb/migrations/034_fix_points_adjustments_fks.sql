-- Migration 034: Fix points_adjustments table
-- Adds missing foreign key constraints and updates column types for consistency

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Modify columns to match users table (BIGINT UNSIGNED)
-- Note: This will fail if there's invalid data, which is intentional
ALTER TABLE `points_adjustments`
  MODIFY COLUMN `userId` BIGINT UNSIGNED NOT NULL,
  MODIFY COLUMN `adjustedBy` BIGINT UNSIGNED NOT NULL;

-- Add foreign key constraints
-- Using IF NOT EXISTS logic via procedure since MariaDB doesn't support IF NOT EXISTS for constraints
DELIMITER //

CREATE PROCEDURE add_points_adjustments_fks()
BEGIN
  -- Check if userId FK exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'points_adjustments'
    AND CONSTRAINT_NAME = 'fk_points_adj_user'
  ) THEN
    ALTER TABLE `points_adjustments`
      ADD CONSTRAINT `fk_points_adj_user`
      FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE;
  END IF;

  -- Check if adjustedBy FK exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'points_adjustments'
    AND CONSTRAINT_NAME = 'fk_points_adj_admin'
  ) THEN
    ALTER TABLE `points_adjustments`
      ADD CONSTRAINT `fk_points_adj_admin`
      FOREIGN KEY (`adjustedBy`) REFERENCES `users`(`id`) ON DELETE CASCADE;
  END IF;
END//

DELIMITER ;

CALL add_points_adjustments_fks();
DROP PROCEDURE IF EXISTS add_points_adjustments_fks;

SET FOREIGN_KEY_CHECKS = 1;
