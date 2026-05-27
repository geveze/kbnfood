import mysql from 'mysql2/promise';

async function checkCurrentDb() {
  let conn;
  try {
    console.log('📡 Bağlantı kontrol ediliyor...\n');
    
    // Manuel konfigürasyonu kullan
    conn = await mysql.createConnection({
      host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '2UkMMcfEvYMQNtS.root',
      password: 'pRancyW9vAymmp8c',
      database: 'keban_app',
      ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    });
    
    console.log('✓ Bağlantı başarılı\n');
    
    // Mevcut veritabanını kontrol et
    const [[{ database }]] = await conn.execute('SELECT DATABASE() as database');
    console.log(`📊 Mevcut Veritabanı: ${database}`);
    
    // Tabloları listele
    const [tables] = await conn.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME"
    );
    console.log(`\n📋 Toplam Tablo: ${tables.length}\n`);
    
    for (const table of tables) {
      console.log(`   - ${table.TABLE_NAME}`);
    }
    
    // field_inspection_questions kontrol et
    const [[{ questionCount }]] = await conn.execute(
      'SELECT COUNT(*) as questionCount FROM field_inspection_questions'
    );
    console.log(`\n🔍 field_inspection_questions: ${questionCount} soru`);
    
    // Kategorileri kontrol et
    const [[{ categoryCount }]] = await conn.execute(
      'SELECT COUNT(*) as categoryCount FROM field_inspection_categories'
    );
    console.log(`🔍 field_inspection_categories: ${categoryCount} kategori`);
    
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ HATA:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

checkCurrentDb();
