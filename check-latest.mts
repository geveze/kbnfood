import { getDb } from './server/db';

const db = await getDb();

try {
  const count = await db.query.fieldInspections.findMany({
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    limit: 5,
  });
  
  console.log(`Toplam Denetim: ${count.length}`);
  console.log('\nSon 5 Denetim:');
  count.forEach((row, i) => {
    console.log(`${i+1}. ${row.branchName} - ${row.inspectionDate} - Score: ${row.totalScore}% - Status: ${row.status}`);
  });
} catch (err) {
  console.error('Hata:', err);
}
