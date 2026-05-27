const mysql = require('mysql2/promise');

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ssl: 'Amazon RDS'
  });

  // Restoran Yönetimi ünvanını bul
  const [positions] = await connection.execute(
    "SELECT id, name FROM positions WHERE name LIKE '%Restoran%' OR name LIKE '%restoran%' LIMIT 5"
  );
  console.log('Positions:', positions);

  if (positions.length > 0) {
    for (const pos of positions) {
      const [categories] = await connection.execute(
        "SELECT id, name FROM position_categories WHERE position_id = ?",
        [pos.id]
      );
      console.log(`\nPosition: ${pos.name} (ID: ${pos.id})`);
      console.log(`Categories: ${categories.length}`);
      
      let totalQuestions = 0;
      for (const cat of categories) {
        const [questions] = await connection.execute(
          "SELECT COUNT(*) as count FROM position_questions WHERE category_id = ?",
          [cat.id]
        );
        totalQuestions += questions[0].count;
      }
      console.log(`Total Questions: ${totalQuestions}`);
    }
  }

  await connection.end();
}

check().catch(console.error);
