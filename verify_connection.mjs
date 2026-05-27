import mysql from 'mysql2/promise';

async function verify() {
  let conn;
  try {
    console.log('📡 keban_app database\'e bağlanıyor...');
    conn = await mysql.createConnection({
      host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '2UkMMcfEvYMQNtS.root',
      password: 'pRancyW9vAymmp8c',
      database: 'keban_app',
      ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    });
    console.log('✓ Bağlantı başarılı!\n');
    
    // SELECT DATABASE()
    console.log('📋 Sorgu 1: SELECT DATABASE()');
    const [[dbResult]] = await conn.execute('SELECT DATABASE()');
    console.log(`✓ Aktif Database: ${Object.values(dbResult)[0]}\n`);
    
    // SHOW TABLES
    console.log('📋 Sorgu 2: SHOW TABLES');
    const [tables] = await conn.execute('SHOW TABLES');
    console.log(`✓ Toplam ${tables.length} tablo:`);
    tables.forEach(t => {
      const tableName = Object.values(t)[0];
      console.log(`   - ${tableName}`);
    });
    console.log();
    
    // SELECT COUNT(*) FROM field_inspection_questions
    console.log('📋 Sorgu 3: SELECT COUNT(*) FROM field_inspection_questions');
    const [[countResult]] = await conn.execute('SELECT COUNT(*) as total FROM field_inspection_questions');
    console.log(`✓ Toplam Sorular: ${countResult.total}\n`);
    
    // Ek doğrulama
    console.log('📋 Ek Doğrulama:');
    const [[catCount]] = await conn.execute('SELECT COUNT(*) as total FROM field_inspection_categories');
    console.log(`✓ Toplam Kategoriler: ${catCount.total}`);
    
    const [[criticalCount]] = await conn.execute('SELECT COUNT(*) as total FROM field_inspection_questions WHERE isCritical = 1');
    console.log(`✓ Kritik Sorular: ${criticalCount.total}`);
    
    const [[sampleQ]] = await conn.execute('SELECT questionText FROM field_inspection_questions LIMIT 1');
    console.log(`✓ Örnek Soru: ${sampleQ.questionText.substring(0, 50)}...`);
    
    console.log('\n✅ TÜM DOĞRULAMALAR BAŞARILI!');
    console.log('\n🔒 Bağlantı Bilgileri:');
    console.log('   Host: gateway01.eu-central-1.prod.aws.tidbcloud.com');
    console.log('   Database: keban_app');
    console.log('   User: 2UkMMcfEvYMQNtS.root');
    
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

verify();
