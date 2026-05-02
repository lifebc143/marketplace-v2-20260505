import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DATABASE_URL?.split('@')[1]?.split(':')[0] || 'localhost',
  user: process.env.DATABASE_URL?.split('://')[1]?.split(':')[0],
  password: process.env.DATABASE_URL?.split(':')[1]?.split('@')[0],
  database: process.env.DATABASE_URL?.split('/').pop()?.split('?')[0],
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  ssl: false
});

async function checkSchema() {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('DESCRIBE orders');
    console.log('Orders table schema:');
    console.table(rows);
    conn.release();
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

checkSchema();
