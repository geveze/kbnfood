import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  user: '2UkMMcfEvYMQNtS.root',
  password: 'pRancyW9vAymmp8c',
  database: 'keban_app',
  port: 4000,
  ssl: { rejectUnauthorized: false },
});

console.log('[Check] Field Inspection Soruları kontrol ediliyor...\n');

// Soruları oku
const [questions] = await connection.execute(`
  SELECT id, questionText, points, maxScore, isCritical 
  FROM field_inspection_questions 
  LIMIT 20
`);

console.log('ID | Soru | Puan | Max | Kritik');
console.log('---|------|------|-----|-------');

questions.forEach((q) => {
  console.log(`${q.id} | ${q.questionText.substring(0, 40)}... | ${q.points} | ${q.maxScore} | ${q.isCritical ? 'Evet' : 'Hayır'}`);
});

// Puan düşümü olan soruları kontrol et
console.log('\n[Check] Kritik Sorular (Puan Düşümü):\n');
const [criticalQuestions] = await connection.execute(`
  SELECT id, questionText, category, penaltyPoints 
  FROM critical_questions 
  LIMIT 10
`);

console.log('ID | Soru | Kategori | Puan Düşümü');
console.log('---|------|----------|----------');

criticalQuestions.forEach((q) => {
  console.log(`${q.id} | ${q.questionText.substring(0, 30)}... | ${q.category} | ${q.penaltyPoints}`);
});

// Toplam soru sayısı
const [totalQuestions] = await connection.execute(`SELECT COUNT(*) as count FROM field_inspection_questions`);
const [totalCritical] = await connection.execute(`SELECT COUNT(*) as count FROM critical_questions`);

console.log(`\n[Summary]`);
console.log(`Toplam Soru: ${totalQuestions[0].count}`);
console.log(`Toplam Kritik Soru: ${totalCritical[0].count}`);

await connection.end();
