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
    
    // Get total count
    const [total] = await conn.execute('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Total users: ${total[0].count}`);
    
    // Get sample users
    const [users] = await conn.execute(`
      SELECT id, username, name, email, role, isActive, branchId, branchName 
      FROM users 
      LIMIT 10
    `);
    
    console.log(`\n📋 Sample Users:`);
    for (const user of users) {
      console.log(`  ${user.username || '(no username)'} - ${user.name} (${user.role})`);
    }
    
    // Get role distribution
    const [roleStats] = await conn.execute(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY count DESC
    `);
    
    console.log(`\n📊 Role Distribution:`);
    for (const stat of roleStats) {
      console.log(`  ${stat.role}: ${stat.count}`);
    }
    
    // Check for users with passwords
    const [withPass] = await conn.execute(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE passwordHash IS NOT NULL AND passwordHash != ''
    `);
    
    console.log(`\n🔐 Users with passwords: ${withPass[0].count}`);
    
    // Check for users with branches
    const [withBranch] = await conn.execute(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE branchId IS NOT NULL
    `);
    
    console.log(`🏢 Users with branch assignments: ${withBranch[0].count}`);
    
    await conn.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
