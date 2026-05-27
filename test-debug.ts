import { getDb } from './server/db';
import { fieldInspectionCategories, fieldInspectionQuestions } from './drizzle/schema';

async function test() {
  const db = await getDb();
  if (!db) {
    console.log('DB connection failed');
    return;
  }
  
  try {
    console.log('Testing categories query...');
    const categories = await db.select().from(fieldInspectionCategories);
    console.log('Categories count:', categories.length);
    
    console.log('Testing questions query...');
    const questions = await db.select().from(fieldInspectionQuestions);
    console.log('Questions count:', questions.length);
    
    if (questions.length > 0) {
      console.log('First question:', questions[0]);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

test().then(() => process.exit(0));
