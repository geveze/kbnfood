import mysql from 'mysql2/promise';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const conn = await mysql.createConnection({
  host: 'gateway01.eu-central-1.tidb.cloud',
  user: 'root',
  password: 'keban_app_password',
  database: 'keban_app',
  ssl: {
    rejectUnauthorized: false,
  },
});

// Read Excel file
const workbook = XLSX.readFile('/home/ubuntu/upload/Sorulistesi.xlsx');
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log(`Total rows in Excel: ${data.length}`);

// Skip header row
const questions = data.slice(1);

// First, get all categories from field_inspection_categories
const [categories] = await conn.execute('SELECT id, name FROM field_inspection_categories');
console.log(`Found ${categories.length} categories in database`);

// Create a map of category names to IDs
const categoryMap = {};
categories.forEach(cat => {
  // Normalize category name (remove extra spaces, convert to uppercase)
  const normalizedName = cat.name.trim().toUpperCase();
  categoryMap[normalizedName] = cat.id;
});

console.log('Category mapping:', categoryMap);

// Clear existing questions (optional - comment out if you want to keep them)
// await conn.execute('DELETE FROM field_inspection_questions');

let insertedCount = 0;
let skippedCount = 0;

for (let i = 0; i < questions.length; i++) {
  const row = questions[i];
  const [categoryName, points, questionText, answer, formula, description, criticalPenalty] = row;

  if (!categoryName || !questionText) {
    console.log(`Skipping row ${i + 2}: missing category or question text`);
    skippedCount++;
    continue;
  }

  // Normalize category name
  const normalizedCategoryName = categoryName.trim().toUpperCase();
  const categoryId = categoryMap[normalizedCategoryName];

  if (!categoryId) {
    console.log(`Skipping row ${i + 2}: category not found "${categoryName}"`);
    skippedCount++;
    continue;
  }

  const cleanPoints = parseInt(points) || 0;
  const isCritical = criticalPenalty ? 1 : 0;
  const cleanQuestionText = questionText.trim();

  try {
    await conn.execute(
      `INSERT INTO field_inspection_questions 
       (categoryId, questionText, points, maxScore, isCritical, \`order\`, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [categoryId, cleanQuestionText, cleanPoints, 5, isCritical, i + 1]
    );
    insertedCount++;
    if (insertedCount % 10 === 0) {
      console.log(`Inserted ${insertedCount} questions...`);
    }
  } catch (err) {
    console.error(`Error inserting row ${i + 2}:`, err.message);
    skippedCount++;
  }
}

console.log(`\n=== FINAL RESULTS ===`);
console.log(`Total questions inserted: ${insertedCount}`);
console.log(`Total questions skipped: ${skippedCount}`);

// Verify insertion
const [result] = await conn.execute(`
  SELECT fc.name, COUNT(fiq.id) as question_count
  FROM field_inspection_categories fc
  LEFT JOIN field_inspection_questions fiq ON fc.id = fiq.categoryId
  GROUP BY fc.id, fc.name
  ORDER BY fc.id
`);

console.log('\n=== VERIFICATION ===');
console.log('Questions per category:');
result.forEach(row => {
  console.log(`  ${row.name}: ${row.question_count} questions`);
});

conn.end();
