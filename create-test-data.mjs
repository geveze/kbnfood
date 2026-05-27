import mysql from 'mysql2/promise';

async function createTestData() {
  let connection;
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL env değişkeni ayarlanmamış');
    }

    console.log('📝 Veritabanına bağlanılıyor...');
    connection = await mysql.createConnection(dbUrl);
    console.log('✅ Bağlantı başarılı');

    // Test denetim kaydı oluştur
    console.log('📝 Test denetim kaydı oluşturuluyor...');
    const [result] = await connection.execute(`
      INSERT INTO field_inspections (
        branchId, branchCode, branchName, 
        inspectionDate, inspectorName, inspectorEmail,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      1, 'IES', 'İSTANBUL ESENLER',
      new Date(), 'Abdullah Yönetici', 'abdullah@keban.com',
      'completed'
    ]);

    const inspectionId = result.insertId;
    console.log(`✅ Denetim kaydı oluşturuldu (ID: ${inspectionId})`);

    // Tüm soruları getir
    console.log('📝 Tüm sorular getiriliyor...');
    const [questions] = await connection.execute(`
      SELECT id, categoryId FROM field_inspection_questions ORDER BY id
    `);
    console.log(`✅ ${questions.length} soru bulundu`);

    // Her soru için cevap kaydı oluştur (tümü "Evet")
    console.log('📝 Cevap kayıtları oluşturuluyor...');
    let answersInserted = 0;
    
    for (const question of questions) {
      await connection.execute(`
        INSERT INTO field_inspection_answers (
          inspectionId, questionId, categoryId, 
          answer, earnedPoints, isCritical,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        inspectionId,
        question.id,
        question.categoryId,
        'yes',
        1, // Tüm sorular için 1 puan (test amaçlı)
        false
      ]);
      answersInserted++;
    }
    console.log(`✅ ${answersInserted} cevap kaydı oluşturuldu`);

    // Kategori puanlarını hesapla ve kaydet
    console.log('📝 Kategori puanları hesaplanıyor...');
    const [categories] = await connection.execute(`
      SELECT DISTINCT categoryId FROM field_inspection_questions
    `);

    for (const cat of categories) {
      const [categoryQuestions] = await connection.execute(`
        SELECT COUNT(*) as count FROM field_inspection_answers 
        WHERE inspectionId = ? AND categoryId = ? AND answer = 'yes'
      `, [inspectionId, cat.categoryId]);

      const earnedPoints = categoryQuestions[0].count;
      
      await connection.execute(`
        INSERT INTO field_inspection_category_scores (
          inspectionId, categoryId, earnedPoints, 
          createdAt, updatedAt
        ) VALUES (?, ?, ?, NOW(), NOW())
      `, [inspectionId, cat.categoryId, earnedPoints]);
    }
    console.log(`✅ Kategori puanları kaydedildi`);

    console.log('\n✅ Test verisi başarıyla oluşturuldu!');
    console.log(`📊 Denetim ID: ${inspectionId}`);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createTestData();
