-- Migration 006: Dinner Planner
-- Recipe book, meal planning, voting, and shopping integration
-- Consolidated from migration 023

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- RECIPES TABLE
-- The household's recipe book
-- ============================================
CREATE TABLE IF NOT EXISTS `recipes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `instructions` TEXT NULL,
  `prepTimeMinutes` INT UNSIGNED NULL,
  `cookTimeMinutes` INT UNSIGNED NULL,
  `servings` INT UNSIGNED NOT NULL DEFAULT 4,
  `difficulty` ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
  `imageUrl` VARCHAR(500) NULL,
  `sourceUrl` VARCHAR(500) NULL,
  `sourceType` ENUM('manual', 'url', 'imported') NOT NULL DEFAULT 'manual',
  `tags` JSON NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `createdBy` BIGINT UNSIGNED NULL,
  `approvedBy` BIGINT UNSIGNED NULL,
  `approvedAt` DATETIME(3) NULL,
  `active` BOOLEAN NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_recipes_status` (`status`),
  KEY `idx_recipes_name` (`name`),
  KEY `idx_recipes_active` (`active`),
  CONSTRAINT `fk_recipes_created_by` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_recipes_approved_by` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- RECIPE INGREDIENTS TABLE
-- Ingredients needed for each recipe
-- ============================================
CREATE TABLE IF NOT EXISTS `recipe_ingredients` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `recipeId` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `catalogItemId` BIGINT UNSIGNED NULL,
  `quantity` DECIMAL(10, 2) NOT NULL DEFAULT 1,
  `unit` VARCHAR(50) NULL,
  `notes` VARCHAR(255) NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_recipe_ingredients_recipe` (`recipeId`),
  CONSTRAINT `fk_recipe_ingredients_recipe` FOREIGN KEY (`recipeId`) REFERENCES `recipes`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_recipe_ingredients_catalog` FOREIGN KEY (`catalogItemId`) REFERENCES `catalog_items`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MEAL PLAN TABLE
-- Scheduled meals for specific dates
-- ============================================
CREATE TABLE IF NOT EXISTS `meal_plans` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `date` DATE NOT NULL,
  `mealType` ENUM('dinner') NOT NULL DEFAULT 'dinner',
  `recipeId` BIGINT UNSIGNED NULL,
  `customMealName` VARCHAR(255) NULL,
  `isFendForYourself` BOOLEAN NOT NULL DEFAULT 0,
  `ffyMessage` VARCHAR(500) NULL,
  `status` ENUM('planned', 'voting', 'finalized') NOT NULL DEFAULT 'planned',
  `votingDeadline` DATETIME(3) NULL,
  `finalizedBy` BIGINT UNSIGNED NULL,
  `finalizedAt` DATETIME(3) NULL,
  `notes` TEXT NULL,
  `createdBy` BIGINT UNSIGNED NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_meal_plans_date_type` (`date`, `mealType`),
  KEY `idx_meal_plans_date` (`date`),
  KEY `idx_meal_plans_status` (`status`),
  CONSTRAINT `fk_meal_plans_recipe` FOREIGN KEY (`recipeId`) REFERENCES `recipes`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_meal_plans_finalized_by` FOREIGN KEY (`finalizedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_meal_plans_created_by` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MEAL SUGGESTIONS TABLE
-- Meal options for voting
-- ============================================
CREATE TABLE IF NOT EXISTS `meal_suggestions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `mealPlanId` BIGINT UNSIGNED NOT NULL,
  `recipeId` BIGINT UNSIGNED NULL,
  `customMealName` VARCHAR(255) NULL,
  `suggestedBy` BIGINT UNSIGNED NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_meal_suggestions_plan` (`mealPlanId`),
  CONSTRAINT `fk_meal_suggestions_plan` FOREIGN KEY (`mealPlanId`) REFERENCES `meal_plans`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_meal_suggestions_recipe` FOREIGN KEY (`recipeId`) REFERENCES `recipes`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_meal_suggestions_suggested_by` FOREIGN KEY (`suggestedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MEAL VOTES TABLE
-- User votes on suggestions
-- ============================================
CREATE TABLE IF NOT EXISTS `meal_votes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `mealSuggestionId` BIGINT UNSIGNED NOT NULL,
  `userId` BIGINT UNSIGNED NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_meal_votes_user_suggestion` (`mealSuggestionId`, `userId`),
  KEY `idx_meal_votes_user` (`userId`),
  CONSTRAINT `fk_meal_votes_suggestion` FOREIGN KEY (`mealSuggestionId`) REFERENCES `meal_suggestions`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_meal_votes_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MEAL SHOPPING SUGGESTIONS TABLE
-- Ingredients suggested for shopping list
-- ============================================
CREATE TABLE IF NOT EXISTS `meal_shopping_suggestions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `mealPlanId` BIGINT UNSIGNED NOT NULL,
  `recipeIngredientId` BIGINT UNSIGNED NULL,
  `catalogItemId` BIGINT UNSIGNED NULL,
  `name` VARCHAR(255) NOT NULL,
  `quantity` DECIMAL(10, 2) NOT NULL DEFAULT 1,
  `scaledQuantity` DECIMAL(10, 2) NULL,
  `unit` VARCHAR(50) NULL,
  `status` ENUM('pending', 'added', 'dismissed') NOT NULL DEFAULT 'pending',
  `addedToListId` BIGINT UNSIGNED NULL,
  `addedBy` BIGINT UNSIGNED NULL,
  `addedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_meal_shopping_suggestions_plan` (`mealPlanId`),
  KEY `idx_meal_shopping_suggestions_status` (`status`),
  CONSTRAINT `fk_meal_shopping_plan` FOREIGN KEY (`mealPlanId`) REFERENCES `meal_plans`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_meal_shopping_ingredient` FOREIGN KEY (`recipeIngredientId`) REFERENCES `recipe_ingredients`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_meal_shopping_catalog` FOREIGN KEY (`catalogItemId`) REFERENCES `catalog_items`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_meal_shopping_added_by` FOREIGN KEY (`addedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
