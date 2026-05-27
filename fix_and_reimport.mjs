import mysql from 'mysql2/promise';
import csv from 'csv-parser';
import fs from 'fs';

const connection = await mysql.createConnection({
  host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  user: '2UkMMcfEvYMQNtS.root',
  password: 'pRancyW9vAymmp8c',
  database: 'keban_app',
  port: 4000,
  ssl: { rejectUnauthorized: false },
});

console.log('[Fix] Eksik alanlar ekleniyor...');

// field_inspections'a eksik alanları ekle
try {
  await connection.execute(`
    ALTER TABLE field_inspections 
    ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  `);
  console.log('✓ field_inspections: createdAt, updatedAt eklendi');
} catch (error) {
  console.error(`Error: ${error.message}`);
}

console.log('\n[Import] Field Inspections yükleniyor...');

// CSV'den field_inspections verilerini oku ve yükle
const fieldInspections = [];
fs.createReadStream('/home/ubuntu/upload/field_inspections_20260424_064508.csv')
  .pipe(csv())
  .on('data', (row) => {
    fieldInspections.push(row);
  })
  .on('end', async () => {
    console.log(`[Parse] ${fieldInspections.length} satır okundu`);

    let inserted = 0;
    let errors = 0;

    for (const row of fieldInspections) {
      try {
        const sql = `
          INSERT INTO field_inspections (
            id, branchId, branchCode, branchName, inspectorId, inspectorName, 
            inspectorEmail, restaurantManagerEmail, inspectionDate, totalScore, 
            status, pdfUrl, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
          parseInt(row.id) || null,
          parseInt(row.branchId) || null,
          row.branchCode || '',
          row.branchName || '',
          parseInt(row.inspectorId) || null,
          row.inspectorName || '',
          row.inspectorEmail || '',
          row.restaurantManagerEmail || '',
          row.inspectionDate || null,
          parseFloat(row.totalScore) || 0,
          row.status || 'draft',
          row.pdfUrl || '',
          row.createdAt || new Date().toISOString(),
          row.updatedAt || new Date().toISOString(),
        ];

        await connection.execute(sql, values);
        inserted++;

        if ((inserted) % 30 === 0) {
          console.log(`[Import] ${inserted}/${fieldInspections.length} satır eklendi...`);
        }
      } catch (error) {
        errors++;
        if (errors <= 3) {
          console.error(`Error row ${row.id}: ${error.message.substring(0, 80)}`);
        }
      }
    }

    console.log(`\n[Done] Inserted: ${inserted}, Errors: ${errors}`);

    // Doğrula
    const [result] = await connection.execute('SELECT COUNT(*) as count FROM field_inspections');
    console.log(`✓ field_inspections: ${result[0].count} satır`);

    await connection.end();
  });
