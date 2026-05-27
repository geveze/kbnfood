import mysql from 'mysql2/promise';

const config = {
  host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '2UkMMcfEvYMQNtS.root',
  password: 'pRancyW9vAymmp8c',
  database: 'keban_app',
  ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
};

async function main() {
  const conn = await mysql.createConnection(config);
  console.log('Connected to keban_app database');

  // First check current state
  const [existingPositions] = await conn.execute('SELECT * FROM positions');
  console.log('Existing positions count:', existingPositions.length);
  if (existingPositions.length > 0) {
    console.log('Existing positions:', existingPositions.map(p => p.name));
  }

  // Check if columns exist
  const [cols] = await conn.execute('DESCRIBE positions');
  const colNames = cols.map(c => c.Field);
  console.log('Columns:', colNames);

  // Add display_name column if missing
  if (!colNames.includes('display_name') && !colNames.includes('displayName')) {
    console.log('Adding display_name column...');
    await conn.execute('ALTER TABLE positions ADD COLUMN display_name VARCHAR(255)');
    console.log('display_name column added');
  }

  // Add is_active column if missing
  if (!colNames.includes('is_active') && !colNames.includes('isActive')) {
    console.log('Adding is_active column...');
    await conn.execute('ALTER TABLE positions ADD COLUMN is_active TINYINT(1) DEFAULT 1');
    console.log('is_active column added');
  }

  // Re-check columns
  const [cols2] = await conn.execute('DESCRIBE positions');
  console.log('Updated columns:', cols2.map(c => c.Field));

  // Clear existing positions (except important ones)
  console.log('Clearing existing positions...');
  await conn.execute('DELETE FROM positions');

  // Insert positions from CSV data
  const positionsData = [
    { id: 5, name: 'SERVIS', displayName: 'Servis', description: '' },
    { id: 6, name: 'RESTORAN_YONETIMI', displayName: 'Restoran Yönetimi', description: '' },
    { id: 7, name: 'IZGARA_YONETICI', displayName: 'Izgara Yöneticisi', description: '' },
    { id: 8, name: 'KASA', displayName: 'Kasa', description: '' },
    { id: 90002, name: 'IZGARA', displayName: 'IZGARA', description: '' },
  ];

  // Determine which column name to use
  const updatedCols = cols2.map(c => c.Field);
  const displayCol = updatedCols.includes('display_name') ? 'display_name' : 'displayName';
  const activeCol = updatedCols.includes('is_active') ? 'is_active' : 'isActive';

  for (const pos of positionsData) {
    await conn.execute(
      `INSERT INTO positions (id, name, ${displayCol}, description, ${activeCol}) VALUES (?, ?, ?, ?, 1)`,
      [pos.id, pos.name, pos.displayName, pos.description]
    );
    console.log(`Inserted position: ${pos.name} (${pos.displayName})`);
  }

  // Verify
  const [finalPositions] = await conn.execute('SELECT * FROM positions');
  console.log('\nFinal positions count:', finalPositions.length);
  for (const p of finalPositions) {
    console.log(`  ID: ${p.id}, Name: ${p.name}`);
  }

  // Now handle position_categories table
  const [catCols] = await conn.execute('DESCRIBE position_categories');
  console.log('\nposition_categories columns:', catCols.map(c => c.Field));

  // Check existing categories
  const [existingCats] = await conn.execute('SELECT COUNT(*) as cnt FROM position_categories');
  console.log('Existing categories count:', existingCats[0].cnt);

  if (existingCats[0].cnt === 0) {
    // Insert categories from CSV
    const categories = [
      { id: 1, positionId: 5, name: 'Görev Bilinci', weight: 20 },
      { id: 2, positionId: 5, name: 'İletişim Becerisi', weight: 15 },
      { id: 3, positionId: 5, name: 'Analitik Düşünme ve Problem Çözme', weight: 15 },
      { id: 4, positionId: 5, name: 'Kalite Odaklılık', weight: 20 },
      { id: 5, positionId: 5, name: 'Takım Çalışması ve İşbirliği', weight: 15 },
      { id: 6, positionId: 5, name: 'Yönetim Becerileri', weight: 15 },
      { id: 7, positionId: 6, name: 'Görev Bilinci', weight: 20 },
      { id: 8, positionId: 6, name: 'İletişim Becerisi', weight: 15 },
      { id: 9, positionId: 6, name: 'Analitik Düşünme ve Problem Çözme', weight: 15 },
      { id: 10, positionId: 6, name: 'Kalite Odaklılık', weight: 20 },
      { id: 11, positionId: 6, name: 'Takım Çalışması ve İşbirliği', weight: 15 },
      { id: 12, positionId: 6, name: 'Yönetim Becerileri', weight: 15 },
      { id: 13, positionId: 7, name: 'Görev Bilinci', weight: 20 },
      { id: 14, positionId: 7, name: 'İletişim Becerisi', weight: 15 },
      { id: 15, positionId: 7, name: 'Analitik Düşünme ve Problem Çözme', weight: 15 },
      { id: 16, positionId: 7, name: 'Kalite Odaklılık', weight: 20 },
      { id: 17, positionId: 7, name: 'Takım Çalışması ve İşbirliği', weight: 15 },
      { id: 18, positionId: 7, name: 'Yönetim Becerileri', weight: 15 },
      { id: 19, positionId: 8, name: 'Görev Bilinci', weight: 20 },
      { id: 20, positionId: 8, name: 'İletişim Becerisi', weight: 15 },
      { id: 21, positionId: 8, name: 'Analitik Düşünme ve Problem Çözme', weight: 15 },
      { id: 22, positionId: 8, name: 'Kalite Odaklılık', weight: 20 },
      { id: 23, positionId: 8, name: 'Takım Çalışması ve İşbirliği', weight: 15 },
      { id: 24, positionId: 8, name: 'Yönetim Becerileri', weight: 15 },
      { id: 25, positionId: 90002, name: 'Görev Bilinci', weight: 20 },
      { id: 26, positionId: 90002, name: 'İletişim Becerisi', weight: 15 },
      { id: 27, positionId: 90002, name: 'Analitik Düşünme ve Problem Çözme', weight: 15 },
      { id: 28, positionId: 90002, name: 'Kalite Odaklılık', weight: 20 },
      { id: 29, positionId: 90002, name: 'Takım Çalışması ve İşbirliği', weight: 15 },
      { id: 30, positionId: 90002, name: 'Yönetim Becerileri', weight: 15 },
    ];

    for (const cat of categories) {
      await conn.execute(
        'INSERT INTO position_categories (id, positionId, name, weight) VALUES (?, ?, ?, ?)',
        [cat.id, cat.positionId, cat.name, cat.weight]
      );
    }
    console.log(`Inserted ${categories.length} categories`);
  }

  // Check position_questions
  const [qCols] = await conn.execute('DESCRIBE position_questions');
  console.log('\nposition_questions columns:', qCols.map(c => c.Field));

  const [existingQs] = await conn.execute('SELECT COUNT(*) as cnt FROM position_questions');
  console.log('Existing questions count:', existingQs[0].cnt);

  if (existingQs[0].cnt === 0) {
    // Read CSV data for questions
    const fs = await import('fs');
    const csvContent = fs.readFileSync('/home/ubuntu/upload/position_questions_20260427_123955.csv', 'utf-8');
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    console.log('CSV headers:', headers);

    let insertCount = 0;
    for (let i = 1; i < lines.length; i++) {
      // Parse CSV line carefully (handle commas in quoted fields)
      const line = lines[i];
      const values = [];
      let current = '';
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        if (line[j] === '"') {
          inQuotes = !inQuotes;
        } else if (line[j] === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += line[j];
        }
      }
      values.push(current.trim());

      if (values.length >= 4) {
        const id = parseInt(values[0]);
        const categoryId = parseInt(values[1]);
        const questionText = values[2];
        const weight = parseInt(values[3]) || 0;

        if (!isNaN(id) && !isNaN(categoryId) && questionText) {
          await conn.execute(
            'INSERT INTO position_questions (id, categoryId, questionText, weight) VALUES (?, ?, ?, ?)',
            [id, categoryId, questionText, weight]
          );
          insertCount++;
        }
      }
    }
    console.log(`Inserted ${insertCount} questions`);
  }

  // Final verification
  const [finalCats] = await conn.execute('SELECT COUNT(*) as cnt FROM position_categories');
  const [finalQs] = await conn.execute('SELECT COUNT(*) as cnt FROM position_questions');
  console.log('\n=== FINAL VERIFICATION ===');
  console.log('Positions:', finalPositions.length);
  console.log('Categories:', finalCats[0].cnt);
  console.log('Questions:', finalQs[0].cnt);

  await conn.end();
  console.log('\nDone!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
