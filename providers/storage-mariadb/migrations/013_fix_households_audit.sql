-- Migration: 013_fix_households_audit.sql
--
-- This migration adds the missing columns

-- Add actorId column (code uses this instead of userId)
ALTER TABLE audit_log ADD COLUMN `actorId` INT UNSIGNED NULL AFTER `id`;

-- Add ua column (code uses 'ua' but table has 'userAgent')
ALTER TABLE audit_log ADD COLUMN `ua` TEXT NULL AFTER `ip`;

-- Add target column (code uses this instead of resource)
ALTER TABLE audit_log ADD COLUMN `target` VARCHAR(255) NULL AFTER `action`;

-- Add result column (missing from table)
ALTER TABLE audit_log ADD COLUMN `result` ENUM('ok', 'deny', 'error') NULL DEFAULT 'ok' AFTER `target`;

-- Add index on actorId
ALTER TABLE audit_log ADD INDEX `idx_audit_actorId` (`actorId`);

-- Note: We're keeping the old columns for backward compatibility
-- userId, resource, resourceId, userAgent still exist but won't be used
