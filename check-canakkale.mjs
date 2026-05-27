import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'keban-app.c3oo6yqfxqzx.ap-southeast-1.tidb.cloud',
  user: 'root',
  password: 'keban@2024',
  database: 'keban_app',
  ssl: 'Amazon RDS',
});

const [inspections] = await connection.execute(`
  SELECT id, branchName, inspectionDate, totalScore, inspectorName
  FROM field_inspections
  WHERE branchName LIKE '%ÇANAKKALE%' OR branchName LIKE '%Canakkale%'
  ORDER BY inspectionDate DESC
  LIMIT 10
`);

console.log('Çanakkale Inspections:', inspections.length);
inspections.forEach(i => {
  console.log(`ID: ${i.id}, Branch: ${i.branchName}, Date: ${i.inspectionDate}, Score: ${i.totalScore}`);
});

const [recent] = await connection.execute(`
  SELECT id, branchName, inspectionDate, totalScore
  FROM field_inspections
  ORDER BY inspectionDate DESC
  LIMIT 5
`);

console.log('\nLatest 5 inspections:');
recent.forEach(i => {
  console.log(`ID: ${i.id}, Branch: ${i.branchName}, Date: ${i.inspectionDate}`);
});

await connection.end();
