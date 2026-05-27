import { getDb } from './server/db.ts';
import { fieldInspectionCategories, fieldInspectionQuestions } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';
import fs from 'fs';

const db = await getDb();
if (!db) {
  console.log('DB connection failed');
  process.exit(1);
}

// JSON'dan soruları oku
const questionsJson = JSON.parse(fs.readFileSync('/tmp/inspection_questions.json', 'utf-8'));

// ⚠️ UYARI: Mevcut soruları silme kodu KALDIRILIYOR!
// Sorular asla silinmemeli - sadece yeni sorular eklenmeli
// await db.delete(fieldInspectionQuestions);
// await db.delete(fieldInspectionCategories);

console.log('Yeni kategoriler ve soruları ekle...');

let totalQuestions = 0;
let questionOrder = 1;

for (const [categoryName, questions] of Object.entries(questionsJson)) {
  // Kategoriyi kontrol et - varsa güncelle, yoksa ekle
  let categoryId = null;
  const existingCategory = await db.select().from(fieldInspectionCategories).where(eq(fieldInspectionCategories.name, categoryName));
  
  if (existingCategory.length > 0) {
    categoryId = existingCategory[0].id;
    console.log(`ℹ️ ${categoryName} kategorisi zaten var (ID: ${categoryId})`);
  } else {
    // Kategoriyi ekle
    const [catResult] = await db.insert(fieldInspectionCategories).values({
    name: categoryName,
    weight: 0,
    description: categoryName,
    order: Object.keys(questionsJson).indexOf(categoryName) + 1
  });

    categoryId = catResult.insertId;
    console.log(`✅ ${categoryName} kategorisi oluşturuldu (ID: ${categoryId})`);
  }
  
  // Soruları ekle - duplicate kontrol
  for (const q of questions) {
    // Aynı kategori ve soru metnine sahip soru var mı kontrol et
    const existingQuestion = await db.select().from(fieldInspectionQuestions).where(
      eq(fieldInspectionQuestions.categoryId, categoryId)
    );
    
    const isDuplicate = existingQuestion.some(eq => eq.questionText === q.soru);
    
    if (!isDuplicate) {
      await db.insert(fieldInspectionQuestions).values({
        categoryId,
        questionText: q.soru,
        maxScore: 5,
        isCritical: q.kritik,
        order: questionOrder
      });
      questionOrder++;
      totalQuestions++;
    }
  }
  
  console.log(`✅ ${categoryName}: ${questions.length} soru kontrol edildi`);
}

console.log(`\n✅ Toplam ${totalQuestions} soru yüklendi!`);
process.exit(0);
