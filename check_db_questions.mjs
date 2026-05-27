import { getDb } from "./server/db.ts";
import { fieldInspectionCategories, fieldInspectionQuestions } from "./drizzle/schema.ts";

const db = await getDb();

const categories = await db.select().from(fieldInspectionCategories).orderBy(fieldInspectionCategories.order);
const questions = await db.select().from(fieldInspectionQuestions).orderBy(fieldInspectionQuestions.order);

console.log("Kategoriler:");
for (const cat of categories) {
  const catQuestions = questions.filter(q => q.categoryId === cat.id);
  const totalPoints = catQuestions.reduce((sum, q) => sum + (q.points || 0), 0);
  console.log(`  ${cat.name}: ${catQuestions.length} soru, ${totalPoints} puan`);
}

console.log(`\nToplam: ${questions.length} soru`);
