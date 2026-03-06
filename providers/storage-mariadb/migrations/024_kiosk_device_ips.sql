-- Migration 024: Kiosk device IPs + chore instance photo column upgrade
-- v1.8.0

-- Add kiosk allowed IPs setting (JSON array of IP strings)
ALTER TABLE `settings` ADD COLUMN IF NOT EXISTS `kioskAllowedIps` TEXT NULL AFTER `localCidrs`;

-- Upgrade chore_instances photoUrl from VARCHAR(500) to TEXT for JSON array storage
ALTER TABLE `chore_instances` MODIFY COLUMN `photoUrl` TEXT NULL;
