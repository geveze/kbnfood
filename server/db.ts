import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import {
  InsertUser,
  users,
  branches,
  kpiTargets,
  performanceData,
  financialMetrics,
  customerMetrics,
  hrMetrics,
  bulkUploadHistory,
  reports,
  periods,
  kpiTargetCardsDetail,
  performanceEvaluations,
  openPifEvaluations,
  positionCategories,
  positionQuestions,
  fieldInspections,
  fieldInspectionCategories,
  fieldInspectionQuestions,
  weeklyPlans,
  WeeklyPlan,
  InsertWeeklyPlan,
  criticalQuestions,
  CriticalQuestion,
  InsertCriticalQuestion,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { manualDbConfig, buildManualConnectionString, validateManualDbConfig } from "./db-config";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db) {
    let connectionString: string | undefined;

    // 1. Manuel konfigürasyon kontrol et
    if (validateManualDbConfig()) {
      try {
        connectionString = buildManualConnectionString();
        console.log('[Database] Using manual database configuration (keban_app)');
      } catch (error) {
        console.warn('[Database] Manual config error:', error);
        connectionString = process.env.DATABASE_URL;
      }
    } else {
      // 2. Sistem DATABASE_URL'sini kullan
      connectionString = process.env.DATABASE_URL;
    }

    if (connectionString) {
      try {
        _db = drizzle(connectionString, { schema, mode: 'default' });
        console.log('[Database] Connected successfully');
      } catch (error) {
        console.warn('[Database] Failed to connect:', error);
        _db = null;
      }
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, (unknown)> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Branch queries
export async function getBranches() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(branches);
}

export async function getBranchById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(branches).where(eq(branches.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getBranchByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(branches).where(eq(branches.code, code)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createBranch(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(branches).values(data);
  return result;
}

export async function updateBranch(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Şubeyi güncelle
  const result = await db.update(branches).set(data).where(eq(branches.id, id));
  
  // Eğer manager (bölge sorumlusu) güncelleniyorsa, KPI'ları da güncelle
  if (data.manager) {
    const branch = await db.select().from(branches).where(eq(branches.id, id)).limit(1);
    if (branch.length > 0) {
      const branchName = branch[0].name;
      // KPI target cards detail tablosundaki bölge sorumlusunu güncelle
      await db.update(kpiTargetCardsDetail)
        .set({ branchManager: data.manager })
        .where(eq(kpiTargetCardsDetail.branchName, branchName));
    }
  }
  
  return result;
}

// KPI Target queries
export async function getKPITargets(branchId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (branchId) {
    return await db.select().from(kpiTargets).where(eq(kpiTargets.branchId, branchId));
  }
  return await db.select().from(kpiTargets);
}

export async function createKPITarget(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(kpiTargets).values(data);
}

export async function updateKPITarget(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(kpiTargets).set(data).where(eq(kpiTargets.id, id));
}

// Performance Data queries
export async function getPerformanceData(branchId?: number, period?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (branchId) conditions.push(eq(performanceData.branchId, branchId));
  if (period) conditions.push(eq(performanceData.period, period));

  if (conditions.length === 0) {
    return await db.select().from(performanceData);
  }
  return await db.select().from(performanceData).where(and(...conditions));
}

export async function createPerformanceData(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(performanceData).values(data);
}

export async function updatePerformanceData(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(performanceData).set(data).where(eq(performanceData.id, id));
}

// Financial Metrics queries
export async function getFinancialMetrics(branchId?: number, period?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (branchId) conditions.push(eq(financialMetrics.branchId, branchId));
  if (period) conditions.push(eq(financialMetrics.period, period));

  if (conditions.length === 0) {
    return await db.select().from(financialMetrics);
  }
  return await db.select().from(financialMetrics).where(and(...conditions));
}

export async function createFinancialMetrics(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(financialMetrics).values(data);
}

// Customer Metrics queries
export async function getCustomerMetrics(branchId?: number, period?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (branchId) conditions.push(eq(customerMetrics.branchId, branchId));
  if (period) conditions.push(eq(customerMetrics.period, period));

  if (conditions.length === 0) {
    return await db.select().from(customerMetrics);
  }
  return await db.select().from(customerMetrics).where(and(...conditions));
}

export async function createCustomerMetrics(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(customerMetrics).values(data);
}

// HR Metrics queries
export async function getHRMetrics(branchId?: number, period?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (branchId) conditions.push(eq(hrMetrics.branchId, branchId));
  if (period) conditions.push(eq(hrMetrics.period, period));

  if (conditions.length === 0) {
    return await db.select().from(hrMetrics);
  }
  return await db.select().from(hrMetrics).where(and(...conditions));
}

export async function createHRMetrics(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(hrMetrics).values(data);
}

// Bulk Upload History queries
export async function getBulkUploadHistory() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bulkUploadHistory).orderBy(desc(bulkUploadHistory.createdAt));
}

export async function createBulkUploadHistory(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(bulkUploadHistory).values(data);
}

// Reports queries
export async function getReports(branchId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (branchId) {
    return await db.select().from(reports).where(eq(reports.branchId, branchId));
  }
  return await db.select().from(reports);
}

export async function createReport(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(reports).values(data);
}

// ============= PERIODS =============
export async function getPeriods() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(periods);
}

export async function getActivePeriods() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(periods).where(eq(periods.isActive, true));
}

export async function getPeriodByName(name: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(periods).where(eq(periods.name, name)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createPeriod(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(periods).values(data);
}

export async function updatePeriod(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(periods).set(data).where(eq(periods.id, id));
}

export async function deletePeriod(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(periods).where(eq(periods.id, id));
}

// ============= KPI TARGET CARDS DETAIL =============
export async function getKPITargetCardsDetail(filters: any = {}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (filters.period) conditions.push(eq(kpiTargetCardsDetail.period, filters.period));
  if (filters.branchName) conditions.push(eq(kpiTargetCardsDetail.branchName, filters.branchName));
  if (filters.branchManager) conditions.push(eq(kpiTargetCardsDetail.branchManager, filters.branchManager));
  if (filters.dimension) conditions.push(eq(kpiTargetCardsDetail.dimension, filters.dimension));

  if (conditions.length === 0) {
    return await db.select().from(kpiTargetCardsDetail);
  }
  return await db.select().from(kpiTargetCardsDetail).where(and(...conditions));
}

export async function getKPITargetCardsPeriods() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .selectDistinct({ period: kpiTargetCardsDetail.period })
    .from(kpiTargetCardsDetail);
  return result;
}

export async function getKPITargetCardsBranchManagers() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .selectDistinct({ branchManager: kpiTargetCardsDetail.branchManager })
    .from(kpiTargetCardsDetail);
  return result;
}

export async function getKPITargetCardsDimensions() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .selectDistinct({ dimension: kpiTargetCardsDetail.dimension })
    .from(kpiTargetCardsDetail);
  return result;
}

export async function updateKPITargetCardActualValue(id: number, actualValue: string, score: string, weightedScore: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(kpiTargetCardsDetail)
    .set({
      actualValue,
      score,
      // weightedScore is calculated, not stored
      updatedAt: new Date(),
    })
    .where(eq(kpiTargetCardsDetail.id, id));
}

// ============= PERFORMANCE EVALUATIONS =============
export async function createPerformanceEvaluation(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(performanceEvaluations).values(data);
  // MySQL/Drizzle returns the inserted row with id
  return result;
}

export async function getPerformanceEvaluations(filters: any = {}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (filters.branch) conditions.push(eq(performanceEvaluations.branch, filters.branch));
  if (filters.evaluationMonth) conditions.push(eq(performanceEvaluations.evaluationMonth, filters.evaluationMonth));

  if (conditions.length === 0) {
    return await db.select().from(performanceEvaluations).orderBy(desc(performanceEvaluations.createdAt));
  }
  return await db.select().from(performanceEvaluations).where(and(...conditions)).orderBy(desc(performanceEvaluations.createdAt));
}

export async function getPerformanceEvaluationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(performanceEvaluations).where(eq(performanceEvaluations.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updatePerformanceEvaluation(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(performanceEvaluations).set(data).where(eq(performanceEvaluations.id, id));
}

export async function deletePerformanceEvaluation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(performanceEvaluations).where(eq(performanceEvaluations.id, id));
}

// ============= PERFORMANCE EVALUATION ITEMS (DEPRECATED) =============
// Bu fonksiyonlar artık kullanılmıyor - performanceEvaluations tablosunda scores JSON olarak saklanıyor

// ============= STATISTICS =============
export async function getBranchStatistics(period: string, branchName: string) {
  const db = await getDb();
  if (!db) {
    return {
      kpiCount: 0,
      totalScore: 0,
      targetScore: 0,
      finalScore: 0,
    };
  }

  const cards = await db
    .select()
    .from(kpiTargetCardsDetail)
    .where(and(eq(kpiTargetCardsDetail.period, period), eq(kpiTargetCardsDetail.branchName, branchName)));

  if (cards.length === 0) {
    return {
      kpiCount: 0,
      totalScore: 0,
      targetScore: 0,
      finalScore: 0,
    };
  }

  const kpiCount = cards.length;
  const scores = cards
    .map((card: any) => {
      const score = card.score ? parseFloat(card.score) : 0;
      return isNaN(score) ? 0 : score;
    })
    .filter((score: number) => !isNaN(score));

  const totalScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;

  const weightedScores = cards
    .map((card: any) => {
      const weightedScore = card.weightedScore ? parseFloat(card.weightedScore) : 0;
      return isNaN(weightedScore) ? 0 : weightedScore;
    })
    .filter((score: number) => !isNaN(score));

  const targetScore = weightedScores.length > 0 ? weightedScores.reduce((a: number, b: number) => a + b, 0) : 0;
  const finalScore = (targetScore / 120) * 100;

  return {
    kpiCount,
    totalScore: Math.round(totalScore * 100) / 100,
    targetScore: Math.round(targetScore * 100) / 100,
    finalScore: Math.round(finalScore * 100) / 100,
  };
}


// ===== Açık PİF (Performans İzleme Formu) Helpers =====

// import { positions, positionCategories, positionQuestions, openPIFEvaluations } from "../drizzle/schema";
// Eski tablolar - artık kullanılmıyor

// export async function getPositions() {
//   const db = await getDb();
//   if (!db) return [];
//   
//   try {
//     return await db.select().from(positions);
//   } catch (error) {
//     console.error("[Database] Error fetching positions:", error);
//     return [];
//   }
// }
//
// export async function getPositionById(positionId: number) {
//   const db = await getDb();
//   if (!db) return null;
//   
//   try {
//     const result = await db
//       .select()
//       .from(positions)
//       .where(eq(positions.id, positionId));
//     return result[0] || null;
//   } catch (error) {
//     console.error("[Database] Error fetching position:", error);
//     return null;
//   }
// }

export async function getPositionCategories(positionId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db
      .select()
      .from(positionCategories)
      .where(eq(positionCategories.positionId, positionId));
  } catch (error) {
    console.error("[Database] Error fetching position categories:", error);
    return [];
  }
}

export async function getPositionQuestions(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db
      .select()
      .from(positionQuestions)
      .where(eq(positionQuestions.categoryId, categoryId));
  } catch (error) {
    console.error("[Database] Error fetching position questions:", error);
    return [];
  }
}

/**
 * position_questions tablosunun UPDATE ve DELETE işlemlerini engelle
 * Sorular asla değiştirilmemeli veya silinmemelidir
 */
export function protectPositionQuestions() {
  return {
    update: () => {
      throw new Error('position_questions tablosu kilitlidir. Sorular değiştirilemez.');
    },
    delete: () => {
      throw new Error('position_questions tablosu kilitlidir. Sorular silinemez.');
    }
  };
}
export async function getPositionWithCategories(positionId: number) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    // const position = await getPositionById(positionId);
    // Position lookup not needed for this operation
    
    const categories = await db
      .select()
      .from(positionCategories)
      .where(eq(positionCategories.positionId, positionId));
    
    // Fetch all questions for all categories
    const categoriesWithQuestions = await Promise.all(
      categories.map(async (category) => {
        const questions = await db
          .select()
          .from(positionQuestions)
          .where(eq(positionQuestions.categoryId, category.id));
        return { ...category, questions };
      })
    );
    return { positionId, categories: categoriesWithQuestions };
  } catch (error) {
    console.error("[Database] Error fetching position with categories:", error);
    return null;
  }
}

// export async function createOpenPifEvaluation(data: any) {
//   const db = await getDb();
//   if (!db) return null;
//   
//   try {
//     const scores = data.answers
//       .filter((answer: any) => answer.score !== null && answer.score !== undefined)
//       .map((answer: any) => parseFloat(answer.score));
//     const totalScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
//     
//     const result = await db.insert(openPIFEvaluations).values({
//       branchId: data.branchId,
//       positionId: data.positionId,
//       employeeName: data.employeeName,
//       employeeIdNumber: data.employeeIdNumber,
//       evaluationDate: data.evaluationDate,
//       evaluatedByName: data.evaluatedByName,
//       answers: JSON.stringify(data.answers),
//       totalScore: totalScore.toString(),
//       evaluationScale: "5",
//     });
//     
//     return result;
//   } catch (error) {
//     console.error("[Database] Error creating open PIF evaluation:", error);
//     return null;
//   }
// }

// export async function getOpenPifEvaluations(branchId: number) {
//   const db = await getDb();
//   if (!db) return [];
//   
//   try {
//     return await db
//       .select()
//       .from(openPIFEvaluations)
//       .where(eq(openPIFEvaluations.branchId, branchId));
//   } catch (error) {
//     console.error("[Database] Error fetching open PIF evaluations:", error);
//     return [];
//   }
// }
//
//
// export async function getAllOpenPifEvaluations() {
//   const db = await getDb();
//   if (!db) return [];
//   
//   try {
//     const evaluations = await db
//       .select()
//       .from(openPIFEvaluations)
//       .orderBy(desc(openPIFEvaluations.createdAt));
//     
//     // Pozisyon bilgilerini ekle
//     const evaluationsWithPositions = await Promise.all(
//       evaluations.map(async (evaluation) => {
//         const position = await getPositionById(evaluation.positionId);
//         return {
//           ...evaluation,
//           positionName: position?.name || "Bilinmiyor",
//         };
//       })
//     );
//     
//     return evaluationsWithPositions;
//   } catch (error) {
//     console.error("[Database] Error fetching all open PIF evaluations:", error);
//     return [];
//   }
// }
//
// export async function getOpenPifEvaluationById(evaluationId: number) {
//   const db = await getDb();
//   if (!db) return null;
//   
//   try {
//     const result = await db
//       .select()
//       .from(openPIFEvaluations)
//       .where(eq(openPIFEvaluations.id, evaluationId));
//     
//     if (result.length === 0) return null;
//     
//     const evaluation = result[0];
//     const position = await getPositionById(evaluation.positionId);
//     const categories = await getPositionCategories(evaluation.positionId);
//     
//     return {
//       ...evaluation,
//       positionName: position?.name || "Bilinmiyor",
//       categories,
//     };
//   } catch (error) {
//     console.error("[Database] Error fetching open PIF evaluation:", error);
//     return null;
//   }
// }


// ============= WEEKLY PLANS =============
export async function getWeeklyPlans(userId: number, weekStart?: string) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq((weeklyPlans as any).inspectorId, userId)];
  if (weekStart) {
    conditions.push(eq((weeklyPlans as any).planDate, weekStart));
  }
  
  return await db.select().from(weeklyPlans).where(and(...conditions)).orderBy(desc(weeklyPlans.createdAt));
}

export async function getWeeklyPlanById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(weeklyPlans).where(eq(weeklyPlans.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createWeeklyPlan(data: InsertWeeklyPlan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(weeklyPlans).values(data);
  return result;
}

export async function updateWeeklyPlan(id: number, data: Partial<InsertWeeklyPlan>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(weeklyPlans).set(data).where(eq(weeklyPlans.id, id));
}

export async function deleteWeeklyPlan(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(weeklyPlans).where(eq(weeklyPlans.id, id));
}

// Kritik Sorular (Critical Questions)
export async function getCriticalQuestions() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(criticalQuestions).where(eq(criticalQuestions.isActive, true));
}

export async function getCriticalQuestionById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(criticalQuestions).where(eq(criticalQuestions.id, id)).limit(1);
}

export async function createCriticalQuestion(data: InsertCriticalQuestion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(criticalQuestions).values(data);
  return result;
}

export async function updateCriticalQuestion(id: number, data: Partial<InsertCriticalQuestion>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(criticalQuestions).set(data).where(eq(criticalQuestions.id, id));
}

export async function deleteCriticalQuestion(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(criticalQuestions).where(eq(criticalQuestions.id, id));
}
