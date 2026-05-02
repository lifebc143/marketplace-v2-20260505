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

    // Check if productId column exists
    const result = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'productId' AND TABLE_SCHEMA = ?`,
      [config.database]
    );

    if (result[0].length > 0) {
      console.log('✓ productId column exists in orders table');
    } else {
      console.log('✗ productId column DOES NOT exist in orders table');
      
      // Show all columns in orders table
      const columns = await connection.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'orders' AND TABLE_SCHEMA = ? ORDER BY ORDINAL_POSITION`,
        [config.database]
      );
      
      console.log('Current columns in orders table:');
      columns[0].forEach(col => {
        console.log('  -', col.COLUMN_NAME);
      });
    }
    
    await connection.end();
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
})();
