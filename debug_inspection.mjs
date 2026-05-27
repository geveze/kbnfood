import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'gateway01.us-west-2.prod.tidb.cloud',
  port: 4000,
  user: 'root',
  password: process.env.TIDB_PASSWORD,
  database: 'keban_app',
});

// Check inspection
const [inspections] = await connection.execute(
  'SELECT id, branch_name, inspection_date FROM field_inspections WHERE id = 1860002'
);
console.log('Inspection:', inspections);

// Check answers
const [answers] = await connection.execute(
  'SELECT id, question_id, answer FROM field_inspection_answers WHERE inspection_id = 1860002 LIMIT 5'
);
console.log('Answers:', answers);

// Check if questions table has data
const [questions] = await connection.execute(
  'SELECT COUNT(*) as count FROM field_inspection_questions'
);
console.log('Total questions:', questions[0].count);

// Check categories
const [categories] = await connection.execute(
  'SELECT COUNT(*) as count FROM field_inspection_categories'
);
console.log('Total categories:', categories[0].count);

await connection.end();
