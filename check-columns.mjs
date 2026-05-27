import mysql from 'mysql2/promise';
import { URL } from 'url';

async function checkColumns() {
  const dbUrl = new URL(process.env.DATABASE_URL);
  const connection = await mysql.createConnection({
    host: dbUrl.hostname,
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.slice(1),
    port: parseInt(dbUrl.port) || 3306,
    ssl: { rejectUnauthorized: true },
  });

  const [columns] = await connection.execute('DESCRIBE positions');
  console.log('Positions table columns:');
  columns.forEach(col => console.log(`  ${col.Field} (${col.Type})`));

  const [data] = await connection.execute('SELECT * FROM positions LIMIT 5');
  console.log('\nPositions data:');
  data.forEach(row => console.log(row));

  await connection.end();
}

checkColumns().catch(console.error);
