CREATE TABLE IF NOT EXISTS `announcement_reads` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `messageId` BIGINT UNSIGNED NOT NULL,
  `userId` BIGINT UNSIGNED NOT NULL,
  `readAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_announcement_user` (`messageId`, `userId`),
  KEY `idx_announcement_reads_user` (`userId`),
  CONSTRAINT `fk_announcement_reads_message` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_announcement_reads_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create conversations table if not exists
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user1Id` BIGINT UNSIGNED NOT NULL,
  `user2Id` BIGINT UNSIGNED NOT NULL,
  `lastMessageAt` DATETIME(3) NULL,
  `lastMessagePreview` VARCHAR(100) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conversation_users` (`user1Id`, `user2Id`),
  KEY `idx_conversations_user1` (`user1Id`),
  KEY `idx_conversations_user2` (`user2Id`),
  CONSTRAINT `fk_conversations_user1` FOREIGN KEY (`user1Id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_conversations_user2` FOREIGN KEY (`user2Id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
