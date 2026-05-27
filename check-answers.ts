import mysql from 'mysql2/promise';

async function check() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  const [answers] = await conn.execute('SELECT COUNT(*) as count FROM field_inspection_answers WHERE inspectionId = 1140001');
  console.log('Answers for inspection 1140001:', answers);
  await conn.end();
}

check().catch(console.error);
