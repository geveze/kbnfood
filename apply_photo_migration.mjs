import { getDb } from './server/db.ts';

const db = await getDb();
if (!db) {
  console.log('DB connection failed');
  process.exit(1);
}

try {
  await db.execute('ALTER TABLE `field_inspection_answers` ADD COLUMN IF NOT EXISTS `photoUrls` json');
  console.log('✅ Migration uygulandı: photoUrls sütunu eklendi');
  process.exit(0);
} catch (error) {
  console.log('⚠️ Error:', error.message);
  process.exit(1);
}
