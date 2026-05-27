import { getDb } from './server/db';
import { fieldInspectionCategories } from './drizzle/schema';

async function test() {
  const db = await getDb();
  if (!db) {
    console.log('DB connection failed');
    return;
  }
  
  try {
    const categories = await db.select().from(fieldInspectionCategories);
    console.log('Categories count:', categories.length);
    if (categories.length > 0) {
      console.log('First category:', categories[0]);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

test();
