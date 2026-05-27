import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadKPITargets() {
  let connection;
  try {
    // Veritabanı bağlantısı
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'keban_food',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log('✓ Veritabanı bağlantısı başarılı');

    // Excel dosyasını oku
    const workbook = XLSX.readFile('/home/ubuntu/upload/mart2026hedefleri.xlsx');
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✓ Excel dosyası okundu: ${data.length} satır`);

    // Tüm şubeleri getir
    const [branches] = await connection.query('SELECT id, name FROM branches');
    const branchMap = {};
    branches.forEach((branch) => {
      const normalizedName = branch.name.replace('BY ', '').trim();
      branchMap[normalizedName] = branch.id;
    });

    console.log(`✓ ${branches.length} şube bulundu`);

    // Mevcut hedefleri sil
    await connection.query('DELETE FROM kpi_targets WHERE id > 0');
    console.log('✓ Mevcut KPI hedefleri silindi');

    // Tüm hedefleri yükle
    let insertedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const branchName = row['Şube Adı']?.trim();

      if (!branchName || !branchMap[branchName]) {
        errorCount++;
        if (errorCount <= 5) {
          console.log(`  ⚠ Şube bulunamadı: ${branchName}`);
        }
        continue;
      }

      const branchId = branchMap[branchName];
      const dimension = row['Boyut']?.trim() || '';
      const target = row['Hedef']?.trim() || '';
      const description = row['Hedef Açıklaması'] || '';
      const unit = row['Birim']?.trim() || '';
      const frequency = row['Sıklık']?.trim() || 'Aylık';
      const weight = parseFloat(row['Ağırlık %']) || 0;
      const lowerLimit = parseFloat(row['Hedef Alt Limit (80 P)']) || 0;
      const targetValue = parseFloat(row['Hedef Değer (100 P)']) || 0;
      const upperLimit = parseFloat(row['Hedef Üst Limit (120 P)']) || 0;

      try {
        await connection.query(
          'INSERT INTO kpi_targets (branchId, dimension, target, description, unit, frequency, weight, lowerLimit, targetValue, upperLimit, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [branchId, dimension, target, description, unit, frequency, weight, lowerLimit, targetValue, upperLimit]
        );
        insertedCount++;

        if ((insertedCount + errorCount) % 100 === 0) {
          console.log(`  ✓ ${insertedCount} hedef yüklendi...`);
        }
      } catch (err) {
        errorCount++;
        if (errorCount <= 5) {
          console.log(`  ✗ Hata: ${err.message.substring(0, 100)}`);
        }
      }
    }

    console.log(`\n✓ Toplam ${insertedCount} hedef başarıyla yüklendi`);
    if (errorCount > 0) {
      console.log(`✗ ${errorCount} hedef yüklenemedi`);
    }

    // Kontrol et
    const [[{ total }]] = await connection.query('SELECT COUNT(*) as total FROM kpi_targets');
    console.log(`\n✓ Veritabanında toplam ${total} KPI hedef var`);

    await connection.end();
  } catch (err) {
    console.error('Hata:', err.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

loadKPITargets();
