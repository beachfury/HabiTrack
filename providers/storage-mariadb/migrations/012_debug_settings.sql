-- 012_debug_settings.sql
-- Add debug mode and logging settings

-- Add debug columns to settings table
-- SECURITY: debugMode defaults to OFF (0) for safety when exposed to internet
ALTER TABLE `settings`
  ADD COLUMN IF NOT EXISTS `debugMode` BOOLEAN NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `logLevel` ENUM('error', 'warn', 'info', 'debug') NOT NULL DEFAULT 'error',
  ADD COLUMN IF NOT EXISTS `logToFile` BOOLEAN NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `logRetentionDays` INT NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS `debugModeEnabledAt` DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS `debugModeAutoDisableHours` INT NOT NULL DEFAULT 4;

-- Create debug_logs table for persistent log storage (optional, used when logToFile is enabled)
CREATE TABLE IF NOT EXISTS `debug_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `level` ENUM('error', 'warn', 'info', 'debug') NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `message` TEXT NOT NULL,
  `data` JSON NULL,
  `userId` INT NULL,
  `sessionId` VARCHAR(100) NULL,
  `requestId` VARCHAR(36) NULL,
  `ip` VARCHAR(45) NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_debug_logs_timestamp` (`timestamp`),
  INDEX `idx_debug_logs_level` (`level`),
  INDEX `idx_debug_logs_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for cleanup job
CREATE INDEX IF NOT EXISTS `idx_debug_logs_cleanup` ON `debug_logs` (`timestamp`);
