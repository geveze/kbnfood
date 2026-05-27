import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

async function testLogin() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '2UkMMcfEvYMQNtS.root',
      password: 'pRancyW9vAymmp8c',
      database: 'keban_app',
      ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    });
    
    console.log('🔐 Login akisi test ediliyor...\n');
    
    // Admin kullanicisini bul
    const [users] = await conn.execute(
      'SELECT id, username, passwordHash, isActive, name, role FROM users WHERE username = ?',
      ['admin']
    );
    
    if (users.length === 0) {
      console.log('❌ Admin kullanicisi bulunamadi');
      process.exit(1);
    }
    
    const user = users[0];
    console.log('✓ Admin kullanicisi bulundu:');
    console.log(`  - Username: ${user.username}`);
    console.log(`  - Name: ${user.name}`);
    console.log(`  - Role: ${user.role}`);
    console.log(`  - Active: ${user.isActive ? 'Evet' : 'Hayir'}\n`);
    
    // Sifre dogrula
    const password = '123456';
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      console.log('❌ Sifre dogrulamasi basarisiz');
      process.exit(1);
    }
    
    console.log('✓ Sifre dogrulamasi basarili\n');
    
    // Session olustur (simule)
    console.log('✓ Login akisi BASARILI\n');
    console.log('Kullanici: admin');
    console.log('Sifre: 123456');
    console.log('Rol: admin');
    console.log('Durum: Aktif\n');
    
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ HATA:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

testLogin();
