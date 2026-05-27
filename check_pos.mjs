import { getDb } from './server/db.ts';
import { positions, positionCategories, positionQuestions } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = await getDb();
if (!db) {
  console.log('DB connection failed');
  process.exit(1);
}

// Tüm pozisyonları listele
const allPos = await db.select().from(positions);
console.log('All positions:', allPos.map(p => ({ id: p.id, name: p.name })));

// Restoran Yönetimi'ni bul
const restoran = allPos.find(p => p.name && p.name.includes('Restoran'));
if (restoran) {
  console.log('\nRestoran Yönetimi found:', restoran);
  
  const cats = await db.select().from(positionCategories).where(eq(positionCategories.positionId, restoran.id));
  console.log('Categories:', cats.length);
  
  let totalQ = 0;
  for (const cat of cats) {
    const qs = await db.select().from(positionQuestions).where(eq(positionQuestions.categoryId, cat.id));
    totalQ += qs.length;
  }
  console.log('Total Questions:', totalQ);
} else {
  console.log('Restoran Yönetimi not found');
}

process.exit(0);
