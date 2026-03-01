-- Migration 023: Paid Chore Photos
-- Change completionPhotoUrl from VARCHAR(500) to TEXT to support multiple photos (JSON array)

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE `paid_chores`
  MODIFY COLUMN `completionPhotoUrl` TEXT NULL;

SET FOREIGN_KEY_CHECKS = 1;
