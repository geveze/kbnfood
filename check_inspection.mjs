import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'gateway01.us-west-2.prod.tidb.cloud',
  port: 4000,
  user: 'root',
  password: process.env.TIDB_PASSWORD,
  database: 'keban_app'
});

const [rows] = await connection.execute('SELECT id, branch_name, inspection_date FROM field_inspections WHERE id = 1860002');
console.log('Inspection found:', rows.length > 0);
if (rows.length > 0) {
  console.log('Data:', rows[0]);
}

// Also check answers
const [answers] = await connection.execute('SELECT COUNT(*) as count FROM field_inspection_answers WHERE inspection_id = 1860002');
console.log('Answers count:', answers[0].count);

await connection.end();
