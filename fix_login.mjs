import mysql from 'mysql2/promise';

async function fixLogin() {
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
    
    // users tablosunu kontrol et
    const [[u]] = await conn.execute('SELECT COUNT(*) as cnt FROM users');
    console.log(`📊 users tablosundaki kullanıcı sayısı: ${u.cnt}`);
    
    // Manus OAuth ile giriş yapılması gerekiyor
    console.log('\n⚠️  MANUS OAUTH GİRİŞİ GEREKLI\n');
    console.log('Sistem Manus OAuth kullanıyor. Giriş adımları:\n');
    console.log('1. Sayfaya gidin: https://3000-ibb9pi8acg381b5biqon4-94c360f1.sg1.manus.computer');
    console.log('2. "Giriş Yap" butonuna tıklayın');
    console.log('3. Manus hesabınız ile giriş yapın');
    console.log('4. Sistem otomatik olarak kullanıcı oluşturacak\n');
    
    // Şema kontrol et
    const [columns] = await conn.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'keban_app' AND TABLE_NAME = 'users' ORDER BY ORDINAL_POSITION"
    );
    
    console.log('📋 users tablosunun sütunları:');
    for (const col of columns) {
      console.log(`   - ${col.COLUMN_NAME}`);
    }
    
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ HATA:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

fixLogin();
