import mysql from 'mysql2/promise';
import { execSync } from 'child_process';

// Python ile Excel dosyasını oku
const pythonCode = `
import openpyxl
import json

wb = openpyxl.load_workbook('/home/ubuntu/upload/RESTORAN_YONETİMİ.xlsx')
ws = wb.active

categories = {}
for idx, row in enumerate(ws.iter_rows(values_only=True), 1):
    if idx == 1:
        continue
    if row[0] and row[1] and row[2]:
        category = row[1].strip()
        question_text = row[2].strip()
        if category not in categories:
            categories[category] = []
        categories[category].append(question_text)

print(json.dumps(categories, ensure_ascii=False))
`;

const output = execSync(`python3 -c "${pythonCode.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
const categories = JSON.parse(output);

console.log('Categories loaded:', Object.keys(categories).length);

const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  ssl: 'Amazon RDS'
});

// RESTORAN_YONETIMI pozisyonunun ID'sini al
const [positions] = await connection.execute(
  "SELECT id FROM positions WHERE name = 'RESTORAN_YONETIMI'"
);

if (positions.length === 0) {
  console.log('RESTORAN_YONETIMI position not found');
  process.exit(1);
}

const positionId = positions[0].id;
console.log('Position ID:', positionId);

// Mevcut kategorileri ve soruları sil
const [existingCats] = await connection.execute(
  "SELECT id FROM position_categories WHERE position_id = ?",
  [positionId]
);

for (const cat of existingCats) {
  await connection.execute(
    "DELETE FROM position_questions WHERE category_id = ?",
    [cat.id]
  );
}

await connection.execute(
  "DELETE FROM position_categories WHERE position_id = ?",
  [positionId]
);

console.log('Deleted existing categories and questions');

// Yeni kategorileri ve soruları ekle
let totalQuestions = 0;
for (const [categoryName, questions] of Object.entries(categories)) {
  // Kategoriyi ekle
  const [catResult] = await connection.execute(
    "INSERT INTO position_categories (position_id, name) VALUES (?, ?)",
    [positionId, categoryName]
  );
  
  const categoryId = catResult.insertId;
  
  // Soruları ekle
  for (const questionText of questions) {
    await connection.execute(
      "INSERT INTO position_questions (category_id, question_text) VALUES (?, ?)",
      [categoryId, questionText]
    );
    totalQuestions++;
  }
  
  console.log(`Added category: ${categoryName} with ${questions.length} questions`);
}

console.log(`\nTotal questions added: ${totalQuestions}`);

await connection.end();
process.exit(0);
