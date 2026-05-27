import XLSX from 'xlsx';
import { drizzle } from 'drizzle-orm/mysql2';
import { kpiTargetCardsDetail } from './drizzle/schema.js';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function importExcelData() {
  try {
    // Excel dosyasını oku
    const workbook = XLSX.readFile('/home/ubuntu/upload/Mart2026ŞubeHedefKartı-PerformansPaylaşım.xlsx');
    const worksheet = workbook.Sheets['Hedef Kartları Detay'];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Excel dosyasından ${data.length} satır okundu`);

    // Veritabanı bağlantısı
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    const db = drizzle(connection);

    // Verileri normalize et
    const normalizedData = data.map((row) => ({
      period: row['Dönem'] || '',
      branchName: row['Şube Adı'] || '',
      branchManager: row['Bölge Sorumlusu'] || '',
      dimension: row['Boyut'] || '',
      target: row['Hedef'] || '',
      targetDescription: row['Hedef Açıklaması'] || '',
      unit: row['Birim'] || '',
      source: row['Kaynak'] || '',
      frequency: row['Sıklık'] || '',
      weight: parseInt(row['Ağırlık %'] || '0') || 0,
      targetType: row['Hedef Tipi'] || '',
      lowerLimit: String(row['Hedef Alt Limit (80 P)'] || ''),
      targetValue: String(row['Hedef Değer (100 P)'] || ''),
      upperLimit: String(row['Hedef Üst Limit (120 P)'] || ''),
      actualValue: String(row['Gerçekleşen Değer '] || row['Gerçekleşen Değer'] || ''),
      score: String(row['Puan'] || ''),
      weightedScore: String(row['Hedef Puanı (Ağırlık*Puan)'] || ''),
    }));

    // Geçerli verileri filtrele
    const validData = normalizedData.filter((row) => {
      return row.period && row.branchName && row.branchManager && row.dimension && row.target;
    });

    console.log(`${validData.length} geçerli satır bulundu`);

    // Veritabanına ekle
    await db.insert(kpiTargetCardsDetail).values(validData);

    console.log('✓ Veriler başarıyla veritabanına yüklendi');
    await connection.end();
  } catch (error) {
    console.error('Hata:', error.message);
    process.exit(1);
  }
}

importExcelData();
