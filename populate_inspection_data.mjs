import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  user: '2UkMMcfEvYMQNtS.root',
  password: 'pRancyW9vAymmp8c',
  database: 'keban_app',
  port: 4000,
  ssl: { rejectUnauthorized: false },
});

console.log('[Populate] Denetim verilerine örnek veriler ekleniyor...\n');

// Kritik Sorular ekle
console.log('[Insert] Kritik Sorular ekleniyor...');
const criticalQuestionsSQL = `
  INSERT INTO critical_questions (questionId, questionText, category, penaltyPoints, description, isActive)
  VALUES 
  (1, 'Hijyen standartları sağlanıyor mu?', 'Hijyen', 10, 'Mutfak hijyeni ve gıda güvenliği', true),
  (2, 'Güvenlik protokolleri uygulanıyor mu?', 'Güvenlik', 15, 'İş güvenliği ve müşteri güvenliği', true),
  (3, 'Personel eğitimi yapılıyor mu?', 'Eğitim', 8, 'Personel yetkinliği ve eğitim', true),
  (4, 'Kalite kontrol yapılıyor mu?', 'Kalite', 12, 'Ürün kalitesi ve hizmet kalitesi', true),
  (5, 'Müşteri memnuniyeti ölçülüyor mu?', 'Müşteri', 10, 'Müşteri geri bildirimi ve memnuniyet', true)
`;

try {
  await connection.execute(criticalQuestionsSQL);
  console.log('✓ 5 kritik soru eklendi');
} catch (error) {
  console.error(`Error: ${error.message.substring(0, 100)}`);
}

// Aksiyon Planları ekle
console.log('[Insert] Aksiyon Planları ekleniyor...');
const inspectionActionsSQL = `
  INSERT INTO inspection_actions (inspectionId, answerId, questionId, questionText, branchId, branchName, actionDescription, actionDeadline, assignedToName, priority, status)
  VALUES 
  (1, 1, 1, 'Hijyen standartları sağlanıyor mu?', 1, 'İSTANBUL ESENLER', 'Mutfak hijyen protokolü güncellenmeli', '2026-05-15', 'Şube Müdürü', 'Yüksek', 'Açık'),
  (2, 2, 2, 'Güvenlik protokolleri uygulanıyor mu?', 2, 'İSTANBUL ORTAKÖY', 'Güvenlik kamerası sistemi kontrol edilmeli', '2026-05-20', 'Operasyon Müdürü', 'Yüksek', 'Açık'),
  (3, 3, 3, 'Personel eğitimi yapılıyor mu?', 3, 'KOCAELİ GEBZE', 'Personel eğitim programı hazırlanmalı', '2026-05-25', 'İK Müdürü', 'Orta', 'Devam Ediyor'),
  (4, 4, 4, 'Kalite kontrol yapılıyor mu?', 4, 'İZMİR HATAY', 'Kalite kontrol prosedürü oluşturulmalı', '2026-05-30', 'Şube Müdürü', 'Orta', 'Açık'),
  (5, 5, 5, 'Müşteri memnuniyeti ölçülüyor mu?', 5, 'BURSA ÖZLÜCE', 'Müşteri anket sistemi kurulmalı', '2026-06-05', 'Operasyon Müdürü', 'Düşük', 'Açık')
`;

try {
  await connection.execute(inspectionActionsSQL);
  console.log('✓ 5 aksiyon planı eklendi');
} catch (error) {
  console.error(`Error: ${error.message.substring(0, 100)}`);
}

// Denetçi Değerlendirmeleri ekle
console.log('[Insert] Denetçi Değerlendirmeleri ekleniyor...');
const inspectorEvaluationsSQL = `
  INSERT INTO inspector_evaluations (inspectionId, branchId, branchName, inspectorId, inspectorName, evaluationScore, evaluationComments, evaluationDate)
  VALUES 
  (1, 1, 'İSTANBUL ESENLER', 1, 'ERDAL PORKLU', 85, 'Genel olarak iyi performans, hijyen alanında iyileştirme gerekli', '2026-04-20'),
  (2, 2, 'İSTANBUL ORTAKÖY', 2, 'SAVAŞ ÇATAKCİN', 78, 'Güvenlik protokollerinde eksiklikler tespit edildi', '2026-04-19'),
  (3, 3, 'KOCAELİ GEBZE', 3, 'HAKAN AKGÜN', 90, 'Mükemmel performans, personel eğitimi çok iyi', '2026-04-18'),
  (4, 4, 'İZMİR HATAY', 4, 'Abdullah', 82, 'Kalite kontrol sisteminin iyileştirilmesi gerekli', '2026-04-17'),
  (5, 5, 'BURSA ÖZLÜCE', 5, 'Bülent Aydoğan', 88, 'Müşteri memnuniyeti yüksek, tebrik edilir', '2026-04-16')
`;

try {
  await connection.execute(inspectorEvaluationsSQL);
  console.log('✓ 5 denetçi değerlendirmesi eklendi');
} catch (error) {
  console.error(`Error: ${error.message.substring(0, 100)}`);
}

// Doğrula
console.log('\n[Verify] Kontrol ediliyor...\n');

const tables = [
  { name: 'critical_questions', label: 'Kritik Sorular' },
  { name: 'inspection_actions', label: 'Aksiyon Planları' },
  { name: 'inspector_evaluations', label: 'Denetçi Değerlendirmeleri' },
];

for (const table of tables) {
  try {
    const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM \`${table.name}\``);
    console.log(`✓ ${table.label}: ${rows[0].count} satır`);
  } catch (error) {
    console.error(`✗ ${table.label}: ${error.message}`);
  }
}

await connection.end();
console.log('\n[Done] Tamamlandı');
