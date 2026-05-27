import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '2UkMMcfEvYMQNtS.root',
  password: 'pRancyW9vAymmp8c',
  database: 'keban_app',
  ssl: { rejectUnauthorized: false }
});

try {
  const [rows] = await connection.execute(`SELECT id, username, email, name, passwordHash FROM users WHERE username = 'admin'`);
  if (rows.length > 0) {
    console.log('✓ Admin user found:', rows[0]);
  } else {
    console.log('✗ Admin user NOT found');
    console.log('\nAll users:');
    const [allUsers] = await connection.execute(`SELECT id, username, email, name FROM users LIMIT 10`);
    console.log(allUsers);
  }
} catch (error) {
  console.error('Error:', error.message);
} finally {
  connection.end();
}
