import mysql from 'mysql2/promise';

async function checkDb() {
  let conn;
  try {
    console.log('📡 Bağlantı kontrol ediliyor...\n');
    
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
    const [[row]] = await conn.execute('SELECT DATABASE() AS db');
    console.log(`📊 Mevcut Veritabanı: ${row.db}`);
    
    // Tabloları listele
    const [tables] = await conn.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'keban_app' ORDER BY TABLE_NAME"
    );
    console.log(`\n📋 Toplam Tablo: ${tables.length}\n`);
    
    for (const table of tables) {
      console.log(`   - ${table.TABLE_NAME}`);
    }
    
    // field_inspection_questions kontrol et
    const [[q]] = await conn.execute(
      'SELECT COUNT(*) as cnt FROM field_inspection_questions'
    );
    console.log(`\n🔍 field_inspection_questions: ${q.cnt} soru`);
    
    // Kategorileri kontrol et
    const [[c]] = await conn.execute(
      'SELECT COUNT(*) as cnt FROM field_inspection_categories'
    );
    console.log(`🔍 field_inspection_categories: ${c.cnt} kategori`);
    
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ HATA:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

checkDb();
