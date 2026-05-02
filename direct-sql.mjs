import mysql from 'mysql2/promise';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

// Parse DATABASE_URL
const url = new URL(databaseUrl);
const config = {
  host: url.hostname,
  port: url.port,
  user: url.username,
  password: url.password,
  database: url.pathname.split('/')[1],
  ssl: { rejectUnauthorized: false },
};

console.log('Connecting to database:', config.host, config.database);

(async () => {
  try {
    const connection = await mysql.createConnection(config);
    console.log('✓ Connected to database');

    // Step 1: Drop foreign key from reviews table
    console.log('\n1. Dropping foreign key from reviews table...');
    try {
      await connection.execute('ALTER TABLE `reviews` DROP FOREIGN KEY `reviews_orderId_orders_id_fk`');
      console.log('✓ Foreign key dropped');
    } catch (error) {
      console.log('⚠ Foreign key already dropped or does not exist:', error.message);
    }

    // Step 2: Drop reviews table
    console.log('\n2. Dropping reviews table...');
    await connection.execute('DROP TABLE IF EXISTS `reviews`');
    console.log('✓ reviews table dropped');

    // Step 3: Drop orderItems table
    console.log('\n3. Dropping orderItems table...');
    await connection.execute('DROP TABLE IF EXISTS `orderItems`');
    console.log('✓ orderItems table dropped');

    // Step 4: Drop orders table
    console.log('\n4. Dropping orders table...');
    await connection.execute('DROP TABLE IF EXISTS `orders`');
    console.log('✓ orders table dropped');

    // Step 5: Create new orders table
    console.log('\n5. Creating new orders table...');
    const createOrdersSQL = `CREATE TABLE \`orders\` (
  \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  \`buyerId\` int NOT NULL,
  \`sellerId\` int NOT NULL,
  \`productId\` int NOT NULL,
  \`totalPrice\` int NOT NULL,
  \`status\` enum('pending','completed','cancelled','disputed','delivered','shipped','confirmed') NOT NULL DEFAULT 'pending',
  \`shippingAddress\` text,
  \`trackingNumber\` varchar(100),
  \`notes\` text,
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`buyerId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`sellerId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`productId\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;
    
    await connection.execute(createOrdersSQL);
    console.log('✓ orders table created');

    // Step 6: Create orderItems table
    console.log('\n6. Creating orderItems table...');
    const createOrderItemsSQL = `CREATE TABLE \`orderItems\` (
  \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  \`orderId\` int NOT NULL,
  \`productId\` int NOT NULL,
  \`quantity\` int NOT NULL,
  \`price\` int NOT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`orderId\`) REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`productId\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;
    
    await connection.execute(createOrderItemsSQL);
    console.log('✓ orderItems table created');

    // Step 7: Verify
    console.log('\n7. Verifying orders table structure...');
    const columns = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'orders' AND TABLE_SCHEMA = ? ORDER BY ORDINAL_POSITION`,
      [config.database]
    );
    
    console.log('✓ Current columns in orders table:');
    columns[0].forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}`);
    });

    await connection.end();
    console.log('\n✓ Migration completed successfully!');
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
})();
