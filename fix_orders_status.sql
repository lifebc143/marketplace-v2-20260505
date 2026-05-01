-- 修改 orders 表的 status enum，添加 delivered 和 shipped 狀態
ALTER TABLE `orders` MODIFY COLUMN `status` ENUM('pending', 'completed', 'cancelled', 'disputed', 'delivered', 'shipped', 'confirmed') DEFAULT 'pending';
