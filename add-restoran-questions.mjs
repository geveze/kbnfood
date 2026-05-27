import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const questions = JSON.parse(fs.readFileSync('/home/ubuntu/upload/restoran_yonetimi_clean.json', 'utf-8'));

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'keban_food',
});

const POSITION_ID = 6; // RESTORAN_YONETIMI

// Kategorileri al
const [categories] = await connection.execute(
  'SELECT id, name FROM position_categories WHERE positionId = ?',
  [POSITION_ID]
);

console.log(`Mevcut kategoriler: ${categories.length}`);

// Kategorileri organize et
const categoryMap = {};
for (const cat of categories) {
  categoryMap[cat.name] = cat.id;
}

console.log('Kategori haritası:', categoryMap);

// Soruları ekle
let addedCount = 0;
for (const q of questions) {
  const categoryId = categoryMap[q.subcategory];
  if (!categoryId) {
    console.warn(`Kategori bulunamadı: ${q.subcategory}`);
    continue;
  }

  try {
    await connection.execute(
      'INSERT INTO position_questions (categoryId, questionText) VALUES (?, ?)',
      [categoryId, q.question]
    );
    addedCount++;
  } catch (error) {
    console.error(`Soru eklenirken hata: ${q.question}`, error.message);
  }
}

console.log(`${addedCount} soru başarıyla eklendi`);
await connection.end();
