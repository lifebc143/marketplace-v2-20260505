import mysql from 'mysql2/promise';
import fs from 'fs';

const sqlContent = fs.readFileSync('./fix_orders_table.sql', 'utf-8');

const conn = await mysql.createConnection({
  host: 'gateway05.us-east-1.prod.aws.tidbcloud.com',
  user: 'sEtm6eSnXTuD2mj.a2111603b6ed',
  password: '8Yek0cN1AxMq5vl2JS5v',
  database: 'LTcBwwGLuNmzc3ziqroBrP',
  ssl: {
    rejectUnauthorized: false,
  },
});

try {
  console.log('Executing SQL migration...');
  const statements = sqlContent.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
  
  for (const statement of statements) {
    if (statement.trim()) {
      console.log('Executing:', statement.substring(0, 100) + '...');
      await conn.query(statement);
    }
  }
  
  console.log('✅ SQL migration completed successfully!');
} catch (error) {
  console.error('❌ Error executing SQL:', error.message);
} finally {
  await conn.end();
}
