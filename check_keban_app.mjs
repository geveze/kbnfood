import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'gateway04.us-east-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: 'root',
  password: 'Keban2024!',
  database: 'keban_app',
  ssl: { rejectUnauthorized: false }
});

try {
  console.log('=== Checking keban_app.users table ===');
  
  // Get table structure
  const [columns] = await connection.execute(`DESCRIBE users`);
  console.log('\nTable columns:');
  columns.forEach(col => {
    console.log(`  ${col.Field}: ${col.Type}`);
  });
  
  // Get sample users
  const [users] = await connection.execute(`SELECT id, username, email, name, role FROM users LIMIT 5`);
  console.log('\nSample users:');
  console.log(users);
  
  console.log(`\nTotal users: ${users.length}`);
} catch (error) {
  console.error('Error:', error.message);
} finally {
  connection.end();
}
