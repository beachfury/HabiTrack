-- 013_widget_theme_standards.sql
-- Widget manifest standard + theme import/export + marketplace requests

-- ============================================================================
-- Widget manifest fields
-- ============================================================================

ALTER TABLE `dashboard_widgets`
  ADD COLUMN `version` VARCHAR(20) NOT NULL DEFAULT '1.0.0' AFTER `id`,
  ADD COLUMN `author` VARCHAR(100) NOT NULL DEFAULT 'HabiTrack' AFTER `description`,
  ADD COLUMN `dataSources` JSON NULL AFTER `defaultConfig`,
  ADD COLUMN `configSchema` JSON NULL AFTER `dataSources`,
  ADD COLUMN `builtIn` BOOLEAN NOT NULL DEFAULT 1 AFTER `roles`,
  ADD COLUMN `tags` JSON NULL AFTER `builtIn`,
  ADD COLUMN `source` ENUM('built-in','imported','custom') NOT NULL DEFAULT 'built-in' AFTER `tags`,
  ADD COLUMN `manifestJson` JSON NULL COMMENT 'Full widget manifest for imported widgets' AFTER `source`;

-- Update existing built-in widgets with their dataSources
UPDATE `dashboard_widgets` SET `dataSources` = '["user"]' WHERE `id` = 'welcome';
UPDATE `dashboard_widgets` SET `dataSources` = '["quickStats","myEarnings"]' WHERE `id` = 'quick-stats';
UPDATE `dashboard_widgets` SET `dataSources` = '["todaysEvents"]' WHERE `id` = 'todays-events';
UPDATE `dashboard_widgets` SET `dataSources` = '["upcomingEvents"]' WHERE `id` = 'upcoming-events';
UPDATE `dashboard_widgets` SET `dataSources` = '["todaysChores"]' WHERE `id` = 'todays-chores';
UPDATE `dashboard_widgets` SET `dataSources` = '["myChores"]' WHERE `id` = 'my-chores';
UPDATE `dashboard_widgets` SET `dataSources` = '["choreLeaderboard"]' WHERE `id` = 'chore-leaderboard';
UPDATE `dashboard_widgets` SET `dataSources` = '["shoppingItems"]' WHERE `id` = 'shopping-list';
UPDATE `dashboard_widgets` SET `dataSources` = '["availablePaidChores"]' WHERE `id` = 'paid-chores';
UPDATE `dashboard_widgets` SET `dataSources` = '["myEarnings"]' WHERE `id` = 'earnings';
UPDATE `dashboard_widgets` SET `dataSources` = '["familyMembers"]' WHERE `id` = 'family-members';
UPDATE `dashboard_widgets` SET `dataSources` = '["announcements"]' WHERE `id` = 'announcements';
UPDATE `dashboard_widgets` SET `dataSources` = '[]' WHERE `id` = 'weather';
UPDATE `dashboard_widgets` SET `dataSources` = '["upcomingMeals"]' WHERE `id` = 'upcoming-meals';

-- ============================================================================
-- Theme import/export fields
-- Note: themes.version already exists as INT (edit counter) from 008_themes.sql
-- We add a separate semver column for import/export versioning
-- ============================================================================

ALTER TABLE `themes`
  ADD COLUMN `semver` VARCHAR(20) NOT NULL DEFAULT '1.0.0' AFTER `id`,
  ADD COLUMN `author` VARCHAR(100) NULL AFTER `description`,
  ADD COLUMN `source` ENUM('built-in','imported','custom') NOT NULL DEFAULT 'custom' AFTER `isSystemTheme`,
  ADD COLUMN `tags` JSON NULL AFTER `source`,
  ADD COLUMN `importedFrom` VARCHAR(500) NULL COMMENT 'Original filename or source' AFTER `tags`;

-- Mark existing system themes
UPDATE `themes` SET `source` = 'built-in' WHERE `isSystemTheme` = 1;

-- ============================================================================
-- Marketplace requests (non-admin users request widget/theme installs)
-- Note: store_requests already exists from 005_shopping.sql for physical stores
-- ============================================================================

CREATE TABLE IF NOT EXISTS `marketplace_requests` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` BIGINT UNSIGNED NOT NULL,
  `itemType` ENUM('widget','theme') NOT NULL,
  `itemId` VARCHAR(100) NOT NULL,
  `itemName` VARCHAR(200) NOT NULL,
  `message` TEXT NULL,
  `status` ENUM('pending','approved','dismissed') NOT NULL DEFAULT 'pending',
  `reviewedBy` BIGINT UNSIGNED NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `reviewedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_marketplace_requests_status` (`status`),
  KEY `idx_marketplace_requests_user` (`userId`),
  CONSTRAINT `fk_marketplace_request_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_marketplace_request_reviewer` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
