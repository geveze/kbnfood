import { getDb } from './server/_core/db.ts';

async function addIsCriticalColumn() {
  try {
    const db = await getDb();
    
    // isCritical alanını ekle
    await db.execute(`
      ALTER TABLE field_inspection_questions 
      ADD COLUMN isCritical BOOLEAN DEFAULT FALSE 
      AFTER maxScore
    `);
    
    console.log('✅ isCritical alanı başarıyla eklendi!');
  } catch (error) {
    if (error.message.includes('Duplicate column')) {
      console.log('✅ isCritical alanı zaten var!');
    } else {
      console.error('❌ Hata:', error.message);
    }
  }
}

addIsCriticalColumn();
