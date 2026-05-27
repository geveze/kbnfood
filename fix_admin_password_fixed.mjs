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
    
    console.log('Admin sifresi hash olusturuluyor...\n');
    
    // Dogru bcrypt hash olustur
    const password = '123456';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    console.log('Yeni hash: ' + hash + '\n');
    
    // Admin kullanicisini guncelle
    await conn.execute(
      'UPDATE users SET passwordHash = ?, isActive = 1 WHERE username = ?',
      [hash, 'admin']
    );
    
    console.log('Admin kullanicisi guncellendi\n');
    
    // Dogrulamak icin hash'i test et
    const isValid = await bcrypt.compare(password, hash);
    console.log('Sifre dogrulamasi: ' + (isValid ? 'BASARILI' : 'BASARISIZ') + '\n');
    
    // Admin kullanicisini listele
    const [users] = await conn.execute(
      'SELECT id, username, isActive, name, role FROM users WHERE role = ?',
      ['admin']
    );
    
    console.log('Guncellenmis Admin Kullanicisi:\n');
    console.log(JSON.stringify(users, null, 2));
    
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('HATA:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

fixPassword();
