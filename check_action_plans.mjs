import mysql from 'mysql2/promise';

const config = {
  host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: 'keban_user@keban_cluster',
  password: 'Keban@123456',
  database: 'keban_app',
  ssl: true,
};

async function checkData() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    
    // Check inspection_actions table
    const [actions] = await connection.execute(
      'SELECT COUNT(*) as count FROM inspection_actions'
    );
    console.log('✓ Inspection Actions:', actions[0].count);
    
    // Show recent action plans
    const [recentActions] = await connection.execute(
      'SELECT id, inspectionId, actionDescription, status, approved FROM inspection_actions ORDER BY id DESC LIMIT 5'
    );
    console.log('\n📋 Recent Action Plans:');
    recentActions.forEach(row => {
      const approvedStatus = row.approved === 1 ? 'Evet' : (row.approved === 0 ? 'Hayır' : 'Belirsiz');
      console.log(`  ID: ${row.id}, Inspection: ${row.inspectionId}, Status: ${row.status}, Approved: ${approvedStatus}`);
      console.log(`    Action: ${row.actionDescription.substring(0, 50)}...`);
    });
    
    connection.end();
    console.log('\n✅ Kontrol tamamlandı');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkData();
