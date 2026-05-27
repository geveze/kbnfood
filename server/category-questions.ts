import { getDb } from "./db";
import { fieldInspectionAnswers, fieldInspectionQuestions } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Belirli bir kategoriye ait tüm soruları ve cevaplarını getir
 */
export async function getCategoryQuestions(categoryName: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');
    // Kategoriye ait tüm soruları getir
    const questions = await db
      .select({
        id: fieldInspectionQuestions.id,
        questionText: fieldInspectionQuestions.questionText,
        categoryId: fieldInspectionQuestions.categoryId,
        isCritical: fieldInspectionQuestions.isCritical,
      })
      .from(fieldInspectionQuestions)
      .where(eq(fieldInspectionQuestions.categoryId, 1));

    if (!questions || questions.length === 0) {
      return {
        category: categoryName,
        questions: [],
        totalQuestions: 0,
        noAnswerCount: 0,
        noAnswerPercentage: 0,
      };
    }

    // Her soru için "Hayır" cevap sayısını hesapla
    const questionsWithStats = await Promise.all(
      questions.map(async (question) => {
        const noAnswers = await (db as any)
          .select()
          .from(fieldInspectionAnswers)
          .where(
            and(
              eq(fieldInspectionAnswers.questionId, question.id),
              eq(fieldInspectionAnswers.answer, "H")
            )
          );

        return {
          ...question,
          noCount: noAnswers.length,
        };
      })
    );

    // Toplam "Hayır" sayısını hesapla
    const totalNoAnswers = questionsWithStats.reduce(
      (sum, q) => sum + q.noCount,
      0
    );
    const noAnswerPercentage =
      questions.length > 0
        ? Math.round((totalNoAnswers / questions.length) * 100)
        : 0;

    return {
      category: categoryName,
      questions: questionsWithStats,
      totalQuestions: questions.length,
      noAnswerCount: totalNoAnswers,
      noAnswerPercentage,
    };
  } catch (error) {
    console.error("Error fetching category questions:", error);
    throw error;
  }
}
