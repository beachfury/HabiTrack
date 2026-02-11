-- Migration 021: Add budget type (bill vs spending)
-- Bills = fixed recurring payments (show paid/unpaid)
-- Spending = variable budgets with limits (show percentage)

SET NAMES utf8mb4;

-- Add budgetType column to budgets table
ALTER TABLE `budgets`
  ADD COLUMN `budgetType` ENUM('bill', 'spending') NOT NULL DEFAULT 'bill' AFTER `budgetAmount`;

-- Update existing budgets - assume most are bills
-- You can manually change spending-type budgets in the UI
