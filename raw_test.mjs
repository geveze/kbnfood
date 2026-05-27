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

// Check if inspection exists
const [insp] = await connection.execute(
  'SELECT id, branch_name FROM field_inspections WHERE id = ?',
  [1860002]
);
console.log('Inspection:', insp);

// Check answers
const [ans] = await connection.execute(
  'SELECT COUNT(*) as count FROM field_inspection_answers WHERE inspection_id = ?',
  [1860002]
);
console.log('Answers count:', ans[0].count);

// Check if questions exist
const [qs] = await connection.execute(
  'SELECT COUNT(*) as count FROM field_inspection_questions'
);
console.log('Total questions:', qs[0].count);

// Check if categories exist
const [cats] = await connection.execute(
  'SELECT COUNT(*) as count FROM field_inspection_categories'
);
console.log('Total categories:', cats[0].count);

// Try the join
const [joined] = await connection.execute(`
  SELECT COUNT(*) as count
  FROM field_inspection_answers a
  INNER JOIN field_inspection_questions q ON a.question_id = q.id
  INNER JOIN field_inspection_categories c ON q.category_id = c.id
  WHERE a.inspection_id = ?
`, [1860002]);
console.log('Joined count:', joined[0].count);

await connection.end();
