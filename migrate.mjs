import mysql from 'mysql2/promise';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false },
};

console.log('Connecting to database:', config.host, config.database);

(async () => {
  try {
    const connection = await mysql.createConnection(config);
    console.log('✓ Connected to database');

    const sql = fs.readFileSync(`${__dirname}/drizzle/migrations/0001_add_productid_to_orders.sql`, 'utf8');
    const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          console.log('Executing:', statement.trim().substring(0, 80) + '...');
          await connection.execute(statement);
          console.log('✓ Success');
        } catch (error) {
          if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠ Column already exists, skipping');
          } else if (error.code === 'ER_DUP_KEYNAME') {
            console.log('⚠ Foreign key already exists, skipping');
          } else {
            console.error('✗ Error:', error.message);
          }
        }
      }
    }
    
    await connection.end();
    console.log('✓ Migration completed');
  } catch (error) {
    console.error('✗ Connection error:', error.message);
    process.exit(1);
  }
})();
