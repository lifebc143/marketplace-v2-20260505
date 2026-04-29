import mysql from 'mysql2/promise';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

async function executeSql() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  // Parse connection string
  const url = new URL(DATABASE_URL.replace('mysql://', 'mysql2://'));
  
  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    // First apply base migrations
    console.log('\n=== Applying base migrations ===');
    const baseSql = fs.readFileSync('./all_base_migrations.sql', 'utf-8');
    const baseStatements = baseSql.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'));
    
    console.log(`Found ${baseStatements.length} base SQL statements`);

    for (let i = 0; i < baseStatements.length; i++) {
      const statement = baseStatements[i];
      try {
        console.log(`[${i + 1}/${baseStatements.length}] Executing...`);
        await connection.execute(statement);
        console.log(`✓ Success`);
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_KEYNAME') {
          console.log(`⊘ Skipping (already exists)`);
        } else {
          console.error(`✗ Error:`, error.message);
          // Continue with next statement
        }
      }
    }

    // Then apply missing migrations
    console.log('\n=== Applying missing migrations ===');
    const missingSql = fs.readFileSync('./apply_missing_migrations.sql', 'utf-8');
    const missingStatements = missingSql.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'));
    
    console.log(`Found ${missingStatements.length} missing SQL statements`);

    for (let i = 0; i < missingStatements.length; i++) {
      const statement = missingStatements[i];
      try {
        console.log(`[${i + 1}/${missingStatements.length}] Executing...`);
        await connection.execute(statement);
        console.log(`✓ Success`);
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_KEYNAME') {
          console.log(`⊘ Skipping (already exists)`);
        } else {
          console.error(`✗ Error:`, error.message);
          throw error;
        }
      }
    }

    console.log('\n✓ All SQL statements executed successfully!');
  } finally {
    await connection.end();
  }
}

executeSql().catch(error => {
  console.error('✗ Failed:', error.message);
  process.exit(1);
});
