import { getDb } from './server/db';
import { fieldInspections } from './drizzle/schema';
import { desc } from 'drizzle-orm';

const db = await getDb();

if (!db) {
  console.error('Database connection failed');
  process.exit(1);
}

try {
  const allInspections = await db.select().from(fieldInspections).orderBy(desc(fieldInspections.inspectionDate)).limit(5);
  
  console.log(`\n✅ Son 5 denetim:`);
  allInspections.forEach(i => {
    const date = new Date(i.inspectionDate);
    console.log(`ID: ${i.id}, Şube: ${i.branchName}, Tarih: ${date.toLocaleDateString('tr-TR')}, Puan: ${i.totalScore}%`);
  });
  
} catch (err) {
  console.error('Hata:', err);
}
