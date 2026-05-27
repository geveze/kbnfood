import mysql from 'mysql2/promise';

console.log('Connecting to database...');
const connection = await mysql.createConnection({
  host: 'gateway01.us-west-2.prod.tidb.cloud',
  port: 4000,
  user: 'root',
  password: process.env.TIDB_PASSWORD,
  database: 'keban_app',
});

console.log('Connected!');
const [result] = await connection.execute('SELECT 1 as test');
console.log('Test query result:', result);

await connection.end();
console.log('Done');
