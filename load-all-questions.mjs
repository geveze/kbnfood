import mysql from 'mysql2/promise';
import fs from 'fs';

const config = {
  host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '2UkMMcfEvYMQNtS.root',
  password: 'pRancyW9vAymmp8c',
  database: 'keban_app',
  ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
};

function parseCsvLine(line) {
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
  return values;
}

async function main() {
  const conn = await mysql.createConnection(config);
  console.log('Connected to keban_app database');

  // Step 1: Load categories from CSV
  console.log('\n=== LOADING CATEGORIES FROM CSV ===');
  const catCsv = fs.readFileSync('/home/ubuntu/upload/position_categories_20260427_124004.csv', 'utf-8');
  const catLines = catCsv.trim().split('\n');
  const catHeaders = catLines[0].split(',');
  console.log('CSV Category headers:', catHeaders);

  // Delete existing categories and re-insert from CSV
  // First check which category IDs exist in DB
  const [existingCats] = await conn.execute('SELECT id FROM position_categories');
  const existingCatIds = new Set(existingCats.map(c => c.id));
  console.log(`Existing categories in DB: ${existingCatIds.size}`);

  // Parse all CSV categories
  const csvCategories = [];
  for (let i = 1; i < catLines.length; i++) {
    const values = parseCsvLine(catLines[i]);
    // id, positionId, name, order, createdAt, updatedAt
    if (values.length >= 4) {
      csvCategories.push({
        id: parseInt(values[0]),
        positionId: parseInt(values[1]),
        name: values[2],
        order: parseInt(values[3]) || 0,
      });
    }
  }
  console.log(`CSV categories parsed: ${csvCategories.length}`);

  // Insert missing categories
  let catInserted = 0;
  for (const cat of csvCategories) {
    if (!existingCatIds.has(cat.id)) {
      try {
        await conn.execute(
          'INSERT INTO position_categories (id, positionId, name, `order`) VALUES (?, ?, ?, ?)',
          [cat.id, cat.positionId, cat.name, cat.order]
        );
        catInserted++;
      } catch (err) {
        console.log(`  Category ${cat.id} insert error: ${err.message}`);
      }
    }
  }
  console.log(`Categories inserted: ${catInserted}`);

  // Step 2: Load questions from CSV
  console.log('\n=== LOADING QUESTIONS FROM CSV ===');
  const qCsv = fs.readFileSync('/home/ubuntu/upload/position_questions_20260427_123955.csv', 'utf-8');
  const qLines = qCsv.trim().split('\n');
  const qHeaders = qLines[0].split(',');
  console.log('CSV Question headers:', qHeaders);

  // Check existing questions
  const [existingQs] = await conn.execute('SELECT id FROM position_questions');
  const existingQIds = new Set(existingQs.map(q => q.id));
  console.log(`Existing questions in DB: ${existingQIds.size}`);

  // Parse all CSV questions
  let qInserted = 0;
  let qSkipped = 0;
  let qErrors = 0;
  
  for (let i = 1; i < qLines.length; i++) {
    const values = parseCsvLine(qLines[i]);
    // id, categoryId, questionNumber, questionText, order, createdAt, updatedAt
    if (values.length >= 5) {
      const id = parseInt(values[0]);
      const categoryId = parseInt(values[1]);
      const questionNumber = parseInt(values[2]) || 0;
      const questionText = values[3];
      const order = parseInt(values[4]) || 0;

      if (!isNaN(id) && !isNaN(categoryId) && questionText) {
        if (existingQIds.has(id)) {
          qSkipped++;
          continue;
        }
        try {
          await conn.execute(
            'INSERT INTO position_questions (id, categoryId, questionNumber, questionText, `order`, points, isCritical) VALUES (?, ?, ?, ?, ?, 0, false)',
            [id, categoryId, questionNumber, questionText, order]
          );
          qInserted++;
        } catch (err) {
          console.log(`  Question ${id} insert error: ${err.message}`);
          qErrors++;
        }
      }
    }
  }
  console.log(`Questions inserted: ${qInserted}, skipped (existing): ${qSkipped}, errors: ${qErrors}`);

  // Step 3: Verify final counts
  console.log('\n=== FINAL VERIFICATION ===');
  const [positions] = await conn.execute('SELECT id, name, display_name FROM positions');
  
  for (const pos of positions) {
    const [cats] = await conn.execute(
      'SELECT id, name FROM position_categories WHERE positionId = ? ORDER BY `order`',
      [pos.id]
    );
    
    let totalQuestions = 0;
    for (const cat of cats) {
      const [qs] = await conn.execute(
        'SELECT COUNT(*) as cnt FROM position_questions WHERE categoryId = ?',
        [cat.id]
      );
      totalQuestions += qs[0].cnt;
    }
    
    console.log(`${pos.display_name || pos.name} (ID: ${pos.id}): ${cats.length} categories, ${totalQuestions} questions`);
  }

  await conn.end();
  console.log('\nDone!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
