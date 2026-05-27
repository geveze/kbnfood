import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_URL.split('@')[1].split('/')[0],
  user: process.env.DATABASE_URL.split('//')[1].split(':')[0],
  password: process.env.DATABASE_URL.split(':')[2].split('@')[0],
  database: process.env.DATABASE_URL.split('/').pop()
});

const [answers] = await connection.execute(
  'SELECT id, questionId, photoUrls FROM fieldInspectionAnswers WHERE inspectionId = 240020'
);

console.log('240020 Denetiminin Answers:');
answers.forEach((ans, idx) => {
  console.log(`\n[${idx}] Question ID: ${ans.questionId}`);
  console.log(`Photo URLs: ${ans.photoUrls}`);
  
  const urls = JSON.parse(ans.photoUrls || '[]');
  urls.forEach((url, i) => {
    console.log(`  - Photo ${i + 1}: ${url}`);
  });
});

await connection.end();
