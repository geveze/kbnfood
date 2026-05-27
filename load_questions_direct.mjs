import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'gateway04.us-east-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '46m8FVVm7HSsc1z.root',
  password: 'Ae0Ii72ep2Bkl3oN6VNj',
  database: '6XmnMHSGkmqmcvGw6sxZ3M',
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
  ssl: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  }
};

async function loadQuestions() {
  let connection;
  try {
    console.log('📡 TiDB Cloud\'a bağlanıyor...');
    console.log('Host:', dbConfig.host);
    console.log('User:', dbConfig.user);
    console.log('Database:', dbConfig.database);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Bağlantı başarılı!');
    
    // Test sorgusu
    const [testResult] = await connection.execute('SELECT 1 as test');
    console.log('✓ Test sorgusu başarılı:', testResult);
    
    console.log('\n📝 Kategoriler ekleniyor...');
    await connection.execute(
      'INSERT IGNORE INTO field_inspection_categories (name, description) VALUES (?, ?)',
      ['IZGARA / PİŞİRNE', 'Izgara ve pişirme alanı standartları']
    );
    await connection.execute(
      'INSERT IGNORE INTO field_inspection_categories (name, description) VALUES (?, ?)',
      ['KASA - PAKET / PAZARYERİ', 'Kasa ve paket alanı standartları']
    );
    await connection.execute(
      'INSERT IGNORE INTO field_inspection_categories (name, description) VALUES (?, ?)',
      ['RESTORAN TEMİZLİK VE DÜZEN', 'Restoran temizlik ve düzen standartları']
    );
    await connection.execute(
      'INSERT IGNORE INTO field_inspection_categories (name, description) VALUES (?, ?)',
      ['EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ', 'Ekipman bakımı ve gıda güvenliği']
    );
    await connection.execute(
      'INSERT IGNORE INTO field_inspection_categories (name, description) VALUES (?, ?)',
      ['RESTORAN HİZMET VE KALİTE STANDARTLARI', 'Restoran hizmet ve kalite standartları']
    );
    console.log('✓ Kategoriler eklendi');
    
    console.log('\n📝 Sorular ekleniyor...');
    const questions = [
      { cat: 'IZGARA / PİŞİRNE', text: 'SOĞUTUCU DOLAPLARIN İÇ VE DIŞ TEMİZLİKLERİ YETERLİ Mİ ?', points: 2, critical: 0 },
      { cat: 'IZGARA / PİŞİRNE', text: 'IZGARDA KULLANILAN KÜÇÜK EKİPMAN TEMİZLİĞİ YETERLİ Mİ ?', points: 3, critical: 0 },
      { cat: 'IZGARA / PİŞİRNE', text: 'ÇÖP KOVALARI PEDALLİ , TEMİZ VE AĞZI KAPALI', points: 2, critical: 0 },
      { cat: 'IZGARA / PİŞİRNE', text: 'ET ÜRÜNLERINDE STANDARTLARA UYGUN MÜHÜRLEME', points: 3, critical: 1 },
      { cat: 'KASA - PAKET / PAZARYERİ', text: 'KASA ALANINDA TEMİZLİK VE DÜZEN YETERLİ Mİ?', points: 3, critical: 0 },
      { cat: 'RESTORAN TEMİZLİK VE DÜZEN', text: 'RESTORAN ALANINDA GENEL TEMİZLİK YETERLİ Mİ?', points: 3, critical: 0 },
      { cat: 'EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ', text: 'GIDA GÜVENLİĞİ SERTIFIKASI MEVCUT MU?', points: 2, critical: 1 },
      { cat: 'RESTORAN HİZMET VE KALİTE STANDARTLARI', text: 'HİZMET KALİTESİ YETERLİ MU?', points: 3, critical: 0 }
    ];
    
    for (const q of questions) {
      const [catResult] = await connection.execute(
        'SELECT id FROM field_inspection_categories WHERE name = ?',
        [q.cat]
      );
      
      if (catResult.length > 0) {
        await connection.execute(
          'INSERT IGNORE INTO field_inspection_questions (category_id, question_text, points, is_critical) VALUES (?, ?, ?, ?)',
          [catResult[0].id, q.text, q.points, q.critical]
        );
      }
    }
    console.log('✓ Sorular eklendi');
    
    // Doğrulama
    const [[{ total: totalQuestions }]] = await connection.execute('SELECT COUNT(*) as total FROM field_inspection_questions');
    const [[{ total: totalCategories }]] = await connection.execute('SELECT COUNT(*) as total FROM field_inspection_categories');
    const [[{ total: criticalQuestions }]] = await connection.execute('SELECT COUNT(*) as total FROM field_inspection_questions WHERE is_critical = 1');
    
    console.log('\n✅ BAŞARILI!');
    console.log(`📊 Toplam Sorular: ${totalQuestions}`);
    console.log(`📂 Toplam Kategoriler: ${totalCategories}`);
    console.log(`🔴 Kritik Sorular: ${criticalQuestions}`);
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    console.error('Hata Detayları:', error);
    if (connection) await connection.end();
    process.exit(1);
  }
}

loadQuestions();
