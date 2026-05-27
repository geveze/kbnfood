import { drizzle } from "drizzle-orm/mysql2";
import { fieldInspectionCategories } from "./drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function test() {
  try {
    console.log("[INFO] Kategori eklemeyi test ediyorum...");
    
    const result = await db.insert(fieldInspectionCategories).values({
      name: "TEST KATEGORİ",
      description: "Test",
      order: 1,
    });

    console.log("[SUCCESS] Kategori eklendi:", result);
    process.exit(0);
  } catch (error: any) {
    console.error("[ERROR] Hata:", error.message);
    console.error("[ERROR] Stack:", error.stack);
    process.exit(1);
  }
}

test();
