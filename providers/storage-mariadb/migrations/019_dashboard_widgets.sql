-- Migration 019: Dashboard Widgets
-- User-customizable home page widgets with drag-and-drop layout

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- USER DASHBOARD LAYOUTS
-- Stores widget positions per user
-- ============================================
CREATE TABLE IF NOT EXISTS `user_dashboard_layouts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` BIGINT UNSIGNED NOT NULL,
  `widgetId` VARCHAR(50) NOT NULL,
  `x` INT NOT NULL DEFAULT 0,
  `y` INT NOT NULL DEFAULT 0,
  `w` INT NOT NULL DEFAULT 2,
  `h` INT NOT NULL DEFAULT 2,
  `minW` INT NULL,
  `minH` INT NULL,
  `maxW` INT NULL,
  `maxH` INT NULL,
  `visible` BOOLEAN NOT NULL DEFAULT 1,
  `config` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_widget` (`userId`, `widgetId`),
  KEY `idx_user_dashboard` (`userId`),
  CONSTRAINT `fk_dashboard_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- AVAILABLE WIDGETS REGISTRY
-- Defines available widgets and their defaults
-- ============================================
CREATE TABLE IF NOT EXISTS `dashboard_widgets` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `icon` VARCHAR(50) NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'general',
  `defaultW` INT NOT NULL DEFAULT 2,
  `defaultH` INT NOT NULL DEFAULT 2,
  `minW` INT NOT NULL DEFAULT 1,
  `minH` INT NOT NULL DEFAULT 1,
  `maxW` INT NULL,
  `maxH` INT NULL,
  `defaultConfig` JSON NULL,
  `roles` VARCHAR(100) NULL,
  `active` BOOLEAN NOT NULL DEFAULT 1,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default widgets
INSERT INTO `dashboard_widgets` (`id`, `name`, `description`, `icon`, `category`, `defaultW`, `defaultH`, `minW`, `minH`, `maxW`, `maxH`, `sortOrder`) VALUES
  ('welcome', 'Welcome', 'Personalized greeting and quick stats', 'hand-wave', 'general', 4, 1, 2, 1, 4, 2, 1),
  ('quick-stats', 'Quick Stats', 'Overview of events, chores, shopping', 'bar-chart', 'general', 4, 1, 2, 1, 4, 2, 2),
  ('todays-events', 'Today\'s Events', 'Calendar events for today', 'calendar', 'calendar', 2, 2, 1, 2, 4, 4, 3),
  ('upcoming-events', 'Upcoming Events', 'Events for the next 7 days', 'calendar-days', 'calendar', 2, 3, 2, 2, 4, 6, 4),
  ('todays-chores', 'Today\'s Chores', 'Chores due today', 'check-square', 'chores', 2, 2, 1, 2, 4, 4, 5),
  ('my-chores', 'My Chores', 'Your assigned chores', 'list-checks', 'chores', 2, 2, 1, 2, 4, 4, 6),
  ('chore-leaderboard', 'Chore Leaderboard', 'Top performers this week', 'trophy', 'chores', 2, 2, 1, 2, 2, 4, 7),
  ('shopping-list', 'Shopping List', 'Quick view of shopping items', 'shopping-cart', 'shopping', 2, 2, 1, 2, 4, 4, 8),
  ('paid-chores', 'Paid Chores', 'Available paid chores to claim', 'dollar-sign', 'chores', 2, 2, 1, 2, 4, 4, 9),
  ('earnings', 'My Earnings', 'Your paid chore earnings', 'wallet', 'chores', 2, 1, 1, 1, 2, 2, 10),
  ('family-members', 'Family', 'Quick family member overview', 'users', 'family', 2, 2, 1, 2, 4, 4, 11),
  ('announcements', 'Announcements', 'Recent announcements', 'megaphone', 'messages', 2, 2, 1, 2, 4, 4, 12),
  ('weather', 'Weather', 'Local weather forecast', 'cloud-sun', 'general', 2, 1, 1, 1, 2, 2, 13);

SET FOREIGN_KEY_CHECKS = 1;
