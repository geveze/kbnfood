import mysql from 'mysql2/promise';
import crypto from 'crypto';

const connection = await mysql.createConnection({
  host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '2UkMMcfEvYMQNtS.root',
  password: 'pRancyW9vAymmp8c',
  database: 'keban_app',
  ssl: { rejectUnauthorized: false }
});

try {
  // Hash password using bcrypt-like method (simple hash for now)
  const password = 'admin123';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512');
  const passwordHash = `${salt}$${hash.toString('hex')}`;
  
  // Insert admin user
  await connection.execute(
    `INSERT INTO users (username, passwordHash, name, email, role) VALUES (?, ?, ?, ?, ?)`,
    ['admin', passwordHash, 'Admin User', 'admin@keban.com', 'admin']
  );
  
  console.log('✓ Admin user created successfully');
  console.log('Username: admin');
  console.log('Password: admin123');
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  connection.end();
}
