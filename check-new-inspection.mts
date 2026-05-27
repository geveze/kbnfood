import { getDb } from './server/db';

const db = await getDb();

try {
  const count = await db.query.fieldInspections.findMany({
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    limit: 1,
  });
  
  if (count.length > 0) {
    const latest = count[0];
    console.log(`✅ Son Denetim: ${latest.branchName} - ${latest.inspectionDate} - Score: ${latest.totalScore}% - ID: ${latest.id}`);
  } else {
    console.log('❌ Denetim bulunamadı');
  }
} catch (err) {
  console.error('Hata:', err);
}
