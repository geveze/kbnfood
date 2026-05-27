import { db } from "./server/_core/db.js";
import { fieldInspectionQuestions, fieldInspectionCategories } from "./drizzle/schema.js";

const categories = await db.select().from(fieldInspectionCategories);

for (const cat of categories) {
  const questions = await db.select().from(fieldInspectionQuestions).where((q) => q.categoryId === cat.id);
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
  console.log(`${cat.name}: ${questions.length} soru, Toplam Puan: ${totalPoints}`);
  
  // İlk 3 soruyu göster
  questions.slice(0, 3).forEach((q, idx) => {
    console.log(`  ${idx + 1}. "${q.questionText.substring(0, 40)}..." - ${q.points} puan`);
  });
}
