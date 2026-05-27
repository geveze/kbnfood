import mysql from 'mysql2/promise';

async function checkDuplicates() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Çift KPI'ları tespit et
    const [duplicates] = await connection.execute(`
      SELECT 
        period, 
        branchName, 
        kpiName, 
        COUNT(*) as count,
        GROUP_CONCAT(id) as ids
      FROM kpi_target_cards_detail
      GROUP BY period, branchName, kpiName
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);
    
    console.log('Çift KPI Maddeler:');
    console.log(JSON.stringify(duplicates, null, 2));
    
    // Toplam çift sayısını bul
    let totalDuplicates = 0;
    duplicates.forEach((dup) => {
      totalDuplicates += dup.count - 1;
    });
    
    console.log(`\nToplam çift kayıt: ${totalDuplicates}`);
    console.log(`Çift olan grup sayısı: ${duplicates.length}`);
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await connection.end();
  }
}

checkDuplicates();
