import mysql from 'mysql2/promise';
import XLSX from 'xlsx';

async function importData() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Excel dosyasını oku
    const workbook = XLSX.readFile('/home/ubuntu/upload/ordunovada.xlsx');
    const sheet = workbook.Sheets['Sayfa1'];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`Toplam satır: ${data.length}`);
    
    let insertedCount = 0;
    let errorCount = 0;
    
    // Her satırı veritabanına ekle
    for (const row of data) {
      try {
        const period = String(row['Değerlendirme Dönemi']).trim();
        const branchName = String(row['Şube Adı']).trim();
        const branchManager = String(row['Bölge Sorumlusu']).trim();
        const dimension = String(row['Boyut']).trim();
        const target = String(row['Hedef']).trim();
        const targetDescription = String(row['Hedef Açıklaması'] || '').trim();
        const unit = String(row['Birim'] || '').trim();
        const source = String(row['Kaynak'] || '').trim();
        const frequency = String(row['Sıklık'] || '').trim();
        const weight = row['Ağırlık %'] ? parseInt(row['Ağırlık %']) : 0;
        const targetType = String(row['Hedef Tipi'] || '').trim();
        const lowerLimit = String(row['Hedef Alt Limit (80 P)'] || '').trim();
        const targetValue = String(row['Hedef Değer (100 P)'] || '').trim();
        const upperLimit = String(row['Hedef Üst Limit (120 P)'] || '').trim();
        const actualValue = String(row['Gerçekleşen Değer '] || '').trim();
        const score = String(row['Puan'] || '').trim();
        const weightedScore = String(row['Hedef Puanı (Ağırlık*Puan)'] || '').trim();
        
        console.log(`Ekleniyor: ${branchName} - ${target}`);
        
        // Veritabanına ekle
        const [result] = await connection.execute(
          `INSERT INTO kpi_target_cards_detail 
          (period, branchName, branchManager, dimension, target, targetDescription, unit, source, frequency, weight, targetType, lowerLimit, targetValue, upperLimit, actualValue, score, weightedScore)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [period, branchName, branchManager, dimension, target, targetDescription, unit, source, frequency, weight, targetType, lowerLimit, targetValue, upperLimit, actualValue, score, weightedScore]
        );
        
        insertedCount++;
        console.log(`✓ ${target} (${dimension}) - ID: ${result.insertId}`);
      } catch (error) {
        errorCount++;
        console.log(`✗ Hata: ${error.message}`);
      }
    }
    
    console.log(`\n=== SONUÇ ===`);
    console.log(`Başarıyla eklenen: ${insertedCount}`);
    console.log(`Hata: ${errorCount}`);
    
    // Toplam kayıt sayısını kontrol et
    const [[{ total }]] = await connection.execute(
      `SELECT COUNT(*) as total FROM kpi_target_cards_detail WHERE branchName LIKE '%ORDU NOVADA%' AND period = '2026/1'`
    );
    console.log(`Ordu Novada 2026/1 döneminde toplam KPI: ${total}`);
    
    // Eklenen verileri göster
    const [rows] = await connection.execute(
      `SELECT id, branchName, target, dimension FROM kpi_target_cards_detail WHERE branchName LIKE '%ORDU NOVADA%' AND period = '2026/1' LIMIT 5`
    );
    console.log('\nEklenen veriler:');
    rows.forEach(row => {
      console.log(`- ${row.target} (${row.dimension})`);
    });
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await connection.end();
  }
}

importData();
