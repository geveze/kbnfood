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

console.log('Database: keban_app');
console.log('Host: gateway01.us-west-2.prod.tidb.cloud');

// Find Ordu Novada inspection
const [inspections] = await connection.execute(`
  SELECT 
    id, 
    branch_name, 
    inspection_date, 
    status
  FROM field_inspections 
  WHERE branch_name LIKE '%ORDU%' OR branch_code = 'OR'
  ORDER BY inspection_date DESC 
  LIMIT 5
`);

console.log('\nOrdu Novada inspections:');
inspections.forEach(insp => {
  console.log(`  ID: ${insp.id}, Date: ${insp.inspection_date}, Status: ${insp.status}`);
});

if (inspections.length > 0) {
  const latestInspectionId = inspections[0].id;
  console.log(`\nChecking answers for inspection ${latestInspectionId}:`);
  
  // Check answers with photos
  const [answers] = await connection.execute(`
    SELECT 
      id,
      question_id,
      answer,
      explanation,
      photo_urls,
      created_at
    FROM field_inspection_answers 
    WHERE inspection_id = ?
    ORDER BY created_at DESC
  `, [latestInspectionId]);
  
  console.log(`\nTotal answers: ${answers.length}`);
  answers.forEach((ans, idx) => {
    console.log(`\n  Answer ${idx + 1}:`);
    console.log(`    Question ID: ${ans.question_id}`);
    console.log(`    Answer: ${ans.answer}`);
    console.log(`    Explanation: ${ans.explanation || 'NULL'}`);
    console.log(`    Photo URLs: ${ans.photo_urls ? JSON.stringify(ans.photo_urls) : 'NULL'}`);
  });
}

await connection.end();
