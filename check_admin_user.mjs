import mysql from 'mysql2/promise';

async function checkAdmin() {
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
    
    console.log('📊 Users tablosu kontrolu:\n');
    
    // Tüm users'ı listele
    const [users] = await conn.execute('SELECT * FROM users LIMIT 5');
    console.log('Toplam users: ' + users.length);
    console.log('\nIlk 5 user:\n');
    console.log(JSON.stringify(users, null, 2));
    
    // Admin kullanicisini ara
    console.log('\n\n🔍 Admin kullanicisini ariyoruz:\n');
    const [adminUsers] = await conn.execute(
      'SELECT id, username, passwordHash, isActive, name, role FROM users WHERE username = ? OR role = ?',
      ['admin', 'admin']
    );
    
    if (adminUsers.length === 0) {
      console.log('❌ Admin kullanicisi bulunamadi!');
    } else {
      console.log('✓ Admin kullanicilari bulundu:\n');
      console.log(JSON.stringify(adminUsers, null, 2));
    }
    
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('HATA:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

checkAdmin();
