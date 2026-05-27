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
});

const db = drizzle(connection, { schema });

const inspectionId = 1860002;

// Test the exact query from getInspectionById
const answersWithQuestions = await db
  .select({
    id: schema.fieldInspectionAnswers.id,
    inspectionId: schema.fieldInspectionAnswers.inspectionId,
    questionId: schema.fieldInspectionAnswers.questionId,
    answer: schema.fieldInspectionAnswers.answer,
    earnedPoints: schema.fieldInspectionAnswers.earnedPoints,
    questionPoints: schema.fieldInspectionAnswers.questionPoints,
    explanation: schema.fieldInspectionAnswers.explanation,
    isCritical: schema.fieldInspectionAnswers.isCritical,
    photoUrls: schema.fieldInspectionAnswers.photoUrls,
    createdAt: schema.fieldInspectionAnswers.createdAt,
    updatedAt: schema.fieldInspectionAnswers.updatedAt,
    questionText: schema.fieldInspectionQuestions.questionText,
    categoryName: schema.fieldInspectionCategories.categoryName,
  })
  .from(schema.fieldInspectionAnswers)
  .innerJoin(
    schema.fieldInspectionQuestions,
    eq(schema.fieldInspectionAnswers.questionId, schema.fieldInspectionQuestions.id)
  )
  .innerJoin(
    schema.fieldInspectionCategories,
    eq(schema.fieldInspectionQuestions.categoryId, schema.fieldInspectionCategories.id)
  )
  .where(eq(schema.fieldInspectionAnswers.inspectionId, inspectionId));

console.log('answersWithQuestions count:', answersWithQuestions.length);
if (answersWithQuestions.length > 0) {
  console.log('First answer:', JSON.stringify(answersWithQuestions[0], null, 2));
}

await connection.end();
