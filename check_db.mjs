import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
if (!match) {
  console.error('Invalid DATABASE_URL');
  process.exit(1);
}

const [, user, password, host, port, database] = match;

try {
  const connection = await mysql.createConnection({
    host,
    port: parseInt(port),
    user,
    password,
    database,
  });

  const [tables] = await connection.execute('SHOW TABLES');
  console.log('Tables in database:', tables.map(t => Object.values(t)[0]));
  
  await connection.end();
} catch (error) {
  console.error('Error:', error.message);
}
