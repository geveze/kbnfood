import mysql from 'mysql2/promise';

const config = {
  host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '2UkMMcfEvYMQNtS.root',
  password: 'pRancyW9vAymmp8c',
  database: 'keban_app',
  ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
};

async function main() {
  const conn = await mysql.createConnection(config);
  
  // Get all positions
  const [positions] = await conn.execute('SELECT id, name, display_name FROM positions');
  console.log('=== POSITIONS ===');
  for (const p of positions) {
    console.log(`  ID: ${p.id}, Name: ${p.name}, Display: ${p.display_name}`);
  }

  // Get categories per position with question counts
  console.log('\n=== CATEGORIES AND QUESTIONS PER POSITION ===');
  for (const pos of positions) {
    const [cats] = await conn.execute(
      'SELECT id, name, `order` FROM position_categories WHERE positionId = ? ORDER BY `order`',
      [pos.id]
    );
    
    let totalQuestions = 0;
    console.log(`\n--- ${pos.display_name || pos.name} (ID: ${pos.id}) ---`);
    console.log(`  Categories: ${cats.length}`);
    
    for (const cat of cats) {
      const [questions] = await conn.execute(
        'SELECT COUNT(*) as cnt FROM position_questions WHERE categoryId = ?',
        [cat.id]
      );
      const qCount = questions[0].cnt;
      totalQuestions += qCount;
      console.log(`    ${cat.name} (ID: ${cat.id}, Order: ${cat.order}): ${qCount} questions`);
    }
    console.log(`  TOTAL QUESTIONS: ${totalQuestions}`);
  }

  // Also check CSV data
  console.log('\n=== CSV DATA ANALYSIS ===');
  const fs = await import('fs');
  
  // Read position_categories CSV
  const catCsv = fs.readFileSync('/home/ubuntu/upload/position_categories_20260427_124004.csv', 'utf-8');
  const catLines = catCsv.trim().split('\n');
  console.log(`\nCSV Categories: ${catLines.length - 1} rows`);
  console.log('Headers:', catLines[0]);
  
  // Count categories per position in CSV
  const catsByPos = {};
  for (let i = 1; i < catLines.length; i++) {
    const parts = catLines[i].split(',');
    const posId = parts[1];
    if (!catsByPos[posId]) catsByPos[posId] = 0;
    catsByPos[posId]++;
  }
  console.log('Categories per position (CSV):', catsByPos);
  
  // Read position_questions CSV
  const qCsv = fs.readFileSync('/home/ubuntu/upload/position_questions_20260427_123955.csv', 'utf-8');
  const qLines = qCsv.trim().split('\n');
  console.log(`\nCSV Questions: ${qLines.length - 1} rows`);
  console.log('Headers:', qLines[0]);
  
  // Count questions per category in CSV
  const qsByCat = {};
  for (let i = 1; i < qLines.length; i++) {
    // Parse CSV carefully
    const line = qLines[i];
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      if (line[j] === '"') {
        inQuotes = !inQuotes;
      } else if (line[j] === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += line[j];
      }
    }
    values.push(current.trim());
    
    const catId = values[1];
    if (!qsByCat[catId]) qsByCat[catId] = 0;
    qsByCat[catId]++;
  }
  console.log('Questions per category (CSV):', qsByCat);
  
  // Total questions per position from CSV
  console.log('\n=== TOTAL QUESTIONS PER POSITION (CSV) ===');
  for (let i = 1; i < catLines.length; i++) {
    const parts = catLines[i].split(',');
    // parts: id, positionId, name, weight
  }

  await conn.end();
  console.log('\nDone!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
