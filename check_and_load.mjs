import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '2UkMMcfEvYMQNtS.root',
  password: 'pRancyW9vAymmp8c',
  database: 'sys',
  ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
};

async function checkAndLoad() {
  let connection;
  try {
    console.log('📡 TiDB Cloud\'a bağlanıyor...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Bağlantı başarılı!');
    
    // Mevcut tabloları kontrol et
    console.log('\n📋 Mevcut tablolar kontrol ediliyor...');
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()"
    );
    console.log(`Toplam ${tables.length} tablo bulundu:`);
    tables.forEach(t => console.log(`  - ${t.TABLE_NAME}`));
    
    // field_inspection_questions tablosunun var olup olmadığını kontrol et
    const hasQuestionTable = tables.some(t => t.TABLE_NAME === 'field_inspection_questions');
    const hasCategoryTable = tables.some(t => t.TABLE_NAME === 'field_inspection_categories');
    
    console.log(`\n📊 field_inspection_questions: ${hasQuestionTable ? '✓ VAR' : '✗ YOK'}`);
    console.log(`📂 field_inspection_categories: ${hasCategoryTable ? '✓ VAR' : '✗ YOK'}`);
    
    if (!hasQuestionTable || !hasCategoryTable) {
      console.log('\n⚠️  Tablolar mevcut değil. Tabloları oluşturmaya çalışıyorum...');
      
      // Kategoriler tablosunu oluştur
      try {
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS field_inspection_categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('✓ field_inspection_categories tablosu oluşturuldu');
      } catch (e) {
        console.log('⚠️  field_inspection_categories tablosu zaten var veya oluşturulamıyor');
      }
      
      // Sorular tablosunu oluştur
      try {
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS field_inspection_questions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            categoryId INT,
            questionText TEXT NOT NULL,
            points INT DEFAULT 1,
            isCritical BOOLEAN DEFAULT FALSE,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('✓ field_inspection_questions tablosu oluşturuldu');
      } catch (e) {
        console.log('⚠️  field_inspection_questions tablosu zaten var veya oluşturulamıyor');
      }
    }
    
    // Kategorileri ekle
    console.log('\n📝 Kategoriler ekleniyor...');
    const categories = [
      ['IZGARA / PİŞİRNE', 'Izgara ve pişirme alanı standartları'],
      ['KASA - PAKET / PAZARYERİ', 'Kasa ve paket alanı standartları'],
      ['RESTORAN TEMİZLİK VE DÜZEN', 'Restoran temizlik ve düzen standartları'],
      ['EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ', 'Ekipman bakımı ve gıda güvenliği'],
      ['RESTORAN HİZMET VE KALİTE STANDARTLARI', 'Restoran hizmet ve kalite standartları']
    ];
    
    for (const [name, desc] of categories) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO field_inspection_categories (name, description) VALUES (?, ?)',
          [name, desc]
        );
      } catch (e) {
        console.log(`⚠️  ${name} eklenemedi: ${e.message}`);
      }
    }
    console.log(`✓ Kategoriler eklendi`);
    
    // Soruları ekle
    console.log('\n📝 Sorular ekleniyor...');
    const questions = [
      { cat: 'IZGARA / PİŞİRNE', text: 'SOĞUTUCU DOLAPLARIN İÇ VE DIŞ TEMİZLİKLERİ YETERLİ Mİ ?', points: 2, critical: 0 },
      { cat: 'IZGARA / PİŞİRNE', text: 'IZGARDA KULLANILAN KÜÇÜK EKİPMAN TEMİZLİĞİ YETERLİ Mİ ?', points: 3, critical: 0 },
      { cat: 'KASA - PAKET / PAZARYERİ', text: 'KASA ALANINDA TEMİZLİK VE DÜZEN YETERLİ Mİ?', points: 3, critical: 0 },
      { cat: 'RESTORAN TEMİZLİK VE DÜZEN', text: 'RESTORAN ALANINDA GENEL TEMİZLİK YETERLİ Mİ?', points: 3, critical: 0 },
      { cat: 'EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ', text: 'GIDA GÜVENLİĞİ SERTIFIKASI MEVCUT MU?', points: 2, critical: 1 },
      { cat: 'RESTORAN HİZMET VE KALİTE STANDARTLARI', text: 'HİZMET KALİTESİ YETERLİ MU?', points: 3, critical: 0 }
    ];
    
    let addedCount = 0;
    for (const q of questions) {
      try {
        const [catResult] = await connection.execute(
          'SELECT id FROM field_inspection_categories WHERE name = ?',
          [q.cat]
        );
        
        if (catResult.length > 0) {
          await connection.execute(
            'INSERT IGNORE INTO field_inspection_questions (categoryId, questionText, points, isCritical) VALUES (?, ?, ?, ?)',
            [catResult[0].id, q.text, q.points, q.critical]
          );
          addedCount++;
        }
      } catch (e) {
        console.log(`⚠️  Soru eklenemedi: ${e.message}`);
      }
    }
    console.log(`✓ ${addedCount} soru eklendi`);
    
    // Doğrulama
    console.log('\n✅ Doğrulama yapılıyor...');
    try {
      const [[{ total: totalQuestions }]] = await connection.execute('SELECT COUNT(*) as total FROM field_inspection_questions');
      const [[{ total: totalCategories }]] = await connection.execute('SELECT COUNT(*) as total FROM field_inspection_categories');
      
      console.log(`\n✅ BAŞARILI!`);
      console.log(`📊 Toplam Sorular: ${totalQuestions}`);
      console.log(`📂 Toplam Kategoriler: ${totalCategories}`);
    } catch (e) {
      console.log(`⚠️  Doğrulama başarısız: ${e.message}`);
    }
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

checkAndLoad();
