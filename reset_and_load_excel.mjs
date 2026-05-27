import mysql from 'mysql2/promise';
import XLSX from 'xlsx';

async function resetAndLoadExcel() {
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
    
    // 1. Mevcut soruları sil
    console.log('🗑️  Mevcut soruları siliniyor...');
    await conn.execute('DELETE FROM field_inspection_questions');
    console.log('✓ Tüm sorular silindi\n');
    
    // 2. Mevcut kategorileri sil
    console.log('🗑️  Mevcut kategorileri siliniyor...');
    await conn.execute('DELETE FROM field_inspection_categories');
    console.log('✓ Tüm kategoriler silindi\n');
    
    // 3. Excel dosyasını oku
    console.log('📋 Excel dosyası okunuyor...');
    const workbook = XLSX.readFile('/home/ubuntu/upload/Sorulistesi.xlsx');
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log(`✓ ${data.length} soru bulundu\n`);
    
    // 4. Benzersiz kategorileri bul
    console.log('📂 Kategoriler ayıklanıyor...');
    const uniqueCategories = new Set();
    for (const row of data) {
      let categoryName = row['Kategori'] || row['Category'] || '';
      categoryName = categoryName.trim()
        .replace(/^\d+\.\s*/, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (categoryName) {
        uniqueCategories.add(categoryName);
      }
    }
    console.log(`✓ ${uniqueCategories.size} benzersiz kategori bulundu\n`);
    
    // 5. Kategorileri veritabanına ekle
    console.log('📥 Kategoriler yükleniyor...');
    const categoryMap = {};
    let categoryId = 1;
    for (const categoryName of uniqueCategories) {
      await conn.execute(
        'INSERT INTO field_inspection_categories (id, name, description) VALUES (?, ?, ?)',
        [categoryId, categoryName, `${categoryName} kategorisi`]
      );
      categoryMap[categoryName] = categoryId;
      categoryId++;
    }
    console.log(`✓ ${uniqueCategories.size} kategori eklendi\n`);
    
    // 6. Soruları veritabanına ekle
    console.log('📥 Sorular yükleniyor...\n');
    let insertedCount = 0;
    let errorCount = 0;
    
    for (const row of data) {
      try {
        let categoryName = row['Kategori'] || row['Category'] || '';
        categoryName = categoryName.trim()
          .replace(/^\d+\.\s*/, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        const categoryId = categoryMap[categoryName];
        if (!categoryId) continue;
        
        const questionText = row['Sorular'] || row['Question'] || '';
        const points = parseInt(row['Puan Skalası'] || row['Points']) || 1;
        const isCritical = (row['Kritik Kategorisi'] || row['Critical']) ? 1 : 0;
        const description = row['Açıklama'] || row['Description'] || '';
        const pointDeduction = parseInt(row['Kritik Soru Puan Düşümü'] || row['Point Deduction']) || 0;
        
        if (!questionText) continue;
        
        await conn.execute(
          'INSERT INTO field_inspection_questions (categoryId, questionText, points, isCritical, pointDeduction, description) VALUES (?, ?, ?, ?, ?, ?)',
          [categoryId, questionText, points, isCritical, pointDeduction, description]
        );
        insertedCount++;
      } catch (e) {
        errorCount++;
      }
    }
    
    console.log(`✅ Yükleme Tamamlandı!`);
    console.log(`📊 ${insertedCount} soru başarıyla yüklendi`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} soru hata nedeniyle atlandı`);
    }
    
    // 7. Doğrulama
    const [[{ totalQuestions }]] = await conn.execute(
      'SELECT COUNT(*) as totalQuestions FROM field_inspection_questions'
    );
    console.log(`\n📋 Toplam sorular: ${totalQuestions}`);
    
    const [[{ totalCategories }]] = await conn.execute(
      'SELECT COUNT(*) as totalCategories FROM field_inspection_categories'
    );
    console.log(`📂 Toplam kategoriler: ${totalCategories}`);
    
    // 8. Kategori başına soru sayısı
    console.log('\n📂 Kategori Başına Soru Sayısı:');
    const [categoryCounts] = await conn.execute(
      'SELECT c.name, COUNT(q.id) as count FROM field_inspection_categories c LEFT JOIN field_inspection_questions q ON c.id = q.categoryId GROUP BY c.id, c.name ORDER BY c.id'
    );
    for (const cat of categoryCounts) {
      console.log(`   ${cat.name}: ${cat.count} soru`);
    }
    
    // 9. Kritik sorular
    const [[{ criticalCount }]] = await conn.execute(
      'SELECT COUNT(*) as criticalCount FROM field_inspection_questions WHERE isCritical = 1'
    );
    console.log(`\n🔴 Kritik sorular: ${criticalCount}`);
    
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ HATA:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

resetAndLoadExcel();
