import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

async function fixPassword() {
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
    
    console.log('🔐 Admin şifresi hash'i oluşturuluyor...\n');
    
    // Doğru bcrypt hash oluştur
    const password = '123456';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    console.log(`✓ Yeni hash: ${hash}\n`);
    
    // Admin kullanıcısını güncelle
    await conn.execute(
      'UPDATE users SET passwordHash = ?, isActive = 1 WHERE username = ?',
      [hash, 'admin']
    );
    
    console.log('✓ Admin kullanıcısı güncellendi\n');
    
    // Doğrulamak için hash'i test et
    const isValid = await bcrypt.compare(password, hash);
    console.log(`✓ Şifre doğrulaması: ${isValid ? 'BAŞARILI' : 'BAŞARISIZ'}\n`);
    
    // Admin kullanıcısını listele
    const [users] = await conn.execute(
      'SELECT id, username, isActive, name, role FROM users WHERE role = ?',
      ['admin']
    );
    
    console.log('📊 Güncellenmiş Admin Kullanıcısı:\n');
    console.log(JSON.stringify(users, null, 2));
    
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ HATA:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

fixPassword();
