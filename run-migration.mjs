import mysql from 'mysql2/promise';
import fs from 'fs';

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

    const sql = fs.readFileSync('./drizzle/migrations/0002_rebuild_orders_table.sql', 'utf8');
    const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          console.log('Executing:', statement.trim().substring(0, 80) + '...');
          await connection.execute(statement);
          console.log('✓ Success');
        } catch (error) {
          console.error('✗ Error:', error.message);
          throw error;
        }
      }
    }
    
    await connection.end();
    console.log('✓ Migration completed successfully');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
})();
