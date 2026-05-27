import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: 'keban_food_performance'
});

try {
  const conn = await pool.getConnection();
  const [tables] = await conn.query('SHOW TABLES');
  console.log('Tables in database:');
  tables.forEach(row => {
    const tableName = Object.values(row)[0];
    console.log(`  - ${tableName}`);
  });
  conn.release();
  pool.end();
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
