-- Migration 008: Achievements System
-- Gamification achievements and user progress

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- CHORE ACHIEVEMENTS TABLE
-- Achievement definitions
-- ============================================
CREATE TABLE IF NOT EXISTS `chore_achievements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `icon` VARCHAR(50) NULL,
  `criteria` JSON NULL,
  `points` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default achievements
INSERT IGNORE INTO `chore_achievements` (`name`, `description`, `icon`, `points`) VALUES
  ('First Chore', 'Complete your first chore', 'star', 10),
  ('Week Warrior', 'Complete 7 chores in a week', 'calendar', 50),
  ('Streak Master', 'Maintain a 30-day streak', 'flame', 100),
  ('Point Collector', 'Earn 1000 total points', 'coins', 200),
  ('Early Bird', 'Complete a chore before 8 AM', 'sunrise', 25),
  ('Night Owl', 'Complete a chore after 9 PM', 'moon', 25),
  ('Team Player', 'Help complete 10 chores for others', 'users', 75),
  ('Perfectionist', 'Get 10 chores approved without rejection', 'check-circle', 100);

-- ============================================
-- USER ACHIEVEMENTS TABLE
-- Track which users have earned which achievements
-- ============================================
CREATE TABLE IF NOT EXISTS `user_achievements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` BIGINT UNSIGNED NOT NULL,
  `achievementId` BIGINT UNSIGNED NOT NULL,
  `earnedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_achievements` (`userId`, `achievementId`),
  CONSTRAINT `fk_user_achievements_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_achievements_achievement` FOREIGN KEY (`achievementId`) REFERENCES `chore_achievements`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
