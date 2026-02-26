-- Migration 022: Three-tier catalog item visibility (active/archived/hidden)
-- v1.6.0

-- Add visibility ENUM column, defaulting to 'active'
ALTER TABLE `catalog_items`
  ADD COLUMN `visibility` ENUM('active', 'archived', 'hidden') NOT NULL DEFAULT 'active' AFTER `active`;

-- Backfill: items with active=0 become 'hidden' (preserving old soft-delete semantics)
UPDATE `catalog_items` SET `visibility` = 'hidden' WHERE `active` = 0;

-- Add index for visibility queries
CREATE INDEX `idx_catalog_items_visibility` ON `catalog_items` (`visibility`);
