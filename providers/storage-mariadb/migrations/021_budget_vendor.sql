-- Migration 021: Budget vendor defaults + Shopping-Budget category linking
-- v1.5.5

-- Add default vendor to budgets (e.g., Electric Bill → Duke Energy)
ALTER TABLE `budgets`
  ADD COLUMN `defaultVendor` VARCHAR(200) NULL AFTER `dueDay`;

-- Link shopping categories to budgets for auto-entry creation on purchase
ALTER TABLE `shopping_categories`
  ADD COLUMN `budgetId` BIGINT UNSIGNED NULL,
  ADD CONSTRAINT `fk_shopping_cat_budget`
    FOREIGN KEY (`budgetId`) REFERENCES `budgets`(`id`) ON DELETE SET NULL;
