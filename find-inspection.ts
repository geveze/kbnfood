import mysql from 'mysql2/promise';

async function find() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  const [result] = await conn.execute(`
    SELECT inspectionId, COUNT(*) as answerCount 
    FROM field_inspection_answers 
    GROUP BY inspectionId 
    HAVING answerCount > 0 
    LIMIT 5
  `);
  console.log('Inspections with answers:', result);
  await conn.end();
}

find().catch(console.error);
