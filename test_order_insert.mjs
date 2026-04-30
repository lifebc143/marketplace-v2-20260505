import { drizzle } from 'drizzle-orm/mysql2/driver';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

const poolConnection = await mysql.createPool({
  host: 'gateway05.us-east-1.prod.aws.tidbcloud.com',
  user: 'sEtm6eSnXTuD2mj.a2111603b6ed',
  password: '8Yek0cN1AxMq5vl2JS5v',
  database: 'LTcBwwGLuNmzc3ziqroBrP',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false,
  },
});

const db = drizzle(poolConnection, { schema });

try {
  // 測試插入
  const result = await db.insert(schema.orders).values({
    buyerId: 1,
    sellerId: 2,
    productId: 3,
    totalPrice: 100,
    status: 'pending',
    shippingAddress: 'Test Address',
    notes: 'Test Notes',
  });
  console.log('Insert successful:', result);
} catch (error) {
  console.error('Insert error:', error);
} finally {
  await poolConnection.end();
}
