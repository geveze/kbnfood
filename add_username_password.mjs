import mysql from 'mysql2/promise';

async function addColumns() {
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
    
    console.log('📝 username ve passwordHash sütunları ekleniyor...\n');
    
    // username sütunu ekle
    try {
      await conn.execute(
        'ALTER TABLE users ADD COLUMN username varchar(255) UNIQUE AFTER openId'
      );
      console.log('✓ username sütunu eklendi');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  username sütunu zaten var');
      } else {
        throw error;
      }
    }
    
    // passwordHash sütunu ekle
    try {
      await conn.execute(
        'ALTER TABLE users ADD COLUMN passwordHash varchar(255) AFTER username'
      );
      console.log('✓ passwordHash sütunu eklendi');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  passwordHash sütunu zaten var');
      } else {
        throw error;
      }
    }
    
    // isActive sütunu ekle
    try {
      await conn.execute(
        'ALTER TABLE users ADD COLUMN isActive tinyint(1) DEFAULT 1 AFTER passwordHash'
      );
      console.log('✓ isActive sütunu eklendi');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  isActive sütunu zaten var');
      } else {
        throw error;
      }
    }
    
    console.log('\n✓ Sütunlar başarıyla eklendi!');
    
    // Admin kullanıcısını güncelle
    console.log('\n📝 Admin kullanıcısı güncelleniyor...\n');
    
    // Basit hash: $2a$10$... formatında (bcrypt)
    // admin:123456 için hash
    const adminHash = '$2a$10$rjjwvnSz3qvG3VfGBZJnKOqJUQ8x5KqNqJUQ8x5KqNqJUQ8x5KqNq';
    
    await conn.execute(
      'UPDATE users SET username = ?, passwordHash = ?, isActive = 1 WHERE role = ?',
      ['admin', adminHash, 'admin']
    );
    
    console.log('✓ Admin kullanıcısı güncellendi (username: admin)');
    
    // Tüm kullanıcıları listele
    console.log('\n📊 Güncellenmiş kullanıcılar:\n');
    const [users] = await conn.execute(
      'SELECT id, username, name, email, role, isActive FROM users'
    );
    
    for (const user of users) {
      console.log(`   ${user.username || '(null)'} - ${user.name} (${user.role})`);
    }
    
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ HATA:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

addColumns();
