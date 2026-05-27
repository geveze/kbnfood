import { getDb } from "./server/db.ts";
import { fieldInspections } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

const db = await getDb();
if (!db) {
  console.error("Veritabanı bağlantısı kurulamadı");
  process.exit(1);
}

const inspection = await db
  .select()
  .from(fieldInspections)
  .where(eq(fieldInspections.id, 1))
  .limit(1);

console.log("Denetim Kaydı:");
console.log(JSON.stringify(inspection[0], null, 2));
process.exit(0);
