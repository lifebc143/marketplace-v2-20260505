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

(async () => {
  try {
    const connection = await mysql.createConnection(config);

    // Check all foreign keys referencing orders table
    const fks = await connection.execute(
      `SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
       FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
       WHERE REFERENCED_TABLE_NAME = 'orders' AND TABLE_SCHEMA = ?`,
      [config.database]
    );
    
    console.log('Foreign keys referencing orders table:');
    fks[0].forEach(fk => {
      console.log(`  ${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> orders.${fk.REFERENCED_COLUMN_NAME} (constraint: ${fk.CONSTRAINT_NAME})`);
    });

    await connection.end();
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
})();
