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

// Check if inspection has action plans
const [actions] = await connection.execute(
  'SELECT COUNT(*) as count FROM inspection_actions WHERE inspection_id = ?',
  [1860002]
);
console.log('Actions for inspection 1860002:', actions[0].count);

// Check if there are any actions at all
const [allActions] = await connection.execute(
  'SELECT COUNT(*) as count FROM inspection_actions'
);
console.log('Total actions in database:', allActions[0].count);

// Check the schema of inspection_actions table
const [schema] = await connection.execute(
  'DESCRIBE inspection_actions'
);
console.log('\ninspection_actions table schema:');
schema.forEach(col => {
  console.log(`  ${col.Field}: ${col.Type}`);
});

await connection.end();
