import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'gateway01.us-west-2.prod.tidb.cloud',
  port: 4000,
  user: 'root',
  password: process.env.TIDB_PASSWORD,
  database: 'keban_app',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

// Check for today's inspections for Çanakkale 17 Burda AVM
const [inspections] = await connection.execute(`
  SELECT 
    id, 
    branch_name, 
    inspection_date, 
    status, 
    total_score,
    inspector_name
  FROM field_inspections 
  WHERE branch_name LIKE '%Çanakkale%' OR branch_name LIKE '%CANAKKALE%'
  ORDER BY inspection_date DESC 
  LIMIT 10
`);

console.log('Çanakkale inspections:');
inspections.forEach(insp => {
  console.log(`  ID: ${insp.id}, Date: ${insp.inspection_date}, Status: ${insp.status}, Score: ${insp.total_score}, Inspector: ${insp.inspector_name}`);
});

// Check for today's inspections (30 Nisan 2026)
const [todayInspections] = await connection.execute(`
  SELECT 
    id, 
    branch_name, 
    inspection_date, 
    status, 
    total_score
  FROM field_inspections 
  WHERE DATE(inspection_date) = '2026-04-30'
  ORDER BY inspection_date DESC 
  LIMIT 20
`);

console.log('\nToday\'s inspections (2026-04-30):');
todayInspections.forEach(insp => {
  console.log(`  ID: ${insp.id}, Branch: ${insp.branch_name}, Date: ${insp.inspection_date}, Status: ${insp.status}, Score: ${insp.total_score}`);
});

await connection.end();
