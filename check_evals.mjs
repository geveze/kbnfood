import { getDb } from "./server/db.ts";
import { inspectionEvaluations } from "./drizzle/schema.ts";

const db = await getDb();
if (!db) {
  console.log("Veritabanı bağlantısı başarısız");
  process.exit(1);
}

const evals = await db.select().from(inspectionEvaluations);
console.log(`Toplam evaluation kaydı: ${evals.length}`);
if (evals.length > 0) {
  console.log("İlk 3 kayıt:");
  console.log(JSON.stringify(evals.slice(0, 3), null, 2));
} else {
  console.log("Hiç evaluation kaydı yok!");
}
