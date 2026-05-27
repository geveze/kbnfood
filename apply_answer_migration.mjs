import { getDb } from './server/db.ts';

const db = await getDb();
if (!db) {
  console.log('DB connection failed');
  process.exit(1);
}

try {
  // Eski score sütununu kaldır ve yeni sütunları ekle
  await db.execute(`
    ALTER TABLE \`field_inspection_answers\` 
    DROP COLUMN IF EXISTS \`score\`,
    ADD COLUMN IF NOT EXISTS \`answer\` VARCHAR(1) NOT NULL DEFAULT 'E',
    ADD COLUMN IF NOT EXISTS \`earnedPoints\` INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS \`questionPoints\` INT NOT NULL DEFAULT 0
  `);
  console.log('✅ Migration uygulandı: answer, earnedPoints, questionPoints sütunları eklendi');
  process.exit(0);
} catch (error) {
  console.log('⚠️ Error:', error.message);
  process.exit(1);
}
