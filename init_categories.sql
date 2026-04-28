-- 初始化商品分類
INSERT IGNORE INTO `categories` (`name`, `slug`, `createdAt`, `updatedAt`) VALUES
('電子產品', 'electronics', NOW(), NOW()),
('服飾', 'clothing', NOW(), NOW()),
('家具', 'furniture', NOW(), NOW()),
('交通工具', 'vehicles', NOW(), NOW()),
('書籍', 'books', NOW(), NOW()),
('運動器材', 'sports', NOW(), NOW()),
('美妝', 'beauty', NOW(), NOW()),
('玩具', 'toys', NOW(), NOW()),
('其他', 'others', NOW(), NOW());
