import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL;

async function applyMigrations() {
  // Parse connection string
  const url = new URL(DATABASE_URL.replace('mysql://', 'mysql2://'));
  
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: 'Amazon RDS',
  });

  try {
    // Read all SQL files and apply them
    const migrationsDir = './drizzle';
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && /^\d+_/.test(f))
      .sort();

    console.log('Found migration files:', files);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      // Split by statement-breakpoint and execute each statement
      const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s);
      
      for (const statement of statements) {
        if (statement) {
          try {
            console.log(`Executing from ${file}...`);
            await connection.execute(statement);
          } catch (error) {
            if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_KEYNAME') {
              console.log(`Skipping (already exists): ${error.message}`);
            } else {
              console.error(`Error executing statement:`, error.message);
              throw error;
            }
          }
        }
      }
    }

    console.log('All migrations applied successfully!');
  } finally {
    await connection.end();
  }
}

applyMigrations().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
