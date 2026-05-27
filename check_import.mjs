import mysql from 'mysql2/promise';

async function checkData() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    const [rows] = await connection.execute(
      `SELECT * FROM kpi_target_cards_detail WHERE branchName = 'Ordu Novada' LIMIT 5`
    );
    
    console.log('Ordu Novada verileri:');
    console.log(rows);
    
    const [[{ total }]] = await connection.execute(
      `SELECT COUNT(*) as total FROM kpi_target_cards_detail WHERE branchName = 'Ordu Novada'`
    );
    console.log(`\nToplam: ${total}`);
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await connection.end();
  }
}

checkData();
