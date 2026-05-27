import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  user: '2UkMMcfEvYMQNtS.root',
  password: 'pRancyW9vAymmp8c',
  database: 'keban_app',
  port: 4000,
  ssl: { rejectUnauthorized: false },
});

console.log('[Create] Eksik tablolar oluşturuluyor...\n');

// inspection_evaluations tablosu
const createInspectorEvaluations = `
CREATE TABLE IF NOT EXISTS inspector_evaluations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inspectionId INT NOT NULL,
  branchId INT NOT NULL,
  branchName VARCHAR(255),
  inspectorId INT NOT NULL,
  inspectorName VARCHAR(255),
  evaluationScore INT,
  evaluationComments TEXT,
  evaluationDate TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
`;

try {
  await connection.execute(createInspectorEvaluations);
  console.log('✓ inspector_evaluations tablosu oluşturuldu');
} catch (error) {
  console.error(`✗ inspector_evaluations: ${error.message.substring(0, 100)}`);
}

// Tabloları kontrol et
console.log('\n[Verify] Tablolar kontrol ediliyor...\n');

const tables = [
  'field_inspections',
  'field_inspection_answers',
  'inspection_warnings',
  'inspection_actions',
  'critical_questions',
  'inspector_evaluations',
];

for (const table of tables) {
  try {
    const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM \`${table}\``);
    console.log(`✓ ${table}: ${rows[0].count} satır`);
  } catch (error) {
    console.error(`✗ ${table}: Tablo yok`);
  }
}

await connection.end();
console.log('\n[Done] Tamamlandı');
