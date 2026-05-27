import mysql from 'mysql2/promise';
import fs from 'fs';

async function createAllTables() {
  let appConn;
  try {
    console.log('📡 keban_app veritabanına bağlanıyor...');
    appConn = await mysql.createConnection({
      host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '2UkMMcfEvYMQNtS.root',
      password: 'pRancyW9vAymmp8c',
      database: 'keban_app',
      ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    });
    console.log('✓ Bağlantı başarılı\n');
    
    // Drizzle migration dosyalarını bul
    console.log('📋 Migration dosyaları okunuyor...');
    const migrationDir = '/home/ubuntu/keban_food_performance/drizzle/migrations';
    const files = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql')).sort();
    console.log(`✓ ${files.length} migration dosyası bulundu\n`);
    
    // Her migration dosyasını çalıştır
    console.log('📦 Tablolar oluşturuluyor...\n');
    let executedCount = 0;
    
    for (const file of files) {
      try {
        const filePath = `${migrationDir}/${file}`;
        const sqlContent = fs.readFileSync(filePath, 'utf-8');
        
        // SQL statements'i ayır
        const statements = sqlContent.split(';').filter(s => s.trim());
        
        console.log(`📝 ${file}`);
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await appConn.execute(statement);
              executedCount++;
            } catch (e) {
              // Tablo zaten varsa yoksay
              if (!e.message.includes('already exists')) {
                console.log(`   ⚠️  ${e.message.substring(0, 50)}`);
              }
            }
          }
        }
        console.log(`   ✓ Başarılı`);
      } catch (e) {
        console.log(`   ❌ Hata: ${e.message.substring(0, 50)}`);
      }
    }
    
    // Mevcut tabloları listele
    console.log('\n✅ Doğrulama yapılıyor...\n');
    const [[{ total }]] = await appConn.execute(
      "SELECT COUNT(*) as total FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'keban_app' AND TABLE_TYPE = 'BASE TABLE'"
    );
    
    console.log(`📊 keban_app'de toplam ${total} tablo var\n`);
    
    // Tablo listesi
    console.log('📋 Tablolar:');
    const [tables] = await appConn.execute(
      "SELECT TABLE_NAME, TABLE_ROWS FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'keban_app' AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"
    );
    
    for (const table of tables) {
      console.log(`   ${table.TABLE_NAME}: ${table.TABLE_ROWS || 0} satır`);
    }
    
    console.log(`\n✅ BAŞARILI!`);
    console.log(`📊 ${executedCount} SQL statement çalıştırıldı`);
    
    await appConn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (appConn) await appConn.end();
    process.exit(1);
  }
}

createAllTables();
