import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: process.env.DATABASE_URL?.split('@')[1]?.split(':')[0] || 'localhost',
  user: process.env.DATABASE_URL?.split('://')[1]?.split(':')[0] || 'root',
  password: process.env.DATABASE_URL?.split(':')[1]?.split('@')[0] || '',
  database: process.env.DATABASE_URL?.split('/')[3]?.split('?')[0] || 'test',
  ssl: 'Amazon RDS',
});

try {
  const [rows] = await conn.query('DESCRIBE orders');
  console.log('Orders table structure:');
  console.log(rows);
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await conn.end();
}
