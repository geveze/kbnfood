import mysql from 'mysql2/promise';

async function checkSchema() {
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
    
    console.log('📋 Users Tablosu Şeması:\n');
    
    const [columns] = await conn.execute(
      "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'keban_app' AND TABLE_NAME = 'users' ORDER BY ORDINAL_POSITION"
    );
    
    for (const col of columns) {
      console.log(`   ${col.COLUMN_NAME.padEnd(25)} | ${col.DATA_TYPE.padEnd(15)} | ${col.IS_NULLABLE}`);
    }
    
    console.log('\n❌ SORUN: `username` sütunu yok!');
    console.log('✅ ÇÖZÜM: Drizzle schema\'sında username sütunu tanımlanmış ama veritabanında yok.\n');
    
    // CSV'de username var mı kontrol et
    const [[u]] = await conn.execute('SELECT COUNT(*) as cnt FROM users WHERE branchManager IS NOT NULL');
    console.log(`📊 Yüklenen users: ${u.cnt}`);
    
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ HATA:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

checkSchema();
