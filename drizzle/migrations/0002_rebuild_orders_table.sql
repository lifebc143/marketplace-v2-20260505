-- Drop reviews table foreign key first
ALTER TABLE `reviews` DROP FOREIGN KEY `reviews_orderId_orders_id_fk`;

-- Drop existing reviews table (depends on orders)
DROP TABLE IF EXISTS `reviews`;

-- Drop existing orderItems table (depends on orders)
DROP TABLE IF EXISTS `orderItems`;

-- Drop existing orders table
DROP TABLE IF EXISTS `orders`;

-- Create new orders table with correct schema
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `buyerId` int NOT NULL,
  `sellerId` int NOT NULL,
  `productId` int NOT NULL,
  `totalPrice` int NOT NULL,
  `status` enum('pending','completed','cancelled','disputed','delivered','shipped','confirmed') NOT NULL DEFAULT 'pending',
  `shippingAddress` text,
  `trackingNumber` varchar(100),
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`buyerId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sellerId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create orderItems table
CREATE TABLE `orderItems` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `orderId` int NOT NULL,
  `productId` int NOT NULL,
  `quantity` int NOT NULL,
  `price` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
