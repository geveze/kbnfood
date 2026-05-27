import mysql from 'mysql2/promise';

async function migrateAllData() {
  let oldConn, newConn;
  try {
    // Eski veritabanina baglan
    oldConn = await mysql.createConnection({
      host: 'gateway04.us-east-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '46m8FvVm7HSsc1z.root',
      password: 'Ae0Ii72ep2Bkl3oN6VNj',
      database: '6XmnMHSGkmqmcvGw6sxZ3M',
      ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    });
    
    // Yeni veritabanina baglan
    newConn = await mysql.createConnection({
      host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '2UkMMcfEvYMQNtS.root',
      password: 'pRancyW9vAymmp8c',
      database: 'keban_app',
      ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    });
    
    console.log('📊 Eski veritabanindaki tablolar sorgulaniyoruz...\n');
    
    // Tüm tabloları listele
    const [tables] = await oldConn.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '6XmnMHSGkmqmcvGw6sxZ3M' AND TABLE_TYPE = 'BASE TABLE'"
    );
    
    console.log('Bulunan tablolar:');
    for (const table of tables) {
      console.log(`  - ${table.TABLE_NAME}`);
    }
    console.log();
    
    // Her tablo icin veri migre et
    let totalRows = 0;
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      
      try {
        // Eski veritabanından veri oku
        const [rows] = await oldConn.execute(`SELECT * FROM \`${tableName}\``);
        
        if (rows.length === 0) {
          console.log(`  ⚪ ${tableName}: 0 satir (bos)`);
          continue;
        }
        
        // Yeni veritabanına veri yaz (IGNORE kullanarak duplikatları atla)
        const columns = Object.keys(rows[0]);
        const placeholders = columns.map(() => '?').join(',');
        const columnNames = columns.map(c => `\`${c}\``).join(',');
        
        let insertedCount = 0;
        for (const row of rows) {
          const values = columns.map(c => row[c]);
          try {
            await newConn.execute(
              `INSERT IGNORE INTO \`${tableName}\` (${columnNames}) VALUES (${placeholders})`,
              values
            );
            insertedCount++;
          } catch (err) {
            // Duplikat veya constraint hatası - atla
          }
        }
        
        console.log(`  ✓ ${tableName}: ${insertedCount}/${rows.length} satir migre edildi`);
        totalRows += insertedCount;
      } catch (error) {
        console.log(`  ❌ ${tableName}: Hata - ${error.message}`);
      }
    }
    
    console.log(`\n✓ Toplam ${totalRows} satir migre edildi\n`);
    
    // Yeni veritabanındaki tablo sayılarını doğrula
    console.log('Yeni veritabanı durumu:\n');
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      try {
        const [result] = await newConn.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
        console.log(`  ${tableName}: ${result[0].count} satir`);
      } catch (err) {
        console.log(`  ${tableName}: Sorgu hatasi`);
      }
    }
    
    await oldConn.end();
    await newConn.end();
    process.exit(0);
  } catch (error) {
    console.error('HATA:', error.message);
    if (oldConn) await oldConn.end();
    if (newConn) await newConn.end();
    process.exit(1);
  }
}

migrateAllData();
