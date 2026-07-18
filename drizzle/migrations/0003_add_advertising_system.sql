-- 首頁 Banner 輪播表
CREATE TABLE `banners` (
  `id` int AUTO_INCREMENT NOT NULL,
  `title` varchar(255) NOT NULL,
  `imageUrl` varchar(500) NOT NULL,
  `imageKey` varchar(500) NOT NULL,
  `externalLink` varchar(500) NOT NULL,
  `position` int NOT NULL DEFAULT 0,
  `isActive` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 商品列表原生廣告表
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
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 廣告統計表
CREATE TABLE `adStatistics` (
  `id` int AUTO_INCREMENT NOT NULL,
  `resourceId` int NOT NULL,
  `resourceType` ENUM('banner', 'native_ad') NOT NULL,
  `impressions` int NOT NULL DEFAULT 0,
  `clicks` int NOT NULL DEFAULT 0,
  `date` varchar(10) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `adStatistics_resourceId_type` (`resourceId`, `resourceType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
