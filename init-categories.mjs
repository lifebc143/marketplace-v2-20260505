import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'marketplace',
});

const categories = [
  { name: '電子產品', slug: 'electronics' },
  { name: '服飾', slug: 'clothing' },
  { name: '家具', slug: 'furniture' },
  { name: '交通工具', slug: 'vehicles' },
  { name: '書籍', slug: 'books' },
  { name: '運動器材', slug: 'sports' },
  { name: '美妝', slug: 'beauty' },
  { name: '玩具', slug: 'toys' },
  { name: '其他', slug: 'others' },
];

try {
  for (const cat of categories) {
    await connection.execute(
      'INSERT IGNORE INTO categories (name, slug) VALUES (?, ?)',
      [cat.name, cat.slug]
    );
    console.log(`✓ 分類已添加: ${cat.name}`);
  }
  console.log('\n所有分類初始化完成！');
} catch (error) {
  console.error('初始化分類失敗:', error);
} finally {
  await connection.end();
}
