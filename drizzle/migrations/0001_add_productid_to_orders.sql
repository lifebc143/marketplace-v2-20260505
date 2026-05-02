-- Add productId column to orders table
ALTER TABLE `orders` ADD COLUMN `productId` int NOT NULL AFTER `sellerId`;

-- Add foreign key constraint
ALTER TABLE `orders` ADD CONSTRAINT `orders_productId_fk` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE;
