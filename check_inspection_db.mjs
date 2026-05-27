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
    
    // Check field_inspections table
    const [inspections] = await connection.execute(
      'SELECT COUNT(*) as count FROM field_inspections'
    );
    console.log('✓ Field Inspections:', inspections[0].count);
    
    // Check field_inspection_answers table
    const [answers] = await connection.execute(
      'SELECT COUNT(*) as count FROM field_inspection_answers'
    );
    console.log('✓ Field Inspection Answers:', answers[0].count);
    
    // Show recent inspections
    const [recentInspections] = await connection.execute(
      'SELECT id, branchName, inspectionDate, totalScore FROM field_inspections ORDER BY id DESC LIMIT 5'
    );
    console.log('\n📋 Recent Inspections:');
    recentInspections.forEach(row => {
      console.log(`  ID: ${row.id}, Branch: ${row.branchName}, Date: ${row.inspectionDate}, Score: ${row.totalScore}`);
    });
    
    // Check if answers exist for recent inspections
    if (recentInspections.length > 0) {
      const inspectionId = recentInspections[0].id;
      const [answersForInspection] = await connection.execute(
        'SELECT COUNT(*) as count FROM field_inspection_answers WHERE inspectionId = ?',
        [inspectionId]
      );
      console.log(`\n✓ Answers for Inspection ${inspectionId}: ${answersForInspection[0].count}`);
    }
    
    connection.end();
    console.log('\n✅ Veritabanı kontrol tamamlandı');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkData();
