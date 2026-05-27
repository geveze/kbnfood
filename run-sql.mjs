import mysql from 'mysql2/promise';

async function runSQL() {
  let connection;
  try {
    // DATABASE_URL'den bağlantı bilgisini çıkar
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL env değişkeni ayarlanmamış');
    }

    console.log('📝 Veritabanına bağlanılıyor...');
    connection = await mysql.createConnection(dbUrl);
    console.log('✅ Bağlantı başarılı');

    // isCritical alanını ekle
    try {
      console.log('📝 isCritical alanı ekleniyor...');
      await connection.execute(`
        ALTER TABLE field_inspection_questions 
        ADD COLUMN isCritical BOOLEAN DEFAULT FALSE AFTER maxScore
      `);
      console.log('✅ isCritical alanı eklendi');
    } catch (e) {
      if (e.message.includes('Duplicate column')) {
        console.log('✅ isCritical alanı zaten var');
      } else {
        throw e;
      }
    }

    // Kritik soruları güncelle
    console.log('📝 Kritik sorular güncelleniyor...');
    const [result] = await connection.execute(`
      UPDATE field_inspection_questions 
      SET isCritical = TRUE 
      WHERE id IN (1, 2, 3, 4, 5)
    `);
    console.log(`✅ ${result.affectedRows} satır güncellendi`);

    console.log('\n✅ Tüm işlemler tamamlandı!');
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runSQL();
