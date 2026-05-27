import { drizzle } from "drizzle-orm/mysql2";
import { fieldInspectionQuestions } from "./drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function test() {
  try {
    const questions = await db.select().from(fieldInspectionQuestions);
    console.log(`Toplam soru sayısı: ${questions.length}`);
    if (questions.length > 0) {
      console.log("İlk 3 soru:");
      questions.slice(0, 3).forEach(q => {
        console.log(`- ID: ${q.id}, Kategori: ${q.categoryId}, Soru: ${q.questionText?.substring(0, 50)}`);
      });
    }
  } catch (error: any) {
    console.error("Hata:", error.message);
  }
}

test();
