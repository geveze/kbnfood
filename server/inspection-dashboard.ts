import { getDb } from "./db";
import { fieldInspections, fieldInspectionAnswers, fieldInspectionQuestions, fieldInspectionCategories, inspectionWarnings, branches } from "../drizzle/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

/**
 * Dashboard - Şube bazlı denetim metrikleri (Detaylı tablo için)
 */
export async function getInspectionDashboard(branchId?: number) {
  const db = await getDb();
  if (!db) {
    console.error("[ERROR] Database connection failed");
    return [];
  }

  try {
    // Tüm şubeleri getir
    let branchList = await db.select().from(branches);
    
    if (branchId) {
      branchList = branchList.filter(b => b.id === branchId);
    }

    // Her şube için metrikleri hesapla
    const metricsPromises = branchList.map(async (branch) => {
      // Bu şubenin tüm denetimlerini getir
      const branchInspections = await db
        .select()
        .from(fieldInspections)
        .where(eq(fieldInspections.branchId, branch.id))
        .orderBy(desc(fieldInspections.inspectionDate));

      if (branchInspections.length === 0) {
        return null; // Denetim yoksa atla
      }

      // Ortalama skor
      const scores = branchInspections.map(i => parseFloat(i.totalScore as any) || 0);
      const averageScore = scores.length > 0 
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 
        : 0;

      // Son skor
      const lastScore = parseFloat(branchInspections[0].totalScore as any) || 0;

      // Trend (son denetim vs bir önceki denetim)
      let trend = 0;
      if (branchInspections.length >= 2) {
        const currentScore = parseFloat(branchInspections[0].totalScore as any) || 0;
        const previousScore = parseFloat(branchInspections[1].totalScore as any) || 0;
        trend = Math.round((currentScore - previousScore) * 100) / 100;
      }

      // Son denetim tarihi ve denetçi
      const lastInspection = branchInspections[0];
      const lastInspectionDate = lastInspection.inspectionDate;
      const lastInspectorName = lastInspection.inspectorName || "Bilinmiyor";

      return {
        branchId: branch.id,
        branchName: branch.name,
        branchCode: branch.code,
        averageScore: averageScore.toFixed(1),
        lastScore: lastScore.toFixed(1),
        trend: trend,
        lastInspectionDate: lastInspectionDate,
        lastInspectorName: lastInspectorName,
        totalInspections: branchInspections.length,
      };
    });

    const metrics = await Promise.all(metricsPromises);
    return metrics.filter(m => m !== null);
  } catch (error) {
    console.error("[ERROR] getInspectionDashboard:", error);
    return [];
  }
}

/**
 * Kritik sorular özeti - %50+ hayır oranı olan sorular
 */
export async function getCriticalQuestionsSummary(branchId?: number) {
  const db = await getDb();
  if (!db) {
    console.error("[ERROR] Database connection failed");
    return [];
  }

  try {
    // Tüm soruları getir
    const allQuestions = await db.select().from(fieldInspectionQuestions);

    // Her soru için hayır cevaplarını say
    const questionStats = await Promise.all(
      allQuestions.map(async (q) => {
        let noAnswersQuery = db
          .select()
          .from(fieldInspectionAnswers)
          .where(and(eq(fieldInspectionAnswers.questionId, q.id), eq(fieldInspectionAnswers.answer, "H")));

        // Eğer branchId varsa, o şubenin cevaplarını filtrele
        if (branchId) {
          const branchInspections = await db
            .select({ id: fieldInspections.id })
            .from(fieldInspections)
            .where(eq(fieldInspections.branchId, branchId));
          
          const inspectionIds = branchInspections.map(i => i.id);
          if (inspectionIds.length === 0) return null;
          
          noAnswersQuery = db
            .select()
            .from(fieldInspectionAnswers)
            .where(
              and(
                eq(fieldInspectionAnswers.questionId, q.id),
                eq(fieldInspectionAnswers.answer, "H")
              )
            );
        }

        const noAnswers = await noAnswersQuery;
        const totalAnswers = await db
          .select()
          .from(fieldInspectionAnswers)
          .where(eq(fieldInspectionAnswers.questionId, q.id));

        const noPercentage = totalAnswers.length > 0 
          ? Math.round((noAnswers.length / totalAnswers.length) * 100) 
          : 0;

        // Sadece %50+ hayır oranı olan soruları döndür
        if (noPercentage >= 50) {
          // Kategori adını getir
          const category = await db
            .select()
            .from(fieldInspectionCategories)
            .where(eq(fieldInspectionCategories.id, q.categoryId))
            .limit(1);

          return {
            questionId: q.id,
            questionText: q.questionText,
            categoryId: q.categoryId,
            categoryName: category[0]?.name || "Bilinmiyor",
            noCount: noAnswers.length,
            totalCount: totalAnswers.length,
            noPercentage: noPercentage,
          };
        }
        return null;
      })
    );

    return questionStats.filter(q => q !== null);
  } catch (error) {
    console.error("[ERROR] getCriticalQuestionsSummary:", error);
    return [];
  }
}

/**
 * Uyarılı şubeleri getir - şube bazlı uyarı özeti
 */
export async function getWarningsWithBranches() {
  const db = await getDb();
  if (!db) {
    console.error("[ERROR] Database connection failed");
    return [];
  }

  try {
    // Tüm uyarıları getir
    const allWarnings = await db
      .select()
      .from(inspectionWarnings)
      .orderBy(desc(inspectionWarnings.createdAt));

    // Şube bazında grupla
    const warningsByBranch = new Map<number, any>();

    for (const warning of allWarnings) {
      if (!warningsByBranch.has(warning.branchId)) {
        warningsByBranch.set(warning.branchId, {
          branchId: warning.branchId,
          branchCode: warning.branchCode,
          branchName: warning.branchName,
          warningCount: 0,
          lastWarningDate: warning.createdAt,
          warnings: [],
        });
      }

      const branchWarnings = warningsByBranch.get(warning.branchId)!;
      branchWarnings.warningCount++;
      branchWarnings.lastWarningDate = warning.createdAt;
      branchWarnings.warnings.push({
        id: warning.id,
        categoryName: warning.categoryName,
        questionText: warning.questionText,
        status: warning.status,
        createdAt: warning.createdAt,
      });
    }

    return Array.from(warningsByBranch.values());
  } catch (error) {
    console.error("[ERROR] getWarningsWithBranches:", error);
    return [];
  }
}

/**
 * Denetim trend analizi - zaman bazlı performans değişimi
 */
export async function getInspectionTrends(branchId?: number, monthsBack: number = 6) {
  const db = await getDb();
  if (!db) {
    console.error("[ERROR] Database connection failed");
    return [];
  }

  try {
    const now = new Date();
    const pastDate = new Date(now.getTime() - monthsBack * 30 * 24 * 60 * 60 * 1000);

    const whereConditions: any[] = [gte(fieldInspections.inspectionDate, pastDate)];
    if (branchId) {
      whereConditions.push(eq(fieldInspections.branchId, branchId));
    }

    const inspections = await db
      .select({
        date: fieldInspections.inspectionDate,
        branchId: fieldInspections.branchId,
        branchName: fieldInspections.branchName,
        totalScore: fieldInspections.totalScore,
      })
      .from(fieldInspections)
      .where(and(...whereConditions));



    // Tarih bazında grupla ve ortalama puan hesapla
    const trendMap = new Map<string, { date: string; averageScore: number; count: number }>();

    for (const inspection of inspections) {
      const dateStr = new Date(inspection.date).toISOString().split("T")[0];
      const score = parseFloat(inspection.totalScore as any) || 0;

      if (!trendMap.has(dateStr)) {
        trendMap.set(dateStr, { date: dateStr, averageScore: 0, count: 0 });
      }

      const stat = trendMap.get(dateStr)!;
      stat.averageScore = (stat.averageScore * stat.count + score) / (stat.count + 1);
      stat.count++;
    }

    return Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("[ERROR] getInspectionTrends:", error);
    return [];
  }
}
