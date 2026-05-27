import { getDb } from './server/db';
import { fieldInspections } from './drizzle/schema';
import { desc } from 'drizzle-orm';

const db = await getDb();

if (!db) {
  console.error('Database connection failed');
  process.exit(1);
}

try {
  const allInspections = await db.select().from(fieldInspections).orderBy(desc(fieldInspections.inspectionDate)).limit(10);
  
  console.log(`Toplam denetim: ${allInspections.length}`);
  console.log('Son 10 denetim:');
  allInspections.forEach(i => {
    const date = new Date(i.inspectionDate);
    console.log(`ID: ${i.id}, Şube: ${i.branchName}, Tarih: ${date.toLocaleDateString('tr-TR')}, Puan: ${i.totalScore}%`);
  });
  
  const april26 = allInspections.filter(i => {
    const date = new Date(i.inspectionDate);
    return date.getDate() === 26 && date.getMonth() === 3;
  });
  
  console.log(`\n26 Nisan denetimleri: ${april26.length}`);
  april26.forEach(i => {
    console.log(`ID: ${i.id}, Şube: ${i.branchName}, Puan: ${i.totalScore}%`);
  });
  
} catch (err) {
  console.error('Hata:', err);
}
