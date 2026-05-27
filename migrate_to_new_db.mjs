import mysql from 'mysql2/promise';

// Yeni veritabanı bağlantı bilgileri
const newDbConfig = {
  host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '2UkMMcfEvYMQNtS.root',
  password: 'pRancyW9vAymmp8c',
  database: 'sys',
  ssl: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  }
};

async function migrateToNewDatabase() {
  let connection;
  try {
    console.log('📡 Yeni TiDB Cloud veritabanına bağlanıyor...');
    console.log('Host:', newDbConfig.host);
    console.log('User:', newDbConfig.user);
    console.log('Database:', newDbConfig.database);
    
    connection = await mysql.createConnection(newDbConfig);
    console.log('✓ Bağlantı başarılı!');
    
    // Test sorgusu
    const [testResult] = await connection.execute('SELECT 1 as test');
    console.log('✓ Test sorgusu başarılı');
    
    // Kategoriler tablosunu oluştur
    console.log('\n📋 Tablolar oluşturuluyor...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS field_inspection_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        weight DECIMAL(5, 2) DEFAULT 0,
        \`order\` INT DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name)
      )
    `);
    console.log('✓ field_inspection_categories tablosu oluşturuldu');
    
    // Sorular tablosunu oluştur
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS field_inspection_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        categoryId INT NOT NULL,
        questionText TEXT NOT NULL,
        points INT DEFAULT 1,
        maxScore INT DEFAULT 5,
        isCritical BOOLEAN DEFAULT FALSE,
        pointDeduction INT DEFAULT 0,
        description TEXT,
        \`order\` INT DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (categoryId) REFERENCES field_inspection_categories(id),
        INDEX idx_categoryId (categoryId),
        INDEX idx_isCritical (isCritical)
      )
    `);
    console.log('✓ field_inspection_questions tablosu oluşturuldu');
    
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
      await connection.execute(
        'INSERT IGNORE INTO field_inspection_categories (name, description) VALUES (?, ?)',
        [name, desc]
      );
    }
    console.log(`✓ ${categories.length} kategori eklendi`);
    
    // Soruları ekle
    console.log('\n📝 Sorular ekleniyor...');
    const questions = [
      { cat: 'IZGARA / PİŞİRNE', text: 'SOĞUTUCU DOLAPLARIN İÇ VE DIŞ TEMİZLİKLERİ YETERLİ Mİ ?', points: 2, critical: 0 },
      { cat: 'IZGARA / PİŞİRNE', text: 'IZGARDA KULLANILAN KÜÇÜK EKİPMAN TEMİZLİĞİ YETERLİ Mİ ?', points: 3, critical: 0 },
      { cat: 'IZGARA / PİŞİRNE', text: 'ÇÖP KOVALARI PEDALLİ , TEMİZ VE AĞZI KAPALI', points: 2, critical: 0 },
      { cat: 'IZGARA / PİŞİRNE', text: 'ET ÜRÜNLERINDE STANDARTLARA UYGUN MÜHÜRLEME', points: 3, critical: 1 },
      { cat: 'IZGARA / PİŞİRNE', text: 'PLATE SICAKLIĞI ( 180 - 210 ) ARASINDA MI?', points: 3, critical: 1 },
      { cat: 'IZGARA / PİŞİRNE', text: 'EZME ( KARAMALIZE ) İŞLEMİ UYGUN BİR ŞEKİLDE YAPILIYOR MU?', points: 2, critical: 0 },
      { cat: 'IZGARA / PİŞİRNE', text: 'SMASH PİŞİRME İŞLEMİNDE ÇİĞ TARAFA TUZ, PİŞMİŞ TARAFA KARABIBER SERPİLİP YAĞ SÜZDÜRÜLÜYOR MÜ?', points: 5, critical: 0 },
      { cat: 'IZGARA / PİŞİRNE', text: 'SMASH PİŞİRME İŞLEMİ TEMİZ İZGARADA YAPILIYOR MU ?', points: 5, critical: 0 },
      { cat: 'IZGARA / PİŞİRNE', text: 'KARAMELIZE SOĞAN VE MANTAR REÇETEYE UYGUN HAZIRLANMIŞ MI?', points: 2, critical: 0 },
      { cat: 'IZGARA / PİŞİRNE', text: 'EKMEK AÇMA TEZGAHINDA TÜM ÜRÜNLER VE SOSLAR MEVCUT', points: 3, critical: 0 },
      { cat: 'IZGARA / PİŞİRNE', text: 'EKMEK SOSLAMA İÇİN UYGUN FİŞEKLER KULLANILIYOR MU?', points: 3, critical: 0 },
      { cat: 'IZGARA / PİŞİRNE', text: 'EKMEK SKT KULLANIMA UYGUN YERİ TEMAS EDEN EKMEK KASASI YOK', points: 3, critical: 0 },
      { cat: 'IZGARA / PİŞİRNE', text: 'EKMEKLER KESME APARATININ İÇERİSİNDE EŞİT BİR ŞEKİLDE KESİLİP, KARAMELIZE EDİLİYOR MU?', points: 3, critical: 0 },
      { cat: 'IZGARA / PİŞİRNE', text: 'EKMEK SOSLAMA VE GARNİTÜR KULLANIMI REÇETEYE UYGUN MU?', points: 3, critical: 0 },
      { cat: 'IZGARA / PİŞİRNE', text: 'TOASTER TEMİZLİĞİ YETERLİ, TEFLON KULLANIMA UYGUN', points: 3, critical: 0 },
      { cat: 'IZGARA / PİŞİRNE', text: 'FRİTÖZ YAĞ SEVİYESİ YETERLİ Mİ ( İKİ ÇİZGİ ARASI )', points: 2, critical: 1 },
      { cat: 'IZGARA / PİŞİRNE', text: 'BURGERLER SERVİS EDIRKEN BAYRAK KULLANILIYOR MU ?', points: 3, critical: 0 },
      { cat: 'IZGARA / PİŞİRNE', text: 'PATATES PİŞİRME SÜRELERİNE DİKKAT EDİLİYOR MU ? ( 4 DK )', points: 3, critical: 1 },
      { cat: 'IZGARA / PİŞİRNE', text: 'PATATES PİŞİRME İŞLEMİ SİPARİŞE GÖRE YAPILIYOR MU ?', points: 3, critical: 0 },
      { cat: 'IZGARA / PİŞİRNE', text: 'PATATES PIŞIRME SÜRELERİ KONTROL ALTINDA MI?', points: 2, critical: 0 },
      { cat: 'KASA - PAKET / PAZARYERİ', text: 'KASA ALANINDA TEMİZLİK VE DÜZEN YETERLİ Mİ?', points: 3, critical: 0 },
      { cat: 'KASA - PAKET / PAZARYERİ', text: 'PAKET MALZEMELERİ UYGUN ŞEKİLDE SAKLANMIŞ MI?', points: 2, critical: 0 },
      { cat: 'KASA - PAKET / PAZARYERİ', text: 'PAZARYERİ ÜRÜNLERI UYGUN KOŞULLARDA SAKLANMIŞ MI?', points: 3, critical: 0 },
      { cat: 'RESTORAN TEMİZLİK VE DÜZEN', text: 'RESTORAN ALANINDA GENEL TEMİZLİK YETERLİ Mİ?', points: 3, critical: 0 },
      { cat: 'RESTORAN TEMİZLİK VE DÜZEN', text: 'MASA VE SANDALYELER TEMİZ VE DÜZENLI Mİ?', points: 2, critical: 0 },
      { cat: 'RESTORAN TEMİZLİK VE DÜZEN', text: 'ZEMIN TEMİZ VE KAYGAN DEĞİL Mİ?', points: 3, critical: 0 },
      { cat: 'EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ', text: 'EKİPMANLAR DÜZENLI OLARAK BAKIM YAPILIYOR MU?', points: 3, critical: 0 },
      { cat: 'EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ', text: 'GIDA GÜVENLİĞİ SERTIFIKASI MEVCUT MU?', points: 2, critical: 1 },
      { cat: 'EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ', text: 'GEREKLI YASAL EVRAKLAR HAZIR MI?', points: 2, critical: 0 },
      { cat: 'RESTORAN HİZMET VE KALİTE STANDARTLARI', text: 'PERSONEL ÜNIFORMASI TEMİZ VE UYGUN MU?', points: 2, critical: 0 },
      { cat: 'RESTORAN HİZMET VE KALİTE STANDARTLARI', text: 'HİZMET KALİTESİ YETERLİ MU?', points: 3, critical: 0 },
      { cat: 'RESTORAN HİZMET VE KALİTE STANDARTLARI', text: 'MÜŞTERI MEMNUNİYETİ YETERLİ MU?', points: 3, critical: 0 }
    ];
    
    for (const q of questions) {
      const [catResult] = await connection.execute(
        'SELECT id FROM field_inspection_categories WHERE name = ?',
        [q.cat]
      );
      
      if (catResult.length > 0) {
        await connection.execute(
          'INSERT IGNORE INTO field_inspection_questions (categoryId, questionText, points, isCritical) VALUES (?, ?, ?, ?)',
          [catResult[0].id, q.text, q.points, q.critical]
        );
      }
    }
    console.log(`✓ ${questions.length} soru eklendi`);
    
    // Doğrulama
    console.log('\n✅ Doğrulama yapılıyor...');
    const [[{ total: totalQuestions }]] = await connection.execute('SELECT COUNT(*) as total FROM field_inspection_questions');
    const [[{ total: totalCategories }]] = await connection.execute('SELECT COUNT(*) as total FROM field_inspection_categories');
    const [[{ total: criticalQuestions }]] = await connection.execute('SELECT COUNT(*) as total FROM field_inspection_questions WHERE isCritical = 1');
    
    console.log(`\n✅ BAŞARILI!`);
    console.log(`📊 Toplam Sorular: ${totalQuestions}`);
    console.log(`📂 Toplam Kategoriler: ${totalCategories}`);
    console.log(`🔴 Kritik Sorular: ${criticalQuestions}`);
    console.log(`\n🔒 Veritabanı: ${newDbConfig.database}`);
    console.log(`🌐 Host: ${newDbConfig.host}`);
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

migrateToNewDatabase();
