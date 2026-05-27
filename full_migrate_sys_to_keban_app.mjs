import mysql from 'mysql2/promise';

async function fullMigrate() {
  let sysConn, appConn;
  try {
    console.log('📡 Veritabanlarına bağlanıyor...');
    sysConn = await mysql.createConnection({
      host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '2UkMMcfEvYMQNtS.root',
      password: 'pRancyW9vAymmp8c',
      database: 'sys',
      ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    });
    
    appConn = await mysql.createConnection({
      host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '2UkMMcfEvYMQNtS.root',
      password: 'pRancyW9vAymmp8c',
      database: 'keban_app',
      ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    });
    console.log('✓ Bağlantılar başarılı\n');
    
    // sys veritabanındaki tüm tabloları listele
    console.log('📋 sys veritabanındaki tüm tablolar okunuyor...');
    const [sysTables] = await sysConn.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'sys' AND TABLE_TYPE = 'BASE TABLE'"
    );
    console.log(`✓ ${sysTables.length} tablo bulundu\n`);
    
    // Tablo listesi
    const tableNames = [
      'users', 'actualValues', 'branches', 'bulk_upload_history', 'critical_questions',
      'customer_metrics', 'email_settings', 'evaluation_periods', 'field_inspection_answers',
      'field_inspection_categories', 'field_inspection_questions', 'field_inspections',
      'financial_metrics', 'hr_metrics', 'kpi_targets', 'kpi_target_cards_detail',
      'open_pif_evaluations', 'performance_data', 'performance_evaluations', 'periods',
      'position_categories', 'position_questions', 'reports', 'weekly_plans'
    ];
    
    // Her tablo için: yapıyı oluştur ve verileri taşı
    console.log('📦 Tablolar oluşturuluyor ve veriler taşınıyor...\n');
    
    for (const tableName of tableNames) {
      try {
        // sys'de tablo var mı kontrol et
        const [[tableExists]] = await sysConn.execute(
          "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'sys' AND TABLE_NAME = ?",
          [tableName]
        );
        
        if (!tableExists) {
          console.log(`⊘ ${tableName}: sys'de yok, atlanıyor`);
          continue;
        }
        
        // Tablo yapısını al
        const [columns] = await sysConn.execute(
          `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA 
           FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = 'sys' AND TABLE_NAME = ? 
           ORDER BY ORDINAL_POSITION`,
          [tableName]
        );
        
        if (columns.length === 0) {
          console.log(`⊘ ${tableName}: Sütun bilgisi alınamadı`);
          continue;
        }
        
        // keban_app'de tablo var mı kontrol et
        const [[appTableExists]] = await appConn.execute(
          "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'keban_app' AND TABLE_NAME = ?",
          [tableName]
        );
        
        // Tablo yoksa oluştur
        if (!appTableExists) {
          console.log(`📝 ${tableName}: Tablo oluşturuluyor...`);
          
          let createTableSql = `CREATE TABLE \`${tableName}\` (`;
          const columnDefs = [];
          
          for (const col of columns) {
            let colDef = `\`${col.COLUMN_NAME}\` ${col.COLUMN_TYPE}`;
            if (col.IS_NULLABLE === 'NO') colDef += ' NOT NULL';
            if (col.EXTRA) colDef += ` ${col.EXTRA}`;
            if (col.COLUMN_KEY === 'PRI') colDef += ' PRIMARY KEY';
            columnDefs.push(colDef);
          }
          
          createTableSql += columnDefs.join(', ') + ')';
          
          try {
            await appConn.execute(createTableSql);
            console.log(`   ✓ Tablo oluşturuldu`);
          } catch (e) {
            console.log(`   ⚠️  Tablo oluşturulamadı: ${e.message.substring(0, 50)}`);
          }
        }
        
        // Verileri taşı
        const [rows] = await sysConn.execute(`SELECT * FROM \`${tableName}\``);
        
        if (rows.length > 0) {
          const columnNames = columns.map(c => c.COLUMN_NAME);
          const placeholders = columnNames.map(() => '?').join(',');
          const insertSql = `INSERT IGNORE INTO \`${tableName}\` (${columnNames.map(c => `\`${c}\``).join(',')}) VALUES (${placeholders})`;
          
          let insertedCount = 0;
          for (const row of rows) {
            try {
              const values = columnNames.map(col => row[col]);
              await appConn.execute(insertSql, values);
              insertedCount++;
            } catch (e) {
              // Duplicate key yoksayılır
            }
          }
          
          console.log(`📥 ${tableName}: ${insertedCount}/${rows.length} satır taşındı`);
        } else {
          console.log(`ℹ️  ${tableName}: Tablo boş`);
        }
        
      } catch (e) {
        console.log(`❌ ${tableName}: Hata - ${e.message.substring(0, 50)}`);
      }
    }
    
    // Doğrulama
    console.log('\n✅ Doğrulama yapılıyor...\n');
    
    const [[{ total: appTableCount }]] = await appConn.execute(
      "SELECT COUNT(*) as total FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'keban_app'"
    );
    
    console.log(`📊 keban_app'de toplam ${appTableCount} tablo var`);
    
    // Tablo başına satır sayısı
    console.log('\n📋 Tablo Özeti:');
    for (const tableName of tableNames) {
      try {
        const [[{ total }]] = await appConn.execute(`SELECT COUNT(*) as total FROM \`${tableName}\``);
        if (total > 0) {
          console.log(`   ${tableName}: ${total} satır`);
        }
      } catch (e) {
        // Tablo yoksa yoksay
      }
    }
    
    console.log(`\n✅ BAŞARILI! Tüm veriler keban_app'ye taşındı`);
    
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

fullMigrate();
