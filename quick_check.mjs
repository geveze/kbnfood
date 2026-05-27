import mysql from 'mysql2/promise';

try {
  const connection = await mysql.createConnection({
    host: 'gateway01.us-west-2.prod.tidb.cloud',
    port: 4000,
    user: 'root',
    password: process.env.TIDB_PASSWORD,
    database: 'keban_app',
  });

  const [result] = await connection.execute('SELECT COUNT(*) as count FROM field_inspections');
  console.log('Total inspections:', result[0].count);

  const [result2] = await connection.execute('SELECT id FROM field_inspections ORDER BY id DESC LIMIT 5');
  console.log('Last 5 inspection IDs:', result2.map(r => r.id));

  await connection.end();
} catch (e) {
  console.error('Error:', e.message);
}
