import mysql from 'mysql2/promise';

async function testInsert() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Test insert
    const [result] = await connection.execute(
      `INSERT INTO kpi_target_cards_detail 
      (period, branchName, branchManager, dimension, target, targetDescription, unit, source, frequency, weight, targetType, lowerLimit, targetValue, upperLimit, actualValue, score, weightedScore)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['2026/1', 'Ordu Novada', 'Test Manager', 'Finans', 'Test Target', 'Test Desc', 'Unit', 'Source', 'Freq', 10, 'Type', '100', '200', '300', '150', '80', '8']
    );
    
    console.log('Insert result:', result);
    
    // Check if inserted
    const [rows] = await connection.execute(
      `SELECT * FROM kpi_target_cards_detail WHERE branchName = 'Ordu Novada' AND target = 'Test Target'`
    );
    
    console.log('Inserted rows:', rows);
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await connection.end();
  }
}

testInsert();
