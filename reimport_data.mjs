import mysql from 'mysql2/promise';
import fs from 'fs';

const connection = await mysql.createConnection({
  host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  user: '2UkMMcfEvYMQNtS.root',
  password: 'pRancyW9vAymmp8c',
  database: 'keban_app',
  port: 4000,
  ssl: { rejectUnauthorized: false },
});

console.log('[Clean] Tabloları temizleniyor...');

// Tabloları temizle
const tablesToClean = ['field_inspections', 'openPifEvaluations', 'weekly_plans'];
for (const table of tablesToClean) {
  try {
    await connection.execute(`TRUNCATE TABLE \`${table}\``);
    console.log(`✓ ${table} temizlendi`);
  } catch (error) {
    console.error(`✗ ${table}: ${error.message}`);
  }
}

console.log('\n[Import] Veriler yeniden yükleniyor...');
const sql = fs.readFileSync('/tmp/import_all_data.sql', 'utf-8');

// Sadece ilgili INSERT'leri çalıştır
const lines = sql.split('\n');
let executed = 0;
let errors = 0;

for (const line of lines) {
  if (line.includes('INSERT INTO') && 
      (line.includes('field_inspections') || line.includes('openPifEvaluations') || line.includes('weekly_plans'))) {
    try {
      await connection.execute(line);
      executed++;
    } catch (error) {
      errors++;
      if (errors <= 3) {
        console.error(`Error: ${error.message}`);
      }
    }
  }
}

console.log(`[Import] Executed: ${executed}, Errors: ${errors}`);

// Doğrula
console.log('\n[Verify] Kontrol ediliyor...');
for (const table of tablesToClean) {
  try {
    const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM \`${table}\``);
    console.log(`✓ ${table}: ${rows[0].count} satır`);
  } catch (error) {
    console.error(`✗ ${table}: ${error.message}`);
  }
}

await connection.end();
console.log('\n[Done] Tamamlandı');
