import mysql from 'mysql2/promise';

async function removeDuplicates() {
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
    
    console.log(`Çift olan KPI grup sayısı: ${duplicates.length}`);
    
    let totalDeleted = 0;
    
    // Her çift grup için ilk kaydı tut, diğerlerini sil
    for (const dup of duplicates) {
      const ids = dup.ids.split(',').map(id => parseInt(id));
      const idsToDelete = ids.slice(1); // İlk hariç diğerlerini sil
      
      if (idsToDelete.length > 0) {
        const placeholders = idsToDelete.map(() => '?').join(',');
        const [result] = await connection.execute(
          `DELETE FROM kpi_target_cards_detail WHERE id IN (${placeholders})`,
          idsToDelete
        );
        totalDeleted += result.affectedRows;
        console.log(`${dup.branchName} - ${dup.kpiName} (${dup.period}): ${result.affectedRows} kayıt silindi`);
      }
    }
    
    console.log(`\nToplam silinen çift kayıt: ${totalDeleted}`);
    
    // Kalan toplam kayıt sayısını kontrol et
    const [[{ total }]] = await connection.execute(
      `SELECT COUNT(*) as total FROM kpi_target_cards_detail`
    );
    console.log(`Kalan toplam KPI kayıt: ${total}`);
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await connection.end();
  }
}

removeDuplicates();
