CREATE TABLE `adStatistics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resourceId` int NOT NULL,
	`resourceType` enum('banner','native_ad') NOT NULL,
	`impressions` int NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`date` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `banners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`imageUrl` varchar(500) NOT NULL,
	`imageKey` varchar(500) NOT NULL,
	`externalLink` varchar(500) NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `nativeAds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`imageUrl` varchar(500) NOT NULL,
	`imageKey` varchar(500) NOT NULL,
	`price` int,
	`discount` varchar(100),
	`externalLink` varchar(500) NOT NULL,
	`label` varchar(50) NOT NULL DEFAULT '贊助',
	`position` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
DROP TABLE `productReviews`;--> statement-breakpoint
ALTER TABLE `categories` DROP INDEX `categories_name_unique`;--> statement-breakpoint
ALTER TABLE `categories` DROP INDEX `categories_slug_unique`;--> statement-breakpoint
ALTER TABLE `userProfiles` DROP INDEX `userProfiles_userId_unique`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_openId_unique`;--> statement-breakpoint
ALTER TABLE `orderItems` DROP FOREIGN KEY `orderItems_productId_products_id_fk`;
--> statement-breakpoint
ALTER TABLE `reviewReplies` DROP FOREIGN KEY `reviewReplies_reviewId_productReviews_id_fk`;
--> statement-breakpoint
ALTER TABLE `categories` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `conversations` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `messages` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `notifications` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `orderItems` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `orders` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `productImages` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `products` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `reviewReplies` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `reviews` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `userProfiles` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `users` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `categories` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `conversations` MODIFY COLUMN `productId` int;--> statement-breakpoint
ALTER TABLE `conversations` MODIFY COLUMN `lastMessageAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `conversations` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `messages` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `orderItems` MODIFY COLUMN `quantity` int NOT NULL;--> statement-breakpoint
ALTER TABLE `orderItems` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `status` enum('pending','completed','cancelled','disputed','delivered','shipped','confirmed') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `recipientName` varchar(100);--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `recipientPhone` varchar(20);--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `recipientAddress` text;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `productImages` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `condition` enum('brand_new','like_new','good','fair') NOT NULL DEFAULT 'good';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `reviewReplies` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `orderId` int;--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `title` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `content` text;--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `userProfiles` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `orders` ADD `productId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `totalPrice` int NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `trackingNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `products` ADD `titleCn` varchar(255);--> statement-breakpoint
ALTER TABLE `products` ADD `location` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `reviews` ADD `sellerId` int NOT NULL;--> statement-breakpoint
CREATE INDEX `adStatistics_resourceId_type` ON `adStatistics` (`resourceId`,`resourceType`);--> statement-breakpoint
ALTER TABLE `orderItems` ADD CONSTRAINT `orderItems_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviewReplies` ADD CONSTRAINT `reviewReplies_reviewId_reviews_id_fk` FOREIGN KEY (`reviewId`) REFERENCES `reviews`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_sellerId_users_id_fk` FOREIGN KEY (`sellerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE INDEX `userProfiles_userId_unique` ON `userProfiles` (`userId`);--> statement-breakpoint
CREATE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `totalAmount`;--> statement-breakpoint
ALTER TABLE `reviewReplies` DROP COLUMN `updatedAt`;--> statement-breakpoint
ALTER TABLE `reviews` DROP COLUMN `updatedAt`;