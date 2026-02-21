-- Migration 019: Fix credentials table - add UNIQUE constraint on (userId, provider)
-- CRITICAL SECURITY FIX: Without this constraint, ON DUPLICATE KEY UPDATE silently
-- inserts duplicate rows instead of updating. This caused first-login password changes
-- to be ignored — users kept their temporary passwords.

-- Step 1: Remove duplicate credential rows, keeping only the LATEST one per (userId, provider)
DELETE c1 FROM credentials c1
INNER JOIN credentials c2
  ON c1.userId = c2.userId
  AND c1.provider = c2.provider
  AND c1.id < c2.id;

-- Step 2: Add the UNIQUE constraint so ON DUPLICATE KEY UPDATE works correctly
ALTER TABLE credentials
  ADD UNIQUE KEY `uk_credentials_user_provider` (`userId`, `provider`);
