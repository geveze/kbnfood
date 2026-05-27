import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'keban_food'
});

const [rows] = await connection.execute('SELECT COUNT(*) as count FROM inspector_general_evaluation');
console.log(`Inspector General Evaluation Tablosu Toplam Satır: ${rows[0].count}`);

if (rows[0].count > 0) {
  const [data] = await connection.execute('SELECT * FROM inspector_general_evaluation ORDER BY createdAt DESC LIMIT 1');
  console.log('\nSon Kayıt:');
  console.log(JSON.stringify(data[0], null, 2));
}

await connection.end();
