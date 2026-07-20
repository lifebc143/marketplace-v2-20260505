#!/usr/bin/env node

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function transferOwner() {
  try {
    console.log('🔄 Starting Owner transfer process...\n');

    // Parse DATABASE_URL
    const url = new URL(DATABASE_URL);
    const connection = await mysql.createConnection({
      host: url.hostname,
      port: url.port ? parseInt(url.port) : 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: false },
    });

    // 查詢新 Owner 用戶
    console.log('📍 Looking for user: lifeabcalgary@gmail.com');
    const [newOwnerRows] = await connection.execute(
      'SELECT id, openId, name, email, role FROM users WHERE email = ?',
      ['lifeabcalgary@gmail.com']
    );

    if (!newOwnerRows || newOwnerRows.length === 0) {
      console.error('❌ User not found: lifeabcalgary@gmail.com');
      await connection.end();
      process.exit(1);
    }

    const newOwner = newOwnerRows[0];
    console.log('✅ User found:');
    console.log(`   ID: ${newOwner.id}`);
    console.log(`   OpenId: ${newOwner.openId}`);
    console.log(`   Name: ${newOwner.name}`);
    console.log(`   Email: ${newOwner.email}`);
    console.log(`   Current Role: ${newOwner.role}\n`);

    // 更新用戶角色為 admin（如果還不是）
    if (newOwner.role !== 'admin') {
      console.log('🔧 Updating user role to admin...');
      await connection.execute(
        'UPDATE users SET role = ? WHERE id = ?',
        ['admin', newOwner.id]
      );
      console.log('✅ Role updated to admin\n');
    } else {
      console.log('✅ User is already admin\n');
    }

    // 查詢舊 Owner（如果存在）
    console.log('🔍 Looking for old owner account...');
    const [oldOwnerRows] = await connection.execute(
      'SELECT id, openId, name, email, role FROM users WHERE email = ?',
      ['lifebc@dayeasy-ai.com']
    );

    if (oldOwnerRows && oldOwnerRows.length > 0) {
      const oldOwner = oldOwnerRows[0];
      console.log('⚠️  Found old owner account:');
      console.log(`   ID: ${oldOwner.id}`);
      console.log(`   Email: ${oldOwner.email}`);
      console.log(`   Role: ${oldOwner.role}`);
      console.log('   (Keeping this account for historical records)\n');
    } else {
      console.log('✅ No old owner account found\n');
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Owner Transfer Complete!');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📋 Summary:');
    console.log(`   New Owner Email: lifeabcalgary@gmail.com`);
    console.log(`   New Owner ID: ${newOwner.id}`);
    console.log(`   New Owner OpenId: ${newOwner.openId}`);
    console.log(`   Role: admin`);
    console.log('\n✨ The marketplace is now under your ownership!\n');

    await connection.end();
  } catch (error) {
    console.error('❌ Error during transfer:', error.message);
    process.exit(1);
  }
}

transferOwner();
