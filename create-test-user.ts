import { drizzle } from 'drizzle-orm/mysql2';
import { users } from './drizzle/schema';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function createTestUser() {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    const db = drizzle(connection);

    // Şifre hash'le
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Admin kullanıcı oluştur
    await db.insert(users).values({
      username: 'admin',
      passwordHash: hashedPassword,
      name: 'Sistem Yöneticisi',
      email: 'admin@kebanfood.com',
      role: 'admin',
      isActive: true,
    });

    console.log('✓ Test admin kullanıcısı oluşturuldu');
    console.log('  Kullanıcı adı: admin');
    console.log('  Şifre: admin123');

    // Bölge müdürü kullanıcı oluştur
    await db.insert(users).values({
      username: 'bolge_muduru',
      passwordHash: hashedPassword,
      name: 'Bölge Operasyon Müdürü',
      email: 'bolge@kebanfood.com',
      role: 'region_manager',
      isActive: true,
    });

    console.log('✓ Test bölge müdürü kullanıcısı oluşturuldu');
    console.log('  Kullanıcı adı: bolge_muduru');
    console.log('  Şifre: admin123');

    await connection.end();
  } catch (error: any) {
    console.error('Hata:', error.message);
    process.exit(1);
  }
}

createTestUser();
