-- Migration 005: Calendar Events
-- Family calendar and events

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- CALENDAR EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `calendar_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `location` VARCHAR(500) NULL,
  `startAt` DATETIME(3) NOT NULL,
  `endAt` DATETIME(3) NULL,
  `allDay` BOOLEAN NOT NULL DEFAULT 0,
  `color` VARCHAR(7) NULL,
  `recurrenceRule` VARCHAR(500) NULL,
  `recurrenceEnd` DATE NULL,
  `category` VARCHAR(50) NULL,
  `createdBy` BIGINT UNSIGNED NULL,
  `assignedTo` BIGINT UNSIGNED NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_calendar_events_dates` (`startAt`, `endAt`),
  KEY `idx_calendar_events_created_by` (`createdBy`),
  KEY `idx_calendar_events_assigned_to` (`assignedTo`),
  CONSTRAINT `fk_calendar_events_created_by` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_calendar_events_assigned_to` FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
