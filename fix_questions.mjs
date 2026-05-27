import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  user: '2UkMMcfEvYMQNtS.root',
  password: 'pRancyW9vAymmp8c',
  database: 'keban_app',
  port: 4000,
  ssl: { rejectUnauthorized: false },
});

console.log('[Fix] Soru puanları düzeltiliyor...\n');

// 1. Hatalı puanları düzelt (max score'u aşan puanları 5'e indir)
const fixPointsSQL = `
  UPDATE field_inspection_questions 
  SET points = LEAST(points, 5)
  WHERE points > 5
`;

try {
  const [result] = await connection.execute(fixPointsSQL);
  console.log(`✓ ${result.affectedRows} soru puanı düzeltildi`);
} catch (error) {
  console.error(`Error: ${error.message}`);
}

// 2. Tüm soruları kritik olmayan olarak işaretle
const resetCriticalSQL = `
  UPDATE field_inspection_questions 
  SET isCritical = false
`;

try {
  const [result] = await connection.execute(resetCriticalSQL);
  console.log(`✓ ${result.affectedRows} soru kritik olmayan olarak işaretlendi`);
} catch (error) {
  console.error(`Error: ${error.message}`);
}

// 3. Gerçekten kritik olan soruları işaretle (örneğin: Hijyen, Güvenlik, Kalite ile ilgili)
const markCriticalSQL = `
  UPDATE field_inspection_questions 
  SET isCritical = true
  WHERE questionText LIKE '%HİJYEN%' 
     OR questionText LIKE '%TEMİZ%'
     OR questionText LIKE '%GÜVENL%'
     OR questionText LIKE '%KALITE%'
     OR questionText LIKE '%STANDART%'
  LIMIT 15
`;

try {
  const [result] = await connection.execute(markCriticalSQL);
  console.log(`✓ ${result.affectedRows} gerçekten kritik soru işaretlendi`);
} catch (error) {
  console.error(`Error: ${error.message}`);
}

// 4. Kritik Soruları field_inspection_questions ID'leriyle güncelle
console.log('\n[Update] Kritik Sorular tablosu güncelleniyor...');

// İlk 5 kritik soruyu al
const [criticalQuestions] = await connection.execute(`
  SELECT id FROM field_inspection_questions 
  WHERE isCritical = true 
  LIMIT 5
`);

if (criticalQuestions.length > 0) {
  // Kritik soruları güncelle
  for (let i = 0; i < criticalQuestions.length; i++) {
    const questionId = criticalQuestions[i].id;
    const updateSQL = `
      UPDATE critical_questions 
      SET questionId = ? 
      WHERE id = ?
    `;
    
    try {
      await connection.execute(updateSQL, [questionId, i + 1]);
    } catch (error) {
      console.error(`Error updating critical question ${i + 1}: ${error.message}`);
    }
  }
  console.log(`✓ ${criticalQuestions.length} kritik soru güncellendi`);
}

// Doğrula
console.log('\n[Verify] Düzeltmeler doğrulanıyor...\n');

const [fixedQuestions] = await connection.execute(`
  SELECT id, questionText, points, isCritical 
  FROM field_inspection_questions 
  WHERE points > 5 OR (isCritical = true AND questionText NOT LIKE '%TEMİZ%')
  LIMIT 10
`);

if (fixedQuestions.length === 0) {
  console.log('✓ Tüm soru puanları doğru');
} else {
  console.log(`⚠️ Hala ${fixedQuestions.length} sorun var:`);
  fixedQuestions.forEach((q) => {
    console.log(`  - ID: ${q.id}, Puan: ${q.points}, Kritik: ${q.isCritical}`);
  });
}

// Kritik sorular özeti
const [criticalCount] = await connection.execute(`SELECT COUNT(*) as count FROM field_inspection_questions WHERE isCritical = true`);
console.log(`\n✓ Toplam Kritik Soru: ${criticalCount[0].count}`);

await connection.end();
console.log('\n[Done] Tamamlandı');
