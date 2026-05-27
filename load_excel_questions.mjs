import mysql from 'mysql2/promise';
import XLSX from 'xlsx';
import fs from 'fs';

async function loadExcelQuestions() {
  let conn;
  try {
    console.log('📡 Veritabanına bağlanıyor...');
    conn = await mysql.createConnection({
      host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '2UkMMcfEvYMQNtS.root',
      password: 'pRancyW9vAymmp8c',
      database: 'keban_app',
      ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    });
    console.log('✓ Bağlantı başarılı!\n');
    
    // Excel dosyasını oku
    console.log('📋 Excel dosyası okunuyor...');
    const workbook = XLSX.readFile('/home/ubuntu/upload/Sorulistesi.xlsx');
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log(`✓ ${data.length} soru okundu\n`);
    
    // Kategorileri çıkar ve ekle
    const categories = new Set();
    data.forEach(row => {
      if (row.Kategori) {
        categories.add(row.Kategori.trim());
      }
    });
    
    console.log(`📝 Kategoriler ekleniyor (${categories.size} kategori)...`);
    for (const cat of categories) {
      await conn.execute(
        'INSERT IGNORE INTO field_inspection_categories (name, description) VALUES (?, ?)',
        [cat, cat]
      );
    }
    console.log(`✓ ${categories.size} kategori eklendi\n`);
    
    // Soruları ekle
    console.log(`📝 ${data.length} soru ekleniyor...`);
    let addedCount = 0;
    let errorCount = 0;
    
    for (const row of data) {
      try {
        const categoryName = row.Kategori ? row.Kategori.trim() : 'Diğer';
        const questionText = row.Sorular || '';
        const points = parseInt(row['Puan Skalası']) || 1;
        const isCritical = row['Kritik Kategorisi'] ? 1 : 0;
        const pointDeduction = row['Kritik Soru Puan Düşümü'] ? parseInt(row['Kritik Soru Puan Düşümü']) : 0;
        const description = row.Açıklama || '';
        
        if (!questionText) continue;
        
        // Kategori ID'sini bul
        const [[catResult]] = await conn.execute(
          'SELECT id FROM field_inspection_categories WHERE name = ?',
          [categoryName]
        );
        
        if (catResult) {
          await conn.execute(
            'INSERT INTO field_inspection_questions (categoryId, questionText, points, isCritical, pointDeduction, description) VALUES (?, ?, ?, ?, ?, ?)',
            [catResult.id, questionText, points, isCritical, pointDeduction, description]
          );
          addedCount++;
        }
      } catch (e) {
        errorCount++;
        console.log(`   ⚠️  Soru eklenemedi: ${e.message.substring(0, 50)}`);
      }
    }
    
    console.log(`✓ ${addedCount} soru eklendi`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} soru hata ile atlandı`);
    }
    
    // Doğrulama
    console.log('\n✅ Doğrulama yapılıyor...');
    const [[{ total: totalQuestions }]] = await conn.execute('SELECT COUNT(*) as total FROM field_inspection_questions');
    const [[{ total: totalCategories }]] = await conn.execute('SELECT COUNT(*) as total FROM field_inspection_categories');
    const [[{ total: criticalQuestions }]] = await conn.execute('SELECT COUNT(*) as total FROM field_inspection_questions WHERE isCritical = 1');
    
    console.log(`\n✅ BAŞARILI!`);
    console.log(`📊 Toplam Sorular: ${totalQuestions}`);
    console.log(`📂 Toplam Kategoriler: ${totalCategories}`);
    console.log(`🔴 Kritik Sorular: ${criticalQuestions}`);
    
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

loadExcelQuestions();
