# 資料庫改進遷移指南

## 📋 概述

此遷移包含對 marketplace 資料庫的全面改進，包括：

- ✅ 修復外鍵約束不一致
- ✅ 添加軟刪除支持
- ✅ 添加用戶信譽系統
- ✅ 添加業務邏輯字段
- ✅ 添加數據驗證約束
- ✅ 創建新的業務表
- ✅ 優化查詢性能（索引）
- ✅ 支持審計日誌

## 🚀 執行步驟

### 方法 1：使用 Node.js 腳本（推薦）

```bash
# 確保環境變數已配置（.env 文件）
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=marketplace

# 運行遷移腳本
node apply_improvements.mjs
```

### 方法 2：手動執行 SQL

```bash
# 使用 MySQL CLI
mysql -h localhost -u root -p marketplace < improvement_migrations.sql

# 或在 MySQL Workbench 中複製 improvement_migrations.sql 內容並執行
```

### 方法 3：在 Node.js 應用中執行

```javascript
import fs from 'fs';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'marketplace',
  multipleStatements: true,
});

const sql = fs.readFileSync('improvement_migrations.sql', 'utf-8');
await connection.query(sql);
```

## 📊 修改詳情

### 1. 外鍵約束修復

**問題**：orderItems 表���用 `ON DELETE restrict`，而其他表使用 `ON DELETE cascade`

**修復**：
```sql
ALTER TABLE `orderItems` DROP FOREIGN KEY `orderItems_productId_products_id_fk`;
ALTER TABLE `orderItems` ADD CONSTRAINT `orderItems_productId_products_id_fk` 
  FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade;
```

### 2. 軟刪除字段

**products 表**：
- `deletedAt` - 刪除時間戳
- `deletedBy` - 刪除者 ID
- `deleteReason` - 刪除原因

**users 表**：
- `deletedAt` - 刪除時間戳
- `deactivatedAt` - 停用時間
- `deactivationReason` - 停用原因

**用途**：允許「軟刪除」，保留歷史數據同時隱藏已刪除記錄

### 3. 業務邏輯字段

| 表名 | 新欄位 | 類型 | 說明 |
|-----|--------|------|------|
| products | location | varchar(255) | 商品所在地區 |
| products | meetupPreference | enum | 見面/寄送偏好 |
| products | isUrgent | int | 是否急售 |
| users | reputation | decimal(3,2) | 用戶評分 (0-5) |
| users | totalRatings | int | 獲得評分次數 |
| users | responseTime | int | 平均回應時間（小時） |
| users | isBanned | int | 是否被禁用 |
| users | banReason | text | 禁用原因 |
| users | banUntil | timestamp | 禁用期限 |
| orders | paymentMethod | enum | 支付方式 |
| orders | shippingCost | int | 運費 |
| orders | trackingNumber | varchar(100) | 物流追蹤號 |
| orders | cancelReason | text | 取消原因 |
| orders | cancelledAt | timestamp | 取消時間 |
| orders | completedAt | timestamp | 完成時間 |

### 4. 新創建的表

#### `favorites` - 用戶收藏

```sql
CREATE TABLE `favorites` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `productId` int NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (`userId`, `productId`)
);
```

**用途**：用戶可以收藏喜歡的商品，方便後續查看

#### `reports` - 舉報系統

```sql
CREATE TABLE `reports` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `reportedBy` int NOT NULL,
  `reportType` enum('product','user','review') NOT NULL,
  `reportedId` int NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','reviewing','resolved','rejected') DEFAULT 'pending',
  `resolvedBy` int NULL,
  `resolutionNote` text NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `resolvedAt` timestamp NULL
);
```

**用途**：用戶可以舉報違規商品、用戶或評論

#### `blockedUsers` - 阻止清單

```sql
CREATE TABLE `blockedUsers` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `blockedUserId` int NOT NULL,
  `reason` text NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (`userId`, `blockedUserId`)
);
```

**用途**：用戶可以阻止騷擾者，防止接收其訊息

#### `auditLogs` - 審計日誌

```sql
CREATE TABLE `auditLogs` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `action` varchar(100) NOT NULL,
  `tableName` varchar(100) NOT NULL,
  `recordId` int NULL,
  `changedBy` int NULL,
  `oldValues` json NULL,
  `newValues` json NULL,
  `description` text NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP
);
```

**用途**：記錄所有重要操作，便於審計和故障排查

#### `userBans` - 禁用記錄

```sql
CREATE TABLE `userBans` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `bannedBy` int NOT NULL,
  `reason` text NOT NULL,
  `banUntil` timestamp NULL,
  `isActive` int DEFAULT 1,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `removedAt` timestamp NULL
);
```

**用途**：記錄用戶禁用信息，支持臨時禁用

### 5. 數據驗證約束

```sql
-- 價格必須非負
ALTER TABLE `products` ADD CONSTRAINT `products_price_positive` CHECK (`price` >= 0);
ALTER TABLE `orderItems` ADD CONSTRAINT `orderItems_price_positive` CHECK (`price` >= 0);
ALTER TABLE `orders` ADD CONSTRAINT `orders_totalAmount_positive` CHECK (`totalAmount` >= 0);

-- 評分必須在 1-5 之間
ALTER TABLE `productReviews` ADD CONSTRAINT CHECK (`rating` >= 1 AND `rating` <= 5);
ALTER TABLE `reviews` ADD CONSTRAINT CHECK (`rating` >= 1 AND `rating` <= 5);

-- 用戶信譽必須在 0-5 之間
ALTER TABLE `users` ADD CONSTRAINT `users_reputation_check` CHECK (`reputation` >= 0 AND `reputation` <= 5);
```

### 6. 查詢性能索引

添加了以下索引以優化常用查詢：

```sql
-- products 表
CREATE INDEX `idx_products_userId_status` ON `products`(`userId`, `status`);
CREATE INDEX `idx_products_categoryId` ON `products`(`categoryId`);
CREATE INDEX `idx_products_createdAt` ON `products`(`createdAt` DESC);
CREATE INDEX `idx_products_status` ON `products`(`status`);

-- users 表
CREATE INDEX `idx_users_email` ON `users`(`email`);
CREATE INDEX `idx_users_isBanned` ON `users`(`isBanned`);

-- orders 表
CREATE INDEX `idx_orders_buyerId_status` ON `orders`(`buyerId`, `status`);
CREATE INDEX `idx_orders_sellerId_status` ON `orders`(`sellerId`, `status`);

-- reviews 表
CREATE INDEX `idx_reviews_productId_rating` ON `reviews`(`productId`, `rating`);
CREATE INDEX `idx_reviews_sellerId` ON `reviews`(`sellerId`);

-- ... 更多索引見完整遷移文件
```

## ⚠️ 注意事項

### 執行前備份

**強烈建議在執行遷移前備份數據庫**：

```bash
# MySQL 備份
mysqldump -h localhost -u root -p marketplace > backup_before_migration_$(date +%Y%m%d_%H%M%S).sql

# 恢復備份（如需要）
mysql -h localhost -u root -p marketplace < backup_before_migration_*.sql
```

### 可能出現的警告

遷移過程中可能出現以下警告，這些都是正常的：

```
⚠️ 已存在（跳過）
```

這表示某個索引或約束已經存在，無需重新創建。

### 向下相容性

遷移是向下相容的：
- ✅ 現有數據不會被刪除
- ✅ 新添加的欄位都有預設值
- ✅ 不會破壞現有的查詢和 API

## 🧪 驗證遷移成功

遷移完成後，執行以下驗證：

```sql
-- 檢查新表是否已創建
SHOW TABLES LIKE '%favorites%';
SHOW TABLES LIKE '%reports%';
SHOW TABLES LIKE '%blockedUsers%';
SHOW TABLES LIKE '%auditLogs%';
SHOW TABLES LIKE '%userBans%';

-- 檢查新欄位是否已添加
DESCRIBE products;
DESCRIBE users;
DESCRIBE orders;
DESCRIBE reviews;

-- 檢查索引是否已創建
SHOW INDEX FROM products;
SHOW INDEX FROM users;
```

## 📝 後續工作

遷移完成後，建議進行以下工作：

### 1. 更新後端代碼

修改相關 API 以使用新欄位：

```typescript
// 例：獲取用戶信譽
const user = await db.users.findOne(userId);
console.log(user.reputation); // 0-5

// 例：檢查用戶是否被禁用
if (user.isBanned && (!user.banUntil || user.banUntil > new Date())) {
  throw new Error('此用戶已被禁用');
}

// 例：插入審計日誌
await db.auditLogs.create({
  action: 'DELETE_PRODUCT',
  tableName: 'products',
  recordId: productId,
  changedBy: adminId,
  newValues: { deletedAt: new Date() },
  description: `管理員刪除商品 #${productId}`,
});
```

### 2. 實現新功能

實現以下 API 端點：

- `POST /api/favorites/:productId` - 添加收藏
- `DELETE /api/favorites/:productId` - 移除收藏
- `GET /api/favorites` - 獲取收藏列表
- `POST /api/reports` - 舉報內容
- `POST /api/users/:userId/block` - 阻止用戶
- `GET /api/users/me/blocked` - 獲取被阻止的用戶

### 3. 更新前端

添加相應的 UI 組件：

- 收藏按鈕
- 舉報對話框
- 用戶信譽展示
- 阻止用戶選項

### 4. 數據遷移

如果有舊的相關數據，需要進行數據遷移：

```sql
-- 例：為現有訂單設置完成時間
UPDATE orders SET completedAt = updatedAt WHERE status = 'delivered';

-- 例：初始化用戶信譽（基於現有評論）
UPDATE users SET reputation = (
  SELECT AVG(rating) FROM reviews WHERE reviews.sellerId = users.id
) WHERE id IN (SELECT DISTINCT sellerId FROM reviews);
```

## 🆘 故障排查

### 遷移失敗

**如果遷移失敗**，檢查以下內容：

1. **數據庫連接**
   ```bash
   mysql -h localhost -u root -p -e "SELECT 1;"
   ```

2. **環境變數**
   ```bash
   cat .env | grep DB_
   ```

3. **權限問題**
   - 確保用戶有 ALTER 和 CREATE 權限
   - MySQL 用戶應該有 `GRANT ALL PRIVILEGES` 權限

4. **磁盤空間**
   ```sql
   SELECT table_schema, ROUND(SUM(data_length)/1024/1024, 2) as size_mb 
   FROM information_schema.tables GROUP BY table_schema;
   ```

### 回滾遷移

如果需要回滾，使用之前的備份：

```bash
mysql -h localhost -u root -p marketplace < backup_before_migration_*.sql
```

## 📞 支持

如有任何問題，請檢查以下資源：

- 遷移日誌文件（執行 `apply_improvements.mjs` 生成）
- MySQL 錯誤日誌
- GitHub Issues

---

**更新日期**：2026-05-12  
**版本**：1.0
