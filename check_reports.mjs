import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  user: '2UkMMcfEvYMQNtS.root',
  password: 'pRancyW9vAymmp8c',
  database: 'keban_app',
  port: 4000,
  ssl: { rejectUnauthorized: false },
});

console.log('[Check] Veritabanında tüm raporlar...\n');

// Tüm tabloları kontrol et
const tables = [
  'branches',
  'field_inspections',
  'open_pif_evaluations',
  'performance_evaluation_items',
  'position_categories',
  'position_questions',
  'user_sessions',
  'weekly_plans',
];

for (const table of tables) {
  try {
    const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM \`${table}\``);
    console.log(`✓ ${table}: ${rows[0].count} satır`);
  } catch (error) {
    console.error(`✗ ${table}: ${error.message}`);
  }
}

// Open PIF evaluations detaylı kontrol
console.log('\n[Detail] Open PIF Evaluations ilk 5 kayıt:');
try {
  const [rows] = await connection.execute(
    `SELECT id, branchId, employeeName, employeePosition, totalScore, createdAt FROM open_pif_evaluations LIMIT 5`
  );
  rows.forEach((row) => {
    console.log(`  - ID: ${row.id}, Branch: ${row.branchId}, Name: ${row.employeeName}, Score: ${row.totalScore}`);
  });
} catch (error) {
  console.error(`Error: ${error.message}`);
}

// Field inspections detaylı kontrol
console.log('\n[Detail] Field Inspections ilk 5 kayıt:');
try {
  const [rows] = await connection.execute(
    `SELECT id, branchId, branchName, inspectorName, totalScore, createdAt FROM field_inspections LIMIT 5`
  );
  rows.forEach((row) => {
    console.log(`  - ID: ${row.id}, Branch: ${row.branchName}, Inspector: ${row.inspectorName}, Score: ${row.totalScore}`);
  });
} catch (error) {
  console.error(`Error: ${error.message}`);
}

await connection.end();
console.log('\n[Done] Kontrol tamamlandı');
