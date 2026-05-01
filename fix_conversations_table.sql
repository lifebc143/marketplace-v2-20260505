-- 修改 conversations 表，使 productId 為可選
ALTER TABLE `conversations` MODIFY COLUMN `productId` int NULL;
