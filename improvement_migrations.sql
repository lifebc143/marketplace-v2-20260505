-- ============================================================================
-- Marketplace 資料庫結構改進遷移
-- 日期: 2026-05-12
-- 目的: 修復現有問題、添加業務字段、優化查詢性能
-- ============================================================================

-- ============================================================================
-- 1. 修復外鍵約束不一致問題
-- ============================================================================
-- 移除舊的 restrict 約束
ALTER TABLE `orderItems` DROP FOREIGN KEY `orderItems_productId_products_id_fk`;

-- 添加新的 cascade 約束（保持一致性）
ALTER TABLE `orderItems` ADD CONSTRAINT `orderItems_productId_products_id_fk` 
  FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;

-- ============================================================================
-- 2. 添加軟刪除和審計字段到 products 表
-- ============================================================================
ALTER TABLE `products` ADD COLUMN `deletedAt` timestamp NULL COMMENT '軟刪除時間戳';
ALTER TABLE `products` ADD COLUMN `deletedBy` int NULL COMMENT '刪除者用戶ID';
ALTER TABLE `products` ADD COLUMN `deleteReason` text NULL COMMENT '刪除原因';
ALTER TABLE `products` ADD CONSTRAINT `products_deletedBy_users_id_fk` 
  FOREIGN KEY (`deletedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;

-- ============================================================================
-- 3. 添加軟刪除和審計字段到 users 表
-- ============================================================================
ALTER TABLE `users` ADD COLUMN `deletedAt` timestamp NULL COMMENT '軟刪除時間戳';
ALTER TABLE `users` ADD COLUMN `deactivatedAt` timestamp NULL COMMENT '帳號停用時間';
ALTER TABLE `users` ADD COLUMN `deactivationReason` text NULL COMMENT '停用原因';

-- ============================================================================
-- 4. 添加業務邏輯字段到 products 表
-- ============================================================================
ALTER TABLE `products` ADD COLUMN `location` varchar(255) NULL COMMENT '商品所在地區' AFTER `condition`;
ALTER TABLE `products` ADD COLUMN `meetupPreference` enum('shipping_only','meetup_only','both') DEFAULT 'both' COMMENT '見面/寄送偏好' AFTER `location`;
ALTER TABLE `products` ADD COLUMN `isUrgent` int DEFAULT 0 COMMENT '是否急售' AFTER `isAiGenerated`;

-- ============================================================================
-- 5. 添加業務邏輯字段到 users 表（用戶信譽系統）
-- ============================================================================
ALTER TABLE `users` ADD COLUMN `reputation` decimal(3,2) DEFAULT 5.00 COMMENT '用戶評分 (0-5)' AFTER `role`;
ALTER TABLE `users` ADD COLUMN `totalRatings` int DEFAULT 0 COMMENT '獲得的評分次數' AFTER `reputation`;
ALTER TABLE `users` ADD COLUMN `responseTime` int DEFAULT 0 COMMENT '平均回應時間（小時）' AFTER `totalRatings`;
ALTER TABLE `users` ADD COLUMN `isBanned` int DEFAULT 0 COMMENT '是否被禁用' AFTER `isActive`;
ALTER TABLE `users` ADD COLUMN `banReason` text NULL COMMENT '禁用原因' AFTER `isBanned`;
ALTER TABLE `users` ADD COLUMN `banUntil` timestamp NULL COMMENT '禁用期限' AFTER `banReason`;

-- ============================================================================
-- 6. 添加重要欄位到 orders 表
-- ============================================================================
ALTER TABLE `orders` ADD COLUMN `paymentMethod` enum('cash','bank_transfer','other') DEFAULT 'cash' COMMENT '支付方式' AFTER `notes`;
ALTER TABLE `orders` ADD COLUMN `shippingCost` int DEFAULT 0 COMMENT '運費（單位：分）' AFTER `paymentMethod`;
ALTER TABLE `orders` ADD COLUMN `trackingNumber` varchar(100) NULL COMMENT '物流追蹤號' AFTER `shippingCost`;
ALTER TABLE `orders` ADD COLUMN `cancelReason` text NULL COMMENT '取消原因' AFTER `trackingNumber`;
ALTER TABLE `orders` ADD COLUMN `cancelledAt` timestamp NULL COMMENT '取消時間' AFTER `cancelReason`;
ALTER TABLE `orders` ADD COLUMN `completedAt` timestamp NULL COMMENT '完成時間' AFTER `cancelledAt`;

-- ============================================================================
-- 7. 添加賣家ID欄位到 reviews 表（明確評分對象）
-- ============================================================================
ALTER TABLE `reviews` ADD COLUMN `sellerId` int NOT NULL COMMENT '賣家ID' AFTER `orderId`;
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_sellerId_users_id_fk` 
  FOREIGN KEY (`sellerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;

-- 添加唯一約束：防止重複評分
ALTER TABLE `reviews` ADD UNIQUE KEY `reviews_orderId_buyerId_unique` (`orderId`, `buyerId`);

-- ============================================================================
-- 8. 添加驗證約束
-- ============================================================================
-- 商品價格必須為正數
ALTER TABLE `products` ADD CONSTRAINT `products_price_positive` CHECK (`price` >= 0);

-- 訂單項目價格必須為正數
ALTER TABLE `orderItems` ADD CONSTRAINT `orderItems_price_positive` CHECK (`price` >= 0);

-- 訂單金額必須為正數
ALTER TABLE `orders` ADD CONSTRAINT `orders_totalAmount_positive` CHECK (`totalAmount` >= 0);

-- 評分必須在1-5之間
ALTER TABLE `productReviews` ADD CONSTRAINT `productReviews_rating_check` CHECK (`rating` >= 1 AND `rating` <= 5);
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_rating_check` CHECK (`rating` >= 1 AND `rating` <= 5);

-- 用戶信譽必須在0-5之間
ALTER TABLE `users` ADD CONSTRAINT `users_reputation_check` CHECK (`reputation` >= 0 AND `reputation` <= 5);

-- ============================================================================
-- 9. 創建新表：用戶收藏/願望清單
-- ============================================================================
CREATE TABLE IF NOT EXISTS `favorites` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `productId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `favorites_id` PRIMARY KEY(`id`),
  CONSTRAINT `favorites_user_product_unique` UNIQUE KEY (`userId`, `productId`),
  CONSTRAINT `favorites_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action,
  CONSTRAINT `favorites_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用戶收藏的商品';

-- ============================================================================
-- 10. 創建新表：用戶舉報/投訴系統
-- ============================================================================
CREATE TABLE IF NOT EXISTS `reports` (
  `id` int AUTO_INCREMENT NOT NULL,
  `reportedBy` int NOT NULL,
  `reportType` enum('product','user','review') NOT NULL,
  `reportedId` int NOT NULL,
  `reason` text NOT NULL,
  `description` text NULL,
  `status` enum('pending','reviewing','resolved','rejected') DEFAULT 'pending',
  `resolvedBy` int NULL,
  `resolutionNote` text NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolvedAt` timestamp NULL,
  CONSTRAINT `reports_id` PRIMARY KEY(`id`),
  CONSTRAINT `reports_reportedBy_users_id_fk` FOREIGN KEY (`reportedBy`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action,
  CONSTRAINT `reports_resolvedBy_users_id_fk` FOREIGN KEY (`resolvedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用戶舉報系統';

-- ============================================================================
-- 11. 創建新表：用戶阻止清單
-- ============================================================================
CREATE TABLE IF NOT EXISTS `blockedUsers` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `blockedUserId` int NOT NULL,
  `reason` text NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `blockedUsers_id` PRIMARY KEY(`id`),
  CONSTRAINT `blockedUsers_user_blocked_unique` UNIQUE KEY (`userId`, `blockedUserId`),
  CONSTRAINT `blockedUsers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action,
  CONSTRAINT `blockedUsers_blockedUserId_users_id_fk` FOREIGN KEY (`blockedUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用戶阻止清單（防騷擾）';

-- ============================================================================
-- 12. 創建新表：系統審計日誌
-- ============================================================================
CREATE TABLE IF NOT EXISTS `auditLogs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `action` varchar(100) NOT NULL,
  `tableName` varchar(100) NOT NULL,
  `recordId` int NULL,
  `changedBy` int NULL,
  `oldValues` json NULL,
  `newValues` json NULL,
  `description` text NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`),
  CONSTRAINT `auditLogs_changedBy_users_id_fk` FOREIGN KEY (`changedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系統審計日誌';

-- ============================================================================
-- 13. 創建新表：用戶禁止記錄
-- ============================================================================
CREATE TABLE IF NOT EXISTS `userBans` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `bannedBy` int NOT NULL,
  `reason` text NOT NULL,
  `banUntil` timestamp NULL,
  `isActive` int DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `removedAt` timestamp NULL,
  CONSTRAINT `userBans_id` PRIMARY KEY(`id`),
  CONSTRAINT `userBans_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action,
  CONSTRAINT `userBans_bannedBy_users_id_fk` FOREIGN KEY (`bannedBy`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用戶禁止記錄';

-- ============================================================================
-- 14. 添加查詢性能索引
-- ============================================================================

-- products 表索引
CREATE INDEX `idx_products_userId_status` ON `products`(`userId`, `status`);
CREATE INDEX `idx_products_categoryId` ON `products`(`categoryId`);
CREATE INDEX `idx_products_createdAt` ON `products`(`createdAt` DESC);
CREATE INDEX `idx_products_status` ON `products`(`status`);
CREATE INDEX `idx_products_title` ON `products`(`title`);
CREATE INDEX `idx_products_deletedAt` ON `products`(`deletedAt`);

-- users 表索引
CREATE INDEX `idx_users_email` ON `users`(`email`);
CREATE INDEX `idx_users_role` ON `users`(`role`);
CREATE INDEX `idx_users_isBanned` ON `users`(`isBanned`);
CREATE INDEX `idx_users_createdAt` ON `users`(`createdAt` DESC);

-- orders 表索引
CREATE INDEX `idx_orders_buyerId_status` ON `orders`(`buyerId`, `status`);
CREATE INDEX `idx_orders_sellerId_status` ON `orders`(`sellerId`, `status`);
CREATE INDEX `idx_orders_status` ON `orders`(`status`);
CREATE INDEX `idx_orders_createdAt` ON `orders`(`createdAt` DESC);

-- reviews 表索引
CREATE INDEX `idx_reviews_productId_rating` ON `reviews`(`productId`, `rating`);
CREATE INDEX `idx_reviews_buyerId` ON `reviews`(`buyerId`);
CREATE INDEX `idx_reviews_sellerId` ON `reviews`(`sellerId`);
CREATE INDEX `idx_reviews_createdAt` ON `reviews`(`createdAt` DESC);

-- productReviews 表索引
CREATE INDEX `idx_productReviews_productId_rating` ON `productReviews`(`productId`, `rating`);
CREATE INDEX `idx_productReviews_userId` ON `productReviews`(`userId`);
CREATE INDEX `idx_productReviews_createdAt` ON `productReviews`(`createdAt` DESC);

-- productImages 表索引
CREATE INDEX `idx_productImages_productId` ON `productImages`(`productId`, `displayOrder`);

-- userProfiles 表索引
CREATE INDEX `idx_userProfiles_userId` ON `userProfiles`(`userId`);

-- conversations 表索引（如果存在）
CREATE INDEX `idx_conversations_users` ON `conversations`(`userId1`, `userId2`);
CREATE INDEX `idx_conversations_createdAt` ON `conversations`(`createdAt` DESC);

-- ============================================================================
-- 15. 更新現有記錄的預設值
-- ============================================================================

-- 為現有商品添加預設位置
UPDATE `products` SET `location` = '未設定' WHERE `location` IS NULL;

-- 為現有用戶添加預設信譽分數
UPDATE `users` SET `reputation` = 5.00 WHERE `reputation` IS NULL;

-- ============================================================================
-- 遷移完成標記
-- ============================================================================
-- 此遷移腳本包含以下改進：
-- ✓ 修復外鍵約束不一致
-- ✓ 添加軟刪除支持
-- ✓ 添加用戶信譽系統
-- ✓ 添加業務邏輯字段
-- ✓ 添加數據驗證約束
-- ✓ 創建新的業務表（收藏、舉報、禁用等）
-- ✓ 優化查詢性能（添加索引）
-- ✓ 支持審計日誌
-- ============================================================================
