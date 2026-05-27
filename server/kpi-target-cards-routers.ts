import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { kpiTargetCardsDetail, branches } from "../drizzle/schema";
import { eq, and, like } from "drizzle-orm";

export const kpiTargetCardsRouter = router({
  /**
   * Tüm bölge müdürlerini listele
   */
  getBranchManagers: protectedProcedure
    .input(
      z.object({
        period: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions: any[] = [];

      // Rol bazı filtreleme
      if ((ctx.user?.role === "user" || ctx.user?.role === "branch_manager") && ctx.user?.branchId) {
        // Şube yöneticileri sadece kendi şubelerinin verilerini görebilir
        try {
          const branchesData = await (db as any).query.branches.findMany();
          const userBranch = branchesData.find((b: any) => b.id === ctx.user.branchId);
          if (userBranch) {
            conditions.push(eq(kpiTargetCardsDetail.branchName, userBranch.name));
          }
        } catch (error) {
          console.warn("Branches table not found for role-based filtering");
        }
      }

      if (input.period) {
        conditions.push(eq(kpiTargetCardsDetail.period, input.period));
      }

      let query = db
        .selectDistinct({
          branchManager: kpiTargetCardsDetail.branchManager,
        })
        .from(kpiTargetCardsDetail) as any;

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query;
      return results
        .filter((r: any) => r.branchManager)
        .map((r: any) => r.branchManager)
        .sort();
    }),
  /**
   * Tüm KPI hedef kartlarını listele (filtreleme ile)
   */
  list: protectedProcedure
    .input(
      z.object({
        period: z.string().optional(),
        branchManager: z.string().optional(),
        dimension: z.string().optional(),
        branchName: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      // Tüm filtreleme koşullarını array'de topla
      const conditions: any[] = [];

      // Rol bazı filtreleme
      if ((ctx.user?.role === "user" || ctx.user?.role === "branch_manager") && ctx.user?.branchId) {
        // Şube yöneticileri sadece kendi şubelerinin verilerini görebilir
        // branchId'den şube adını bul
        try {
          const branchesData = await (db as any).query.branches.findMany();
          const userBranch = branchesData.find((b: any) => b.id === ctx.user.branchId);
          if (userBranch) {
            conditions.push(eq(kpiTargetCardsDetail.branchName, userBranch.name));
          }
        } catch (error) {
          // Branches tablosu yoksa, filtreleme yapma
          console.warn("Branches table not found for role-based filtering");
        }
      }

      if (input.period) {
        conditions.push(eq(kpiTargetCardsDetail.period, input.period));
      }

      if (input.branchManager) {
        conditions.push(eq(kpiTargetCardsDetail.branchManager, input.branchManager));
      }

      if (input.dimension) {
        conditions.push(eq(kpiTargetCardsDetail.dimension, input.dimension));
      }

      if (input.branchName) {
        conditions.push(eq(kpiTargetCardsDetail.branchName, input.branchName));
      }

      // Tüm koşulları AND ile birleştir
      let query = db.select().from(kpiTargetCardsDetail) as any;
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query;
      return results;
    }),

  /**
   * Benzersiz dönemleri getir
   */
  getPeriods: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const results = await db
      .selectDistinct({ period: kpiTargetCardsDetail.period })
      .from(kpiTargetCardsDetail);

    return results.map((r) => r.period).sort().reverse();
  }),

  /**
   * Benzersiz şubeleri getir
   */
  getBranches: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const results = await db
      .selectDistinct({ branchName: kpiTargetCardsDetail.branchName })
      .from(kpiTargetCardsDetail);

    return results.sort((a, b) => a.branchName.localeCompare(b.branchName));
  }),



  /**
   * Benzersiz boyutları getir
   */
  getDimensions: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const results = await db
      .selectDistinct({ dimension: kpiTargetCardsDetail.dimension })
      .from(kpiTargetCardsDetail);

    return results
      .map((r) => r.dimension)
      .filter((d) => d)
      .sort();
  }),

  /**
   * Bölge müdürüne göre şubeleri getir
   */
  getBranchesByManager: protectedProcedure
    .input(
      z.object({
        branchManager: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const results = await db
        .selectDistinct({ branchName: kpiTargetCardsDetail.branchName })
        .from(kpiTargetCardsDetail)
        .where(eq(kpiTargetCardsDetail.branchManager, input.branchManager));

      return results.map((r) => ({
        id: r.branchName,
        name: r.branchName,
      }));
    }),

  /**
   * KPI hedef kartı güncelle
   */
  updateActualValue: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        actualValue: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Admin ve Operasyon Müdürü kontrolü
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "operations_manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sadece yönetici ve operasyon müdürü bu işlemi yapabilir" });
      }

      // Hedef kartını getir
      const targetCard = await db
        .select()
        .from(kpiTargetCardsDetail)
        .where(eq(kpiTargetCardsDetail.id, input.id))
        .limit(1);

      if (!targetCard || targetCard.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Hedef kartı bulunamadı" });
      }

      const card = targetCard[0];
      const actualValue = parseFloat(input.actualValue) || 0;
      const lowerLimit = parseFloat(card.lowerLimit as any) || 0;
      const targetValue = parseFloat(card.targetValue as any) || 0;
      const upperLimit = parseFloat(card.upperLimit as any) || 0;

      console.log("[updateActualValue] Input:", { id: input.id, actualValue });
      console.log("[updateActualValue] Card limits:", { lowerLimit, targetValue, upperLimit, weight: card.weight });

      // Puan hesapla
      let score = 0;
      if (actualValue < lowerLimit) {
        score = 0;
      } else if (actualValue >= lowerLimit && actualValue < targetValue) {
        // 80P ile 100P arasında doğrusal interpolasyon
        score = 80 + ((actualValue - lowerLimit) / (targetValue - lowerLimit)) * 20;
      } else if (actualValue >= targetValue && actualValue < upperLimit) {
        // 100P ile 120P arasında doğrusal interpolasyon
        score = 100 + ((actualValue - targetValue) / (upperLimit - targetValue)) * 20;
      } else {
        score = 120;
      }

      // Ağırlıklı puan hesapla
      const weight = parseInt((card.weight as any) || '0') || 0;
      const weightedScore = (score * weight) / 100;

      // Güncelleme yap
      const result = await (db as any)
        .update(kpiTargetCardsDetail)
        .set({
          actualValue: input.actualValue,
          score: score.toFixed(2),
          weightedScore: weightedScore.toFixed(2),
        })
        .where(eq(kpiTargetCardsDetail.id, input.id));

      return result;
    }),

  /**
   * İstatistik bilgilerini getir
   */
  getStatistics: protectedProcedure
    .input(
      z.object({
        period: z.string(),
        branchManager: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      const conditions: any[] = [eq(kpiTargetCardsDetail.period, input.period)];

      // Şube yöneticisi: sadece kendi şubesinin verilerini görebilir
      if (ctx.user?.role === "user" && ctx.user?.branchId) {
        try {
          const branchesData = await (db as any).query.branches.findMany();
          const userBranch = branchesData.find((b: any) => b.id === ctx.user.branchId);
          if (userBranch) {
            conditions.push(eq(kpiTargetCardsDetail.branchName, userBranch.name));
          }
        } catch (error) {
          console.warn("Branches table not found for role-based filtering");
        }
      }

      if (input.branchManager) {
        conditions.push(eq(kpiTargetCardsDetail.branchManager, input.branchManager));
      }

      let query = db.select().from(kpiTargetCardsDetail) as any;
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query;

      // İstatistikleri hesapla
      const totalTargets = results.length;
      const dimensionBreakdown = {
        finans: results.filter((r: any) => r.dimension === "Finans").length,
        musteri: results.filter((r: any) => r.dimension === "Müşteri").length,
        insan: results.filter((r: any) => r.dimension === "İnsan").length,
      };

      return {
        totalTargets,
        dimensionBreakdown,
      };
    }),

  /**
   * Şube istatistiklerini getir
   */
  getBranchStatistics: protectedProcedure
    .input(
      z.object({
        period: z.string(),
        branchName: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      // Şube yöneticisi: sadece kendi şubesinin verilerini görebilir
      if ((ctx.user?.role === "user" || ctx.user?.role === "branch_manager") && ctx.user?.branchId) {
        try {
          const branchesData = await (db as any).query.branches.findMany();
          const userBranch = branchesData.find((b: any) => b.id === ctx.user.branchId);
          if (userBranch && userBranch.name !== input.branchName) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Sadece kendi şubenizin verilerini görebilirsiniz",
            });
          }
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.warn("Branches table not found for role-based filtering");
        }
      }

      const results = await db
        .select()
        .from(kpiTargetCardsDetail)
        .where(
          and(
            eq(kpiTargetCardsDetail.period, input.period),
            eq(kpiTargetCardsDetail.branchName, input.branchName)
          )
        );

      if (results.length === 0) {
        return {
          kpiCount: 0,
          targetScore: 0,
          finalScore: 0,
        };
      }

      const kpiCount = results.length;
      const targetScore = results.reduce((sum: number, r: any) => {
        const score = parseFloat(r.weightedScore || "0");
        return sum + (isNaN(score) ? 0 : score);
      }, 0);

      const finalScore = targetScore > 0 ? (targetScore / 120) * 100 : 0;

      return {
        kpiCount,
        targetScore: targetScore.toFixed(2),
        finalScore: finalScore.toFixed(2),
      };
    }),

  /**
   * Şubenin hedef kartlarını getir
   */
  getBranchTargets: protectedProcedure
    .input(
      z.object({
        period: z.string(),
        branchName: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const results = await db
        .select()
        .from(kpiTargetCardsDetail)
        .where(
          and(
            eq(kpiTargetCardsDetail.period, input.period),
            eq(kpiTargetCardsDetail.branchName, input.branchName)
          )
        );

      return results;
    }),

  /**
   * Bölge müdürünün hedef kartlarını getir
   */
  getManagerTargets: protectedProcedure
    .input(
      z.object({
        period: z.string(),
        branchManager: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const results = await db
        .select()
        .from(kpiTargetCardsDetail)
        .where(
          and(
            eq(kpiTargetCardsDetail.period, input.period),
            eq(kpiTargetCardsDetail.branchManager, input.branchManager)
          )
        );

      return results;
    }),

  /**
   * Toplu ekle
   */
  bulkInsert: protectedProcedure
    .input(
      z.array(
        z.object({
          period: z.string(),
          branchName: z.string(),
          branchManager: z.string().optional(),
          dimension: z.string().optional(),
          target: z.string().optional(),
        })
      )
    )
    .mutation(async ({ input, ctx }) => {
      // Admin kontrolü
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sadece yönetici bu işlemi yapabilir" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Toplu ekleme yapılacak
      return { success: true, count: input.length };
    }),

  /**
   * Dashboard Özeti - Seçili dönem ve şubeye göre gerçek performans verilerini getir
   */
  getDashboardSummary: protectedProcedure
    .input(
      z.object({
        period: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      const conditions: any[] = [eq(kpiTargetCardsDetail.period, input.period)];

      // Şube yöneticisi: sadece kendi şubesinin verilerini görebilir
      if ((ctx.user?.role === "user" || ctx.user?.role === "branch_manager") && ctx.user?.branchId) {
        try {
          const branchesData = await (db as any).query.branches.findMany();
          const userBranch = branchesData.find((b: any) => b.id === ctx.user.branchId);
          if (userBranch) {
            conditions.push(eq(kpiTargetCardsDetail.branchName, userBranch.name));
          }
        } catch (error) {
          console.warn("Branches table not found for role-based filtering");
        }
      }
      // Bölge sorumlusu: sadece kendi bölgesinin verilerini görebilir
      else if (ctx.user?.role === "region_manager" && ctx.user?.name) {
        conditions.push(eq(kpiTargetCardsDetail.bolgeSorumlusu, ctx.user.name));
      }
      // Admin: tüm verileri görebilir (filtreleme yok)

      let query = db.select().from(kpiTargetCardsDetail) as any;
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query;

      if (results.length === 0) {
        return {
          averagePerformance: 0,
          financialPerformance: 0,
          customerPerformance: 0,
          hrPerformance: 0,
          dimensionBreakdown: {
            finans: 0,
            musteri: 0,
            insan: 0,
          },
          totalTargets: 0,
          kpiCount: 0,
        };
      }

      // Boyut bazında puanları hesapla
      const dimensionScores: { [key: string]: { scores: number[]; count: number } } = {};
      let totalWeightedScore = 0;
      let totalWeight = 0;

      results.forEach((r: any) => {
        const dimension = r.dimension || "Diğer";
        const score = parseFloat(r.score || "0") || 0;
        const weight = parseFloat(r.weight || "0") || 0;
        const weightedScore = parseFloat(r.weightedScore || "0") || 0;

        if (!dimensionScores[dimension]) {
          dimensionScores[dimension] = { scores: [], count: 0 };
        }

        if (score > 0) {
          dimensionScores[dimension].scores.push(score);
          dimensionScores[dimension].count++;
        }

        totalWeightedScore += weightedScore;
        totalWeight += weight;
      });

      // Her boyut için ortalama puanı hesapla
      const dimensionAverages: { [key: string]: number } = {};
      Object.keys(dimensionScores).forEach((dimension) => {
        const scores = dimensionScores[dimension].scores;
        if (scores.length > 0) {
          dimensionAverages[dimension] = scores.reduce((a, b) => a + b, 0) / scores.length;
        } else {
          dimensionAverages[dimension] = 0;
        }
      });

      // Genel ortalama performans
      const allScores = results
        .map((r: any) => parseFloat(r.score || "0") || 0)
        .filter((s: number) => s > 0);
      const averagePerformance = allScores.length > 0 ? allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length : 0;

      return {
        averagePerformance: Math.round(averagePerformance),
        financialPerformance: Math.round(dimensionAverages["Finans"] || 0),
        customerPerformance: Math.round(dimensionAverages["Müşteri"] || 0),
        hrPerformance: Math.round(dimensionAverages["İnsan"] || 0),
        dimensionBreakdown: {
          finans: Math.round(dimensionAverages["Finans"] || 0),
          musteri: Math.round(dimensionAverages["Müşteri"] || 0),
          insan: Math.round(dimensionAverages["İnsan"] || 0),
        },
        totalTargets: results.length,
        kpiCount: results.length,
        totalWeightedScore: Math.round(totalWeightedScore),
        totalWeight: Math.round(totalWeight),
      };
    }),

  /**
   * Dönem ve şubeye göre sil
   */
  deleteByPeriodAndBranch: protectedProcedure
    .input(
      z.object({
        period: z.string(),
        branchName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Admin kontrolü
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sadece yönetici bu işlemi yapabilir" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Silme işlemi yapılacak
      return { success: true };
    }),
});
