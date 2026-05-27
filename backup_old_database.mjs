import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// Eski veritabanı bağlantı bilgileri
const oldDbConfig = {
  host: 'gateway04.us-east-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '46m8FVVm7HSsc1z.root',
  password: 'Ae0Ii72ep2Bkl3oN6VNj',
  database: '6XmnMHSGkmqmcvGw6sxZ3M',
  ssl: {
    rejectUnauthorized: false
  }
};

async function backupDatabase() {
  let connection;
  try {
    console.log('📡 Eski TiDB veritabanına bağlanıyor...');
    console.log('Host:', oldDbConfig.host);
    
    connection = await mysql.createConnection(oldDbConfig);
    console.log('✓ Bağlantı başarılı!');
    
    // Backup dizini oluştur
    const backupDir = '/home/ubuntu/keban_food_performance/backups';
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup_${timestamp}.json`);
    
    console.log('\n📦 Veritabanı yedekleniyor...');
    
    const backup = {
      timestamp: new Date().toISOString(),
      database: oldDbConfig.database,
      tables: {}
    };
    
    // Tüm tabloları listele
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()"
    );
    
    console.log(`📋 Toplam ${tables.length} tablo bulundu`);
    
    // Her tablodan verileri al
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      console.log(`  📥 ${tableName} yedekleniyor...`);
      
      const [rows] = await connection.execute(`SELECT * FROM \`${tableName}\``);
      backup.tables[tableName] = rows;
      console.log(`     ✓ ${rows.length} satır yedeklendi`);
    }
    
    // Backup dosyasını kaydet
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf-8');
    console.log(`\n✅ Backup tamamlandı: ${backupFile}`);
    console.log(`📊 Toplam ${Object.keys(backup.tables).length} tablo yedeklendi`);
    
    // Özet bilgisi
    console.log('\n📋 Yedeklenen tablolar:');
    for (const [tableName, data] of Object.entries(backup.tables)) {
      console.log(`   - ${tableName}: ${data.length} satır`);
    }
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

backupDatabase();
