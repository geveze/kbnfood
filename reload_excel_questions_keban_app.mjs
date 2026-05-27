import mysql from 'mysql2/promise';
import XLSX from 'xlsx';

async function loadExcelQuestions() {
  let conn;
  try {
    console.log('📡 keban_app veritabanına bağlanıyor...');
    conn = await mysql.createConnection({
      host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '2UkMMcfEvYMQNtS.root',
      password: 'pRancyW9vAymmp8c',
      database: 'keban_app',
      ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    });
    console.log('✓ Bağlantı başarılı\n');
    
    // Excel dosyasını oku
    console.log('📋 Excel dosyası okunuyor...');
    const workbook = XLSX.readFile('/home/ubuntu/upload/Sorulistesi.xlsx');
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log(`✓ ${data.length} soru bulundu\n`);
    
    // Kategorileri al
    console.log('📂 Kategoriler kontrol ediliyor...');
    const [categories] = await conn.execute(
      'SELECT id, name FROM field_inspection_categories'
    );
    const categoryMap = {};
    for (const cat of categories) {
      categoryMap[cat.name] = cat.id;
    }
    console.log(`✓ ${categories.length} kategori bulundu\n`);
    
    // Soruları yükle
    console.log('📥 Sorular yükleniyor...\n');
    let insertedCount = 0;
    let errorCount = 0;
    
    for (const row of data) {
      try {
        const categoryName = row['Kategori'] || row['Category'];
        const categoryId = categoryMap[categoryName];
        
        if (!categoryId) {
          console.log(`⚠️  Kategori bulunamadı: ${categoryName}`);
          continue;
        }
        
        const questionText = row['Sorular'] || row['Question'];
        const points = parseInt(row['Puan Skalası'] || row['Points']) || 1;
        const isCritical = (row['Kritik Kategorisi'] || row['Critical']) ? 1 : 0;
        const description = row['Açıklama'] || row['Description'] || '';
        
        await conn.execute(
          'INSERT INTO field_inspection_questions (category_id, question_text, points, is_critical, description) VALUES (?, ?, ?, ?, ?)',
          [categoryId, questionText, points, isCritical, description]
        );
        insertedCount++;
      } catch (e) {
        errorCount++;
        if (errorCount <= 3) {
          console.log(`❌ Hata: ${e.message.substring(0, 50)}`);
        }
      }
    }
    
    console.log(`\n✅ Yükleme Tamamlandı!`);
    console.log(`📊 ${insertedCount} soru başarıyla yüklendi`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} soru hata nedeniyle atlandı`);
    }
    
    // Doğrulama
    const [[{ totalQuestions }]] = await conn.execute(
      'SELECT COUNT(*) as totalQuestions FROM field_inspection_questions'
    );
    console.log(`\n📋 Toplam sorular: ${totalQuestions}`);
    
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ HATA:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

loadExcelQuestions();
