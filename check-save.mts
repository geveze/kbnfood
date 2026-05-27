import { getDb } from './server/db';

const db = await getDb();

try {
  const count = await db.query.fieldInspections.findMany({
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    limit: 5,
  });
  
  console.log(`✅ Toplam denetim sayısı: ${count.length}`);
  console.log('Son 5 denetim:');
  count.forEach(i => {
    console.log(`- ID: ${i.id}, Şube: ${i.branchName}, Tarih: ${i.inspectionDate}, Puan: ${i.totalScore}%`);
  });
} catch (err) {
  console.error('Hata:', err);
}
