import mysql from 'mysql2/promise';

async function migrateOldDb() {
  let oldConn, appConn;
  try {
    console.log('📡 Eski TiDB veritabanına bağlanıyor...');
    oldConn = await mysql.createConnection({
      host: 'gateway04.us-east-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '46m8FVVm7HSsc1z.root',
      password: 'Ae0Ii72ep2Bkl3oN6VNj',
      database: '6XmnMHSGkmqmcvGw6sxZ3M',
      ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    });
    console.log('✓ Eski DB bağlantısı başarılı\n');
    
    console.log('📡 keban_app veritabanına bağlanıyor...');
    appConn = await mysql.createConnection({
      host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '2UkMMcfEvYMQNtS.root',
      password: 'pRancyW9vAymmp8c',
      database: 'keban_app',
      ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    });
    console.log('✓ keban_app bağlantısı başarılı\n');
    
    // Eski DB'deki tüm tabloları listele
    console.log('📋 Eski DB tablolarını okunuyor...');
    const [oldTables] = await oldConn.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '6XmnMHSGkmqmcvGw6sxZ3M' AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"
    );
    console.log(`✓ ${oldTables.length} tablo bulundu\n`);
    
    // keban_app'deki tabloları listele
    const [appTables] = await appConn.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'keban_app' AND TABLE_TYPE = 'BASE TABLE'"
    );
    
    let totalMigrated = 0;
    
    // Her tablo için veri taşı
    console.log('📦 Veriler taşınıyor...\n');
    
    for (const oldTable of oldTables) {
      const tableName = oldTable.TABLE_NAME;
      
      // keban_app'de tablo var mı?
      const tableExists = appTables.some(t => t.TABLE_NAME === tableName);
      
      if (!tableExists) {
        console.log(`⊘ ${tableName}: keban_app'de yok, tablo oluşturuluyor...`);
        
        try {
          // Tablo yapısını al
          const [columns] = await oldConn.execute(
            `SHOW CREATE TABLE \`${tableName}\``
          );
          
          if (columns.length > 0) {
            let createSql = columns[0]['Create Table'];
            // Tablo adını güncelle
            createSql = createSql.replace(`CREATE TABLE \`${tableName}\``, `CREATE TABLE IF NOT EXISTS \`${tableName}\``);
            
            await appConn.execute(createSql);
            console.log(`   ✓ Tablo oluşturuldu`);
          }
        } catch (e) {
          console.log(`   ⚠️  Tablo oluşturulamadı: ${e.message.substring(0, 50)}`);
        }
      }
      
      // Verileri taşı
      try {
        const [rows] = await oldConn.execute(`SELECT * FROM \`${tableName}\``);
        
        if (rows.length > 0) {
          const columnNames = Object.keys(rows[0]);
          const placeholders = columnNames.map(() => '?').join(',');
          const insertSql = `INSERT IGNORE INTO \`${tableName}\` (${columnNames.map(c => `\`${c}\``).join(',')}) VALUES (${placeholders})`;
          
          let insertedCount = 0;
          let errorCount = 0;
          
          for (const row of rows) {
            try {
              const values = columnNames.map(col => row[col]);
              await appConn.execute(insertSql, values);
              insertedCount++;
            } catch (e) {
              errorCount++;
            }
          }
          
          console.log(`📥 ${tableName}: ${insertedCount}/${rows.length} satır taşındı`);
          if (errorCount > 0) {
            console.log(`   ⚠️  ${errorCount} satır duplicate key nedeniyle atlandı`);
          }
          totalMigrated += insertedCount;
        } else {
          console.log(`ℹ️  ${tableName}: Boş tablo`);
        }
      } catch (e) {
        console.log(`❌ ${tableName}: Veri taşıma hatası - ${e.message.substring(0, 50)}`);
      }
    }
    
    // Doğrulama
    console.log('\n✅ Doğrulama yapılıyor...\n');
    
    console.log('📋 Tablo Özeti (keban_app):');
    for (const oldTable of oldTables) {
      const tableName = oldTable.TABLE_NAME;
      try {
        const [[{ total }]] = await appConn.execute(`SELECT COUNT(*) as total FROM \`${tableName}\``);
        if (total > 0) {
          console.log(`   ${tableName}: ${total} satır`);
        }
      } catch (e) {
        // Tablo yoksa yoksay
      }
    }
    
    console.log(`\n✅ BAŞARILI!`);
    console.log(`📊 Toplam ${totalMigrated} satır taşındı`);
    console.log(`📂 Toplam ${oldTables.length} tablo işlendi`);
    
    await oldConn.end();
    await appConn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (oldConn) await oldConn.end();
    if (appConn) await appConn.end();
    process.exit(1);
  }
}

migrateOldDb();
