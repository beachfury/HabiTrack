-- Migration 020: Add per-store image and brand overrides to item_prices
-- Allows each catalog item to have different images and brands at different stores
-- (e.g., Great Value 2% Milk at Walmart vs Sprouts brand at Sprouts)

ALTER TABLE `item_prices`
  ADD COLUMN `imageUrl` VARCHAR(500) NULL AFTER `unit`,
  ADD COLUMN `brand` VARCHAR(100) NULL AFTER `imageUrl`;
