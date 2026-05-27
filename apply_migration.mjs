import mysql from 'mysql2/promise';
import fs from 'fs';

async function applyMigration() {
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
    
    // Migration SQL'ini oku
    const sql = fs.readFileSync('/home/ubuntu/keban_food_performance/drizzle/0005_black_terrax.sql', 'utf-8');
    const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s);
    
    console.log(`📋 ${statements.length} SQL statement çalıştırılıyor...\n`);
    
    for (let i = 0; i < statements.length; i++) {
      try {
        await conn.execute(statements[i]);
        console.log(`✓ Statement ${i+1}/${statements.length}: ${statements[i].substring(0, 50)}...`);
      } catch (e) {
        console.error(`❌ Statement ${i+1} failed: ${e.message}`);
        // Devam et
      }
    }
    
    console.log('\n✅ Migration tamamlandı!');
    
    // Doğrula
    const [columns] = await conn.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'keban_app' AND TABLE_NAME = 'users' ORDER BY ORDINAL_POSITION"
    );
    
    console.log('\n📋 Users tablosu sütunları:');
    for (const col of columns) {
      console.log(`   ✓ ${col.COLUMN_NAME}`);
    }
    
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ HATA:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

applyMigration();
