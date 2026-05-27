import { getDb } from "./db";
import { fieldInspections, fieldInspectionAnswers, fieldInspectionQuestions, fieldInspectionCategories, inspectionWarnings } from "../drizzle/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

/**
 * Denetim sonuçlarını analiz et ve uyarı oluştur
 * Aynı maddeden 3 kere üst üste "Hayır" alan şubeler için uyarı
 */
export async function checkAndCreateWarnings(inspectionId: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[ERROR] Database connection failed");
      return;
    }

    // 1. Denetim bilgisini al
    const inspection = await db
      .select()
      .from(fieldInspections)
      .where(eq(fieldInspections.id, inspectionId))
      .limit(1);

    if (!inspection.length) {
      console.error(`[WARNING] Inspection ${inspectionId} not found`);
      return;
    }

    const currentInspection = inspection[0];
    const branchId = currentInspection.branchId;

    // 2. Bu şubenin son 3 denetimini al (tarih sırasına göre)
    const recentInspections = await db
      .select()
      .from(fieldInspections)
      .where(eq(fieldInspections.branchId, branchId))
      .orderBy(desc(fieldInspections.inspectionDate))
      .limit(3);

    if (recentInspections.length < 3) {
      return;
    }

    // 3. Son 3 denetimin ID'lerini al
    const inspectionIds = recentInspections.map(i => i.id);

    // 4. Sorular ve kategorileri al
    const questions = await db
      .select()
      .from(fieldInspectionQuestions);

    const categories = await db
      .select()
      .from(fieldInspectionCategories);

    // 5. Her soru için cevapları grupla
    const questionAnswers: Record<number, string[]> = {};

    for (const inspId of inspectionIds) {
      const answers = await db
        .select()
        .from(fieldInspectionAnswers)
        .where(eq(fieldInspectionAnswers.inspectionId, inspId));

      answers.forEach(answer => {
        if (!questionAnswers[answer.questionId]) {
          questionAnswers[answer.questionId] = [];
        }
        questionAnswers[answer.questionId].push(answer.answer);
      });
    }

    // 6. 2 kere "H" (Hayır) alan soruları bul
    const warningsToCreate = [];

    for (const [questionId, answers] of Object.entries(questionAnswers)) {
      const qId = parseInt(questionId);
      const noCount = answers.filter(a => a === "H").length;

      if (noCount >= 2) {
        const question = questions.find(q => q.id === qId);
        const category = question ? categories.find(c => c.id === question.categoryId) : null;

        if (question) {
          warningsToCreate.push({
            branchId,
            branchCode: currentInspection.branchCode,
            branchName: currentInspection.branchName,
            questionId: qId,
            questionText: question.questionText,
            categoryId: category?.id,
            categoryName: category?.name,
            consecutiveNoCount: 3,
            lastInspectionId: inspectionId,
            lastInspectionDate: currentInspection.inspectionDate,
            inspectorId: currentInspection.inspectorId,
            inspectorEmail: currentInspection.inspectorEmail,
            status: "active" as const,
          });
        }
      }
    }

    // 7. Uyarıları veritabanına ekle
    if (warningsToCreate.length > 0) {
      for (const warning of warningsToCreate) {
        // Aynı soru için aktif uyarı var mı kontrol et
        const existingWarning = await db
          .select()
          .from(inspectionWarnings)
          .where(
            and(
              eq(inspectionWarnings.branchId, branchId),
              eq(inspectionWarnings.questionId, warning.questionId),
              eq(inspectionWarnings.status, "active")
            )
          )
          .limit(1);

        if (!existingWarning.length) {
          // Yeni uyarı oluştur
          await db.insert(inspectionWarnings).values(warning);

          // Bölge Müdürüne e-posta gönder
          await notifyOwner({
            title: `⚠️ Denetim Uyarısı: ${warning.branchName}`,
            content: `Şube: ${warning.branchName} (${warning.branchCode})\n\nKategori: ${warning.categoryName}\n\nSoru: ${warning.questionText}\n\nAynı maddeden 3 kere üst üste "Hayır" alınmıştır. Lütfen gerekli önlemleri alınız.`,
          });

          console.log(`[WARNING CREATED] Branch ${branchId}, Question ${warning.questionId}`);
        }
      }
    }
  } catch (error) {
    console.error("[ERROR] checkAndCreateWarnings:", error);
  }
}

/**
 * Şube için aktif uyarıları al
 */
export async function getWarningsForBranch(branchId: number) {
  const db = await getDb();
  if (!db) {
    console.error("[ERROR] Database connection failed");
    return [];
  }
  return db
    .select()
    .from(inspectionWarnings)
    .where(
      and(
        eq(inspectionWarnings.branchId, branchId),
        eq(inspectionWarnings.status, "active")
      )
    )
    .orderBy(desc(inspectionWarnings.createdAt));
}

/**
 * Uyarıyı çözüldü olarak işaretle
 */
export async function resolveWarning(warningId: number, resolvedBy: number, notes?: string) {
  const db = await getDb();
  if (!db) {
    console.error("[ERROR] Database connection failed");
    return null;
  }
  return db
    .update(inspectionWarnings)
    .set({
      status: "resolved",
      resolvedAt: new Date(),
      resolvedBy,
      notes,
    })
    .where(eq(inspectionWarnings.id, warningId));
}
