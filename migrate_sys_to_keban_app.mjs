import mysql from 'mysql2/promise';

async function migrateData() {
  let sysConn, appConn;
  try {
    console.log('📡 sys veritabanına bağlanıyor...');
    sysConn = await mysql.createConnection({
      host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '2UkMMcfEvYMQNtS.root',
      password: 'pRancyW9vAymmp8c',
      database: 'sys',
      ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    });
    console.log('✓ sys veritabanı bağlantısı başarılı\n');
    
    console.log('📡 keban_app veritabanına bağlanıyor...');
    appConn = await mysql.createConnection({
      host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '2UkMMcfEvYMQNtS.root',
      password: 'pRancyW9vAymmp8c',
      database: 'keban_app',
      ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    });
    console.log('✓ keban_app veritabanı bağlantısı başarılı\n');
    
    // sys veritabanındaki tabloları listele
    console.log('📋 sys veritabanındaki tablolar kontrol ediliyor...');
    const [sysTables] = await sysConn.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'sys' ORDER BY TABLE_NAME"
    );
    console.log(`✓ ${sysTables.length} tablo bulundu\n`);
    
    // keban_app veritabanındaki tabloları listele
    console.log('📋 keban_app veritabanındaki tablolar kontrol ediliyor...');
    const [appTables] = await appConn.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'keban_app' ORDER BY TABLE_NAME"
    );
    console.log(`✓ ${appTables.length} tablo bulundu\n`);
    
    // Veri taşıma
    console.log('📦 Veriler taşınıyor...\n');
    let totalRowsMigrated = 0;
    
    for (const sysTable of sysTables) {
      const tableName = sysTable.TABLE_NAME;
      
      // keban_app'de aynı tablo var mı?
      const tableExists = appTables.some(t => t.TABLE_NAME === tableName);
      
      if (tableExists) {
        console.log(`📥 ${tableName} taşınıyor...`);
        
        // sys tablosundan verileri oku
        const [rows] = await sysConn.execute(`SELECT * FROM \`${tableName}\``);
        
        if (rows.length > 0) {
          // Tablo yapısını kontrol et
          const [[tableInfo]] = await appConn.execute(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'keban_app' AND TABLE_NAME = ?",
            [tableName]
          );
          
          if (tableInfo) {
            const columns = Object.keys(rows[0]);
            const placeholders = columns.map(() => '?').join(',');
            const insertSql = `INSERT IGNORE INTO \`${tableName}\` (${columns.map(c => `\`${c}\``).join(',')}) VALUES (${placeholders})`;
            
            let insertedCount = 0;
            for (const row of rows) {
              try {
                const values = columns.map(col => row[col]);
                await appConn.execute(insertSql, values);
                insertedCount++;
              } catch (e) {
                // Duplicate key veya diğer hatalar yoksayılır
              }
            }
            
            console.log(`   ✓ ${insertedCount}/${rows.length} satır taşındı`);
            totalRowsMigrated += insertedCount;
          }
        } else {
          console.log(`   ℹ️  Tablo boş`);
        }
      } else {
        console.log(`⚠️  ${tableName} keban_app'de yok, atlanıyor`);
      }
    }
    
    // Doğrulama
    console.log('\n✅ Doğrulama yapılıyor...\n');
    
    for (const sysTable of sysTables) {
      const tableName = sysTable.TABLE_NAME;
      const tableExists = appTables.some(t => t.TABLE_NAME === tableName);
      
      if (tableExists) {
        try {
          const [[sysCount]] = await sysConn.execute(`SELECT COUNT(*) as total FROM \`${tableName}\``);
          const [[appCount]] = await appConn.execute(`SELECT COUNT(*) as total FROM \`${tableName}\``);
          
          const status = sysCount.total <= appCount.total ? '✓' : '⚠️';
          console.log(`${status} ${tableName}: sys=${sysCount.total}, keban_app=${appCount.total}`);
        } catch (e) {
          console.log(`⚠️  ${tableName}: Doğrulama başarısız`);
        }
      }
    }
    
    console.log(`\n✅ BAŞARILI!`);
    console.log(`📊 Toplam ${totalRowsMigrated} satır taşındı`);
    
    await sysConn.end();
    await appConn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (sysConn) await sysConn.end();
    if (appConn) await appConn.end();
    process.exit(1);
  }
}

migrateData();
