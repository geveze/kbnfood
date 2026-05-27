import { getDb } from "./server/db.js";
import { fieldInspectionCategories } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";

const db = await getDb();

// Excel'deki kategorilerin etki oranları
const categoryWeights = {
  "IZGARA  / PİŞİRNE": 46.1,
  "KASA -  PAKET / PAZARYERİ": 46.1,
  "RESTORAN TEMİZLİK VE DÜZEN": 7.8,
};

console.log("Kategorileri güncelleniyor...");

for (const [categoryName, weight] of Object.entries(categoryWeights)) {
  await db
    .update(fieldInspectionCategories)
    .set({ weight: weight })
    .where(eq(fieldInspectionCategories.name, categoryName));
  
  console.log(`✓ ${categoryName}: ${weight}%`);
}

console.log("Tamamlandı!");
