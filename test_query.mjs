import { drizzle } from 'drizzle-orm/mysql2/promise';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const connection = await mysql.createConnection({
  host: 'gateway01.us-west-2.prod.tidb.cloud',
  port: 4000,
  user: 'root',
  password: process.env.TIDB_PASSWORD,
  database: 'keban_app',
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0,
});

const db = drizzle(connection, { schema });

// Test 1: Check if inspection exists
const inspections = await db.query.fieldInspections.findFirst({
  where: (t) => eq(t.id, 1860002),
});
console.log('Inspection found:', !!inspections);

// Test 2: Check answers
const answers = await db.query.fieldInspectionAnswers.findMany({
  where: (t) => eq(t.inspectionId, 1860002),
  limit: 5,
});
console.log('Answers count:', answers.length);
if (answers.length > 0) {
  console.log('First answer:', answers[0]);
}

// Test 3: Check questions
const questions = await db.query.fieldInspectionQuestions.findMany({
  limit: 3,
});
console.log('Questions count:', questions.length);

await connection.end();
