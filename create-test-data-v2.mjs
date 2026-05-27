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

    // Denetçi kaydı oluştur (users tablosundan)
    console.log('📝 Denetçi kaydı kontrol ediliyor...');
    const [users] = await connection.execute(`
      SELECT id FROM users LIMIT 1
    `);
    
    let inspectorId = 1;
    if (users.length > 0) {
      inspectorId = users[0].id;
      console.log(`✅ Denetçi ID: ${inspectorId}`);
    }

    // Test denetim kaydı oluştur
    console.log('📝 Test denetim kaydı oluşturuluyor...');
    const [result] = await connection.execute(`
      INSERT INTO field_inspections (
        branchId, branchCode, branchName, 
        inspectorId, inspectorName, inspectorEmail,
        restaurantManagerEmail, inspectionDate,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      1, 'IES', 'İSTANBUL ESENLER',
      inspectorId, 'Abdullah Yönetici', 'abdullah@keban.com',
      'manager@keban.com', new Date(),
      'completed'
    ]);

    const inspectionId = result.insertId;
    console.log(`✅ Denetim kaydı oluşturuldu (ID: ${inspectionId})`);

    // Tüm soruları getir
    console.log('📝 Tüm sorular getiriliyor...');
    const [questions] = await connection.execute(`
      SELECT id, categoryId, points FROM field_inspection_questions ORDER BY id
    `);
    console.log(`✅ ${questions.length} soru bulundu`);

    // Her soru için cevap kaydı oluştur (tümü "Evet")
    console.log('📝 Cevap kayıtları oluşturuluyor...');
    let answersInserted = 0;
    
    for (const question of questions) {
      const earnedPoints = question.points || 1;
      await connection.execute(`
        INSERT INTO field_inspection_answers (
          inspectionId, questionId, answer, 
          earnedPoints, questionPoints, isCritical,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        inspectionId,
        question.id,
        'E',
        earnedPoints,
        earnedPoints,
        false
      ]);
      answersInserted++;
    }
    console.log(`✅ ${answersInserted} cevap kaydı oluşturuldu`);

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
