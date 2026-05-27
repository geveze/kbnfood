import mysql from 'mysql2/promise';

async function checkColumns() {
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
    
    console.log('📋 Users tablosu sütunları:\n');
    const [columns] = await conn.execute(
      "SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'keban_app' AND TABLE_NAME = 'users' ORDER BY ORDINAL_POSITION"
    );
    
    for (const col of columns) {
      console.log(`   ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
    }
    
    console.log('\n📊 Admin kullanıcısı:\n');
    const [users] = await conn.execute(
      'SELECT id, username, passwordHash, isActive, name, role FROM users WHERE role = ?',
      ['admin']
    );
    
    console.log(JSON.stringify(users, null, 2));
    
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ HATA:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

checkColumns();
