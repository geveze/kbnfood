import { drizzle } from "drizzle-orm/mysql2";
import { fieldInspectionCategories, fieldInspectionQuestions } from "./drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function verify() {
  try {
    const categories = await db.select().from(fieldInspectionCategories);
    const questions = await db.select().from(fieldInspectionQuestions);
    
    console.log(`\n✅ Veritabanında ${categories.length} kategori var`);
    console.log(`✅ Veritabanında ${questions.length} soru var`);
    
    console.log("\nKategoriler:");
    for (const cat of categories) {
      const catQuestions = questions.filter(q => q.categoryId === cat.id);
      console.log(`  - ${cat.name}: ${catQuestions.length} soru`);
    }
    
    console.log("\nİlk 3 soru:");
    for (const q of questions.slice(0, 3)) {
      console.log(`  - "${q.questionText?.substring(0, 60)}..." (Puan: ${q.points}, Kritik: ${q.isCritical})`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("[ERROR]", error);
    process.exit(1);
  }
}

verify();
