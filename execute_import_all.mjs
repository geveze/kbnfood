import mysql from 'mysql2/promise';
import fs from 'fs';

const connection = await mysql.createConnection({
  host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  user: '2UkMMcfEvYMQNtS.root',
  password: 'pRancyW9vAymmp8c',
  database: 'keban_app',
  port: 4000,
  ssl: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2',
  },
});

console.log('[Import] Connected to database');
console.log('[Import] Reading SQL file...');
const sql = fs.readFileSync('/tmp/import_all_data.sql', 'utf-8');

// Split by semicolon and execute each statement
const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));

console.log(`[Import] Found ${statements.length} SQL statements to execute`);

let executed = 0;
let errors = 0;
let lastError = null;

for (const stmt of statements) {
  try {
    const trimmed = stmt.trim();
    if (trimmed) {
      await connection.execute(trimmed);
      executed++;
      if (executed % 100 === 0) {
        console.log(`[Import] Executed ${executed} statements...`);
      }
    }
  } catch (error) {
    errors++;
    lastError = error;
    if (errors <= 5) {
      console.error(`[Import] Error executing statement:`, error.message);
    }
  }
}

console.log(`[Import] Completed: ${executed} executed, ${errors} errors`);
if (lastError && errors > 5) {
  console.error(`[Import] Last error: ${lastError.message}`);
}

// Verify data
console.log('\n[Verify] Checking imported data...');
const tables = [
  'branches',
  'field_inspections',
  'open_pif_evaluations',
  'performance_evaluation_items',
  'position_categories',
  'position_questions',
  'user_sessions',
  'weekly_plans',
];

let totalRows = 0;
for (const table of tables) {
  try {
    const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM \`${table}\``);
    const count = rows[0].count;
    totalRows += count;
    console.log(`[Verify] ${table}: ${count} rows`);
  } catch (error) {
    console.error(`[Verify] Error checking ${table}:`, error.message);
  }
}

console.log(`\n[Summary] Total rows imported: ${totalRows}`);
await connection.end();
console.log('[Import] Done!');
