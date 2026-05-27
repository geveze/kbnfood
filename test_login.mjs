import mysql from 'mysql2/promise';
import crypto from 'crypto';

async function testLogin() {
  let conn;
  try {
    console.log('📡 keban_app veritabanına bağlanıyor...\n');
    
    conn = await mysql.createConnection({
      host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '2UkMMcfEvYMQNtS.root',
      password: 'pRancyW9vAymmp8c',
      database: 'keban_app',
      ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    });
    
    console.log('✓ Bağlantı başarılı\n');
    
    // Admin kullanıcısını kontrol et
    console.log('📋 Admin kullanıcısını arıyor...\n');
    const [users] = await conn.execute(
      'SELECT id, username, passwordHash, name, email, role FROM users WHERE username = ?',
      ['admin']
    );
    
    if (users.length === 0) {
      console.log('❌ Admin kullanıcısı bulunamadı!');
      console.log('\n📊 Tüm kullanıcılar:');
      const [allUsers] = await conn.execute('SELECT id, username, name, email, role FROM users');
      for (const user of allUsers) {
        console.log(`   - ${user.username} (${user.name}) - Role: ${user.role}`);
      }
    } else {
      const user = users[0];
      console.log('✓ Admin kullanıcısı bulundu:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password Hash: ${user.passwordHash ? 'VAR' : 'YOK'}\n`);
      
      // Şifre hash'ini test et
      if (user.passwordHash) {
        // bcrypt hash formatı: $2a$10$... veya $2b$10$...
        console.log('🔐 Şifre hash formatı: ' + user.passwordHash.substring(0, 20) + '...');
      }
    }
    
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ HATA:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

testLogin();
