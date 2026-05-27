import { drizzle } from "drizzle-orm/mysql2";
import { fieldInspectionCategories, fieldInspectionQuestions } from "./drizzle/schema";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function cleanup() {
  try {
    console.log("[INFO] Eski kategorileri ve soruları temizliyorum...");
    
    // Tüm soruları sil
    await db.delete(fieldInspectionQuestions);
    console.log("[INFO] Tüm sorular silindi");
    
    // Tüm kategorileri sil
    await db.delete(fieldInspectionCategories);
    console.log("[INFO] Tüm kategoriler silindi");
    
    console.log("[SUCCESS] Temizlik tamamlandı");
    process.exit(0);
  } catch (error) {
    console.error("[ERROR]", error);
    process.exit(1);
  }
}

cleanup();
