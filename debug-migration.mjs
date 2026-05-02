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

    // First, check current table structure
    console.log('\n=== Current orders table structure ===');
    const columns = await connection.execute(
      `SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'orders' AND TABLE_SCHEMA = ? ORDER BY ORDINAL_POSITION`,
      [config.database]
    );
    
    columns[0].forEach(col => {
      console.log(`  ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
    });

    // Try to drop the table
    console.log('\n=== Attempting to drop orders table ===');
    try {
      await connection.execute('DROP TABLE IF EXISTS `orderItems`');
      console.log('✓ Dropped orderItems table');
    } catch (error) {
      console.error('✗ Error dropping orderItems:', error.message);
    }

    try {
      await connection.execute('DROP TABLE IF EXISTS `orders`');
      console.log('✓ Dropped orders table');
    } catch (error) {
      console.error('✗ Error dropping orders:', error.message);
    }

    // Check if table still exists
    console.log('\n=== Checking if orders table still exists ===');
    const check = await connection.execute(
      `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'orders' AND TABLE_SCHEMA = ?`,
      [config.database]
    );
    
    if (check[0][0].count === 0) {
      console.log('✓ orders table has been successfully dropped');
    } else {
      console.log('✗ orders table still exists');
    }

    await connection.end();
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
})();
