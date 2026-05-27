import XLSX from 'xlsx';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'tidb-prod-1.tidbcloud.com',
  port: process.env.DB_PORT || 4000,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: 'keban_app',
  ssl: {
    rejectUnauthorized: false
  }
};

async function loadData() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('📊 Reading Excel files...');
    
    // Read categories
    const catWb = XLSX.readFile('/home/ubuntu/upload/field_inspection_categories.xlsx');
    const catWs = catWb.Sheets[catWb.SheetNames[0]];
    const categories = XLSX.utils.sheet_to_json(catWs);
    
    // Read questions
    const qWb = XLSX.readFile('/home/ubuntu/upload/inspection_questions.xlsx');
    const qWs = qWb.Sheets[qWb.SheetNames[0]];
    const questions = XLSX.utils.sheet_to_json(qWs);
    
    console.log(`✅ Read ${categories.length} categories and ${questions.length} questions`);
    
    // Clean existing data
    console.log('🗑️  Cleaning existing data...');
    await connection.execute('DELETE FROM field_inspection_questions');
    await connection.execute('DELETE FROM field_inspection_categories');
    
    // Insert categories
    console.log('📝 Inserting categories...');
    for (const cat of categories) {
      const categoryId = cat.id;
      const name = cat['Kategori Adı'];
      const weight = cat['etki oranı'];
      const order = cat['Sıra No'];
      
      await connection.execute(
        'INSERT INTO field_inspection_categories (id, name, weight, `order`) VALUES (?, ?, ?, ?)',
        [categoryId, name, weight, order]
      );
      console.log(`  ✓ Category ${categoryId}: ${name} (weight: ${weight})`);
    }
    
    // Insert questions
    console.log('📝 Inserting questions...');
    let count = 0;
    for (const q of questions) {
      const categoryId = q.categoryId;
      const questionText = q.questionText;
      const points = q.points || 0;
      
      await connection.execute(
        'INSERT INTO field_inspection_questions (categoryId, questionText, points, maxScore, `order`) VALUES (?, ?, ?, 5, ?)',
        [categoryId, questionText, points, count + 1]
      );
      count++;
    }
    console.log(`  ✓ Inserted ${count} questions`);
    
    // Verify
    console.log('✅ Verifying data...');
    const [catResult] = await connection.execute('SELECT COUNT(*) as count FROM field_inspection_categories');
    const [qResult] = await connection.execute('SELECT COUNT(*) as count FROM field_inspection_questions');
    
    console.log(`\n✅ SUCCESS!`);
    console.log(`   Categories: ${catResult[0].count}`);
    console.log(`   Questions: ${qResult[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

loadData();
