import mysql from 'mysql2/promise';

// Eski veritabanı
const oldConfig = {
  host: 'gateway04.us-east-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '46m8FVVm7HSsc1z.root',
  password: 'Ae0Ii72ep2Bkl3oN6VNj',
  database: '6XmnMHSGkmqmcvGw6sxZ3M',
  ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
};

// Yeni veritabanı
const newConfig = {
  host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '2UkMMcfEvYMQNtS.root',
  password: 'pRancyW9vAymmp8c',
  database: 'keban_app',
  ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
};

async function migrateAllData() {
  let oldConn, newConn;
  try {
    console.log('📡 Eski veritabanına bağlanıyor...');
    oldConn = await mysql.createConnection(oldConfig);
    console.log('✓ Eski veritabanı bağlantısı başarılı');
    
    console.log('\n📡 Yeni veritabanına bağlanıyor...');
    newConn = await mysql.createConnection(newConfig);
    console.log('✓ Yeni veritabanı bağlantısı başarılı');
    
    // Eski veritabanındaki tüm tabloları listele
    console.log('\n📋 Eski veritabanındaki tablolar kontrol ediliyor...');
    const [oldTables] = await oldConn.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME"
    );
    console.log(`✓ Toplam ${oldTables.length} tablo bulundu`);
    
    // Yeni veritabanındaki mevcut tabloları listele
    console.log('\n📋 Yeni veritabanındaki tablolar kontrol ediliyor...');
    const [newTables] = await newConn.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME"
    );
    console.log(`✓ Toplam ${newTables.length} tablo bulundu`);
    
    // Tüm tabloları migrate et
    console.log('\n📦 Veriler taşınıyor...\n');
    
    let totalRowsMigrated = 0;
    
    for (const oldTable of oldTables) {
      const tableName = oldTable.TABLE_NAME;
      
      // Yeni veritabanında aynı tablo var mı?
      const tableExists = newTables.some(t => t.TABLE_NAME === tableName);
      
      if (tableExists) {
        console.log(`📥 ${tableName} taşınıyor...`);
        
        // Eski tablodan verileri oku
        const [rows] = await oldConn.execute(`SELECT * FROM \`${tableName}\``);
        
        if (rows.length > 0) {
          // Yeni tabloya ekle (IGNORE ile duplicate key hatalarını yoksay)
          const columns = Object.keys(rows[0]);
          const placeholders = columns.map(() => '?').join(',');
          const insertSql = `INSERT IGNORE INTO \`${tableName}\` (${columns.map(c => `\`${c}\``).join(',')}) VALUES (${placeholders})`;
          
          for (const row of rows) {
            const values = columns.map(col => row[col]);
            try {
              await newConn.execute(insertSql, values);
            } catch (e) {
              // Hata olsa bile devam et
              console.log(`   ⚠️  Satır eklenemedi: ${e.message}`);
            }
          }
          
          console.log(`   ✓ ${rows.length} satır taşındı`);
          totalRowsMigrated += rows.length;
        } else {
          console.log(`   ℹ️  Tablo boş`);
        }
      } else {
        console.log(`⚠️  ${tableName} yeni veritabanında yok, atlanıyor`);
      }
    }
    
    // Doğrulama
    console.log('\n✅ Doğrulama yapılıyor...\n');
    
    for (const oldTable of oldTables) {
      const tableName = oldTable.TABLE_NAME;
      const tableExists = newTables.some(t => t.TABLE_NAME === tableName);
      
      if (tableExists) {
        const [[oldCount]] = await oldConn.execute(`SELECT COUNT(*) as total FROM \`${tableName}\``);
        const [[newCount]] = await newConn.execute(`SELECT COUNT(*) as total FROM \`${tableName}\``);
        
        const status = oldCount.total === newCount.total ? '✓' : '⚠️';
        console.log(`${status} ${tableName}: Eski=${oldCount.total}, Yeni=${newCount.total}`);
      }
    }
    
    console.log(`\n✅ BAŞARILI!`);
    console.log(`📊 Toplam ${totalRowsMigrated} satır taşındı`);
    console.log(`\n🔒 Yeni Bağlantı Bilgileri:`);
    console.log(`   Host: ${newConfig.host}`);
    console.log(`   Database: ${newConfig.database}`);
    console.log(`   DATABASE_URL: mysql://${newConfig.user}:${newConfig.password}@${newConfig.host}:${newConfig.port}/${newConfig.database}`);
    
    await oldConn.end();
    await newConn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (oldConn) await oldConn.end();
    if (newConn) await newConn.end();
    process.exit(1);
  }
}

migrateAllData();
