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
    
    const [rows] = await conn.execute('DESCRIBE users');
    console.log('Users table structure:');
    rows.forEach(row => {
      console.log(`${row.Field}: ${row.Type} (${row.Null})`);
    });
    
    await conn.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
