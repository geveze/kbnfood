import mysql from 'mysql2/promise';

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '2UkMMcfEvYMQNtS.root',
      password: 'pRancyW9vAymmp8c',
      database: 'keban_app',
      ssl: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      }
    });
    
    const [rows] = await conn.execute('SELECT id, username, passwordHash, isActive FROM users WHERE username = ?', ['admin']);
    
    if (rows.length > 0) {
      const user = rows[0];
      console.log('✅ Admin user found:');
      console.log(`  ID: ${user.id}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Password Hash: ${user.passwordHash ? 'YES' : 'NO'}`);
      console.log(`  Is Active: ${user.isActive}`);
      console.log(`  Hash: ${user.passwordHash}`);
    } else {
      console.log('❌ Admin user not found');
    }
    
    await conn.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
