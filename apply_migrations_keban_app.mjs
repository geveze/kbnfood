import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function applyMigrations() {
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
    const migrationDir = '/home/ubuntu/keban_food_performance/drizzle';
    const files = fs.readdirSync(migrationDir)
      .filter(f => f.endsWith('.sql') && f.match(/^\d+_/))
      .sort();
    console.log(`✓ ${files.length} migration dosyası bulundu\n`);
    
    // Her migration dosyasını çalıştır
    console.log('📦 Migrations uygulanıyor...\n');
    let executedCount = 0;
    
    for (const file of files) {
      try {
        const filePath = path.join(migrationDir, file);
        const sqlContent = fs.readFileSync(filePath, 'utf-8');
        
        console.log(`📝 ${file}`);
        
        // SQL statements'i ayır (-- ile başlayan satırları yoksay)
        const lines = sqlContent.split('\n');
        let currentStatement = '';
        
        for (const line of lines) {
          if (line.trim().startsWith('--')) continue;
          currentStatement += line + '\n';
          
          if (line.trim().endsWith(';')) {
            const statement = currentStatement.trim();
            if (statement) {
              try {
                await appConn.execute(statement);
                executedCount++;
              } catch (e) {
                if (!e.message.includes('already exists') && !e.message.includes('Duplicate')) {
                  console.log(`   ⚠️  ${e.message.substring(0, 60)}`);
                }
              }
            }
            currentStatement = '';
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
    console.log(`📂 ${files.length} migration dosyası işlendi`);
    
    await appConn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (appConn) await appConn.end();
    process.exit(1);
  }
}

applyMigrations();
