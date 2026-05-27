import mysql from 'mysql2/promise';

async function testConnection() {
  let conn;
  try {
    console.log('📡 keban_app veritabanına bağlanıyor...');
    console.log('   Host: gateway01.eu-central-1.prod.aws.tidbcloud.com');
    console.log('   Database: keban_app');
    console.log('   User: 2UkMMcfEvYMQNtS.root\n');
    
    conn = await mysql.createConnection({
      host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '2UkMMcfEvYMQNtS.root',
      password: 'pRancyW9vAymmp8c',
      database: 'keban_app',
      ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    });
    
    console.log('✅ BAĞLANDI!\n');
    
    // Test queries
    console.log('📊 Veritabanı Bilgileri:');
    
    // Current database
    const [[{ db }]] = await conn.execute('SELECT DATABASE() as db');
    console.log(`   Aktif Database: ${db}`);
    
    // Table count
    const [[{ tableCount }]] = await conn.execute(
      "SELECT COUNT(*) as tableCount FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'keban_app'"
    );
    console.log(`   Toplam Tablo: ${tableCount}`);
    
    // Row counts
    console.log('\n📋 Tablo Satır Sayıları:');
    const [tables] = await conn.execute(
      "SELECT TABLE_NAME, TABLE_ROWS FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'keban_app' AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"
    );
    
    for (const table of tables) {
      if (table.TABLE_ROWS > 0) {
        console.log(`   ${table.TABLE_NAME}: ${table.TABLE_ROWS} satır`);
      }
    }
    
    // Specific checks
    console.log('\n🔍 Önemli Tablolar:');
    
    const [[{ userCount }]] = await conn.execute('SELECT COUNT(*) as userCount FROM users');
    console.log(`   users: ${userCount} satır`);
    
    const [[{ branchCount }]] = await conn.execute('SELECT COUNT(*) as branchCount FROM branches');
    console.log(`   branches: ${branchCount} satır`);
    
    const [[{ questionCount }]] = await conn.execute('SELECT COUNT(*) as questionCount FROM field_inspection_questions');
    console.log(`   field_inspection_questions: ${questionCount} satır`);
    
    const [[{ categoryCount }]] = await conn.execute('SELECT COUNT(*) as categoryCount FROM field_inspection_categories');
    console.log(`   field_inspection_categories: ${categoryCount} satır`);
    
    console.log('\n✅ BAŞARILI! keban_app veritabanı tamamen çalışıyor.');
    
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ HATA:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

testConnection();
