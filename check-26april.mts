import { getDb } from './server/db';
import { fieldInspections } from './drizzle/schema';
import { gte, desc } from 'drizzle-orm';

const db = await getDb();
if (!db) {
  console.error('Database connection failed');
  process.exit(1);
}

try {
  // Get inspections from 26 April
  const april26 = new Date('2026-04-26T00:00:00Z');
  const april27 = new Date('2026-04-27T00:00:00Z');
  
  const inspections = await db
    .select()
    .from(fieldInspections)
    .where(gte(fieldInspections.inspectionDate, april26))
    .orderBy(desc(fieldInspections.inspectionDate));
  
  console.log(`\n✅ 26 Nisan tarihli denetimler: ${inspections.length}`);
  inspections.forEach(i => {
    const date = new Date(i.inspectionDate);
    console.log(`ID: ${i.id}, BranchID: ${i.branchId}, BranchName: ${i.branchName}, Tarih: ${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR')}, Puan: ${i.totalScore}%`);
  });
  
} catch (err) {
  console.error('Hata:', err);
}
