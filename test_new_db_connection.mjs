import mysql from 'mysql2/promise';

async function test() {
  let conn;
  try {
    console.log('📡 Yeni veritabanına bağlanıyor...');
    conn = await mysql.createConnection({
      host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '2UkMMcfEvYMQNtS.root',
      password: 'pRancyW9vAymmp8c',
      database: 'keban_app',
      ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    });
    console.log('✓ Bağlantı başarılı!\n');
    
    // Tüm tabloları kontrol et
    const [tables] = await conn.execute('SHOW TABLES');
    console.log(`📋 Toplam ${tables.length} tablo:`);
    tables.forEach(t => console.log(`   - ${Object.values(t)[0]}`));
    
    // Soru sayısını kontrol et
    const [[{ total: questions }]] = await conn.execute('SELECT COUNT(*) as total FROM field_inspection_questions');
    const [[{ total: categories }]] = await conn.execute('SELECT COUNT(*) as total FROM field_inspection_categories');
    const [[{ total: critical }]] = await conn.execute('SELECT COUNT(*) as total FROM field_inspection_questions WHERE isCritical = 1');
    
    console.log(`\n📊 Veri Özeti:`);
    console.log(`   - Sorular: ${questions}`);
    console.log(`   - Kategoriler: ${categories}`);
    console.log(`   - Kritik Sorular: ${critical}`);
    
    console.log(`\n✅ YENİ VERİTABANI BAŞARILI ÇALIŞIYOR!`);
    console.log(`\n🔒 Bağlantı Bilgileri:`);
    console.log(`   Host: gateway01.eu-central-1.prod.aws.tidbcloud.com`);
    console.log(`   Database: keban_app`);
    console.log(`   User: 2UkMMcfEvYMQNtS.root`);
    
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

test();
