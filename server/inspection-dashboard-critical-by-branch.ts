import { getDb } from "./db";
import {
  fieldInspections,
  fieldInspectionAnswers,
  fieldInspectionQuestions,
  fieldInspectionCategories,
  branches,
} from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Şube bazında kritik soruları getir (sadece Hayır cevabı verilenleri)
 * Kritik Sorular Raporu'nda modal'da gösterilecek
 */
export async function getCriticalQuestionsByBranch() {
  const db = await getDb();
  if (!db) {
    console.error("[ERROR] Database connection failed");
    return [];
  }

  // Tüm tamamlanmış denetimleri al
  const inspections = await db
    .select({
      id: fieldInspections.id,
      branchId: fieldInspections.branchId,
      branchName: fieldInspections.branchName,
      branchCode: fieldInspections.branchCode,
    })
    .from(fieldInspections)
    .where(eq(fieldInspections.status, "completed"));

  if (inspections.length === 0) {
    return [];
  }

  // Kritik soruları getir
  const criticalQuestions = await db
    .select({
      id: fieldInspectionQuestions.id,
      questionText: fieldInspectionQuestions.questionText,
      categoryId: fieldInspectionQuestions.categoryId,
      categoryName: fieldInspectionCategories.name,
      isCritical: fieldInspectionQuestions.isCritical,
    })
    .from(fieldInspectionQuestions)
    .innerJoin(
      fieldInspectionCategories,
      eq(fieldInspectionQuestions.categoryId, fieldInspectionCategories.id)
    )
    .where(eq(fieldInspectionQuestions.isCritical, true));

  if (criticalQuestions.length === 0) {
    return [];
  }

  const criticalQuestionIds = criticalQuestions.map(q => q.id);
  const inspectionIds = inspections.map(i => i.id);

  // Kritik soruların Hayır cevaplarını al
  const answers = await db
    .select({
      inspectionId: fieldInspectionAnswers.inspectionId,
      questionId: fieldInspectionAnswers.questionId,
      answer: fieldInspectionAnswers.answer,
    })
    .from(fieldInspectionAnswers)
    .where(
      sql`${fieldInspectionAnswers.inspectionId} IN (${sql.raw(inspectionIds.join(","))}) 
        AND ${fieldInspectionAnswers.questionId} IN (${sql.raw(criticalQuestionIds.join(","))})`
    );

  // Şube ve kritik soru bazında Hayır cevaplarını grupla
  const branchCriticalMap = new Map<string, {
    branchId: number;
    branchName: string;
    branchCode: string;
    criticalQuestions: Array<{
      questionId: number;
      questionText: string;
      categoryName: string;
      noCount: number;
      totalCount: number;
    }>;
  }>();

  // İlk olarak tüm şubeleri ve kritik soruları harita'ya ekle
  for (const inspection of inspections) {
    const branchKey = `${inspection.branchId}`;
    if (!branchCriticalMap.has(branchKey)) {
      branchCriticalMap.set(branchKey, {
        branchId: inspection.branchId,
        branchName: inspection.branchName || 'Bilinmiyor',
        branchCode: inspection.branchCode || 'N/A',
        criticalQuestions: criticalQuestions.map(q => ({
          questionId: q.id,
          questionText: q.questionText,
          categoryName: q.categoryName,
          noCount: 0,
          totalCount: 0,
        })),
      });
    }
  }

  // Cevapları işle
  for (const answer of answers) {
    const inspection = inspections.find(i => i.id === answer.inspectionId);
    if (!inspection) continue;

    const branchKey = `${inspection.branchId}`;
    const branchData = branchCriticalMap.get(branchKey);
    if (!branchData) continue;

    const question = branchData.criticalQuestions.find(q => q.questionId === answer.questionId);
    if (!question) continue;

    question.totalCount++;
    if (answer.answer === "H") {
      question.noCount++;
    }
  }

  // Sonuçları dönüştür - sadece Hayır cevabı verilenleri göster
  const result = Array.from(branchCriticalMap.values())
    .map(branch => ({
      branchId: branch.branchId,
      branchName: branch.branchName || "",
      branchCode: branch.branchCode || "",
      criticalQuestions: branch.criticalQuestions
        .filter(q => q.noCount > 0) // Sadece Hayır cevabı verilenleri göster
        .map(q => ({
          questionId: q.questionId,
          questionText: q.questionText,
          categoryName: q.categoryName,
          noCount: q.noCount,
          totalCount: q.totalCount,
          noPercentage: parseFloat(((q.noCount / q.totalCount) * 100).toFixed(2)),
        })),
    }))
    .filter(branch => branch.criticalQuestions.length > 0) // Hayır cevabı olan soruları olan şubeleri göster
    .sort((a, b) => b.criticalQuestions.length - a.criticalQuestions.length); // Hayır sayısına göre sırala

  return result;
}
