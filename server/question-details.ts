import { getDb } from "./db";
import { fieldInspectionAnswers, fieldInspections } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function getQuestionDetails(questionId: number) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  // Get all answers for this question
  const answers = await db
    .select({
      id: fieldInspectionAnswers.id,
      inspectionId: fieldInspectionAnswers.inspectionId,
      questionId: fieldInspectionAnswers.questionId,
      answer: fieldInspectionAnswers.answer,
      branchId: fieldInspections.branchId,
      branchCode: fieldInspections.branchCode,
      branchName: fieldInspections.branchName,
      inspectionDate: fieldInspections.inspectionDate,
      inspectorName: fieldInspections.inspectorName,
    })
    .from(fieldInspectionAnswers)
    .innerJoin(
      fieldInspections,
      eq(fieldInspectionAnswers.inspectionId, fieldInspections.id)
    )
    .where(
      and(
        eq(fieldInspectionAnswers.questionId, questionId),
        eq(fieldInspectionAnswers.answer, "H") // Only "Hayır" answers
      )
    )
    .orderBy(fieldInspections.inspectionDate);

  return answers;
}
