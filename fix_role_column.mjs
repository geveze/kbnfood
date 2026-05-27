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
    
    console.log('🔧 Fixing role column...');
    
    // Increase role column size
    await conn.execute('ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT "user"');
    console.log('✅ role column size increased');
    
    // Delete existing users to reimport
    await conn.execute('DELETE FROM users');
    console.log('✅ Existing users cleared');
    
    await conn.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
