import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'gateway01.us-west-2.prod.tidb.cloud',
  port: 4000,
  user: 'root',
  password: process.env.TIDB_PASSWORD,
  database: 'keban_app',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

console.log('Database: keban_app');
console.log('Host: gateway01.us-west-2.prod.tidb.cloud\n');

// Get the latest Ordu inspection (ID 1980002)
const [answers] = await connection.execute(`
  SELECT 
    id,
    inspection_id,
    question_id,
    answer,
    explanation,
    photo_urls
  FROM field_inspection_answers 
  WHERE inspection_id = 1980002
  ORDER BY id ASC
`);

console.log(`Total answers for inspection 1980002: ${answers.length}\n`);

answers.forEach((ans, idx) => {
  console.log(`Answer ${idx + 1}:`);
  console.log(`  Question ID: ${ans.question_id}`);
  console.log(`  Answer: ${ans.answer}`);
  console.log(`  Explanation: ${ans.explanation}`);
  console.log(`  Photo URLs (raw): ${ans.photo_urls}`);
  if (ans.photo_urls) {
    try {
      const parsed = JSON.parse(ans.photo_urls);
      console.log(`  Photo URLs (parsed): ${JSON.stringify(parsed, null, 2)}`);
    } catch (e) {
      console.log(`  Photo URLs (parse error): ${e.message}`);
    }
  }
  console.log();
});

await connection.end();
