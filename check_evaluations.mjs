import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'keban_food'
});

const [rows] = await connection.execute('SELECT * FROM inspection_evaluations LIMIT 5');
console.log('Kaydedilen Genel Değerlendirmeler:');
console.log(JSON.stringify(rows, null, 2));
console.log(`Toplam: ${rows.length} kayıt`);

await connection.end();
