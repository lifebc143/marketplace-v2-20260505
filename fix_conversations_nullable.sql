-- 修改 conversations 表的 productId 為可選（允許 NULL）
ALTER TABLE `conversations` MODIFY COLUMN `productId` INT NULL;
