import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { kpiTargetCardsDetail } from "../drizzle/schema";
import { eq, and, lt } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

export const alertSystemRouter = router({
  /**
   * Hedef altında kalan KPI'ları getir
   */
  getUnderTargetKPIs: protectedProcedure
    .input(
      z.object({
        period: z.string(),
        threshold: z.number().default(70), // Hedef altı olarak kabul edilen puan
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
            lt(kpiTargetCardsDetail.score, input.threshold.toString())
          )
        );

      return results.map((item: any) => ({
        ...item,
        score: parseFloat(item.score || "0"),
        weightedScore: parseFloat(item.weightedScore || "0"),
        weight: parseFloat(item.weight || "0"),
        targetValue: parseFloat(item.targetValue || "0"),
        actualValue: parseFloat(item.actualValue || "0"),
      }));
    }),

  /**
   * Şube bazlı uyarı özeti
   */
  getBranchAlertSummary: protectedProcedure
    .input(z.object({ period: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const results = await db
        .select()
        .from(kpiTargetCardsDetail)
        .where(eq(kpiTargetCardsDetail.period, input.period));

      // Şubelere göre grupla ve uyarı sayısını hesapla
      const branchAlerts = new Map<
        string,
        { underTarget: number; total: number; branchManager: string }
      >();

      results.forEach((item: any) => {
        const branchName = item.branchName;
        const score = parseFloat(item.score || "0");

        if (!branchAlerts.has(branchName)) {
          branchAlerts.set(branchName, {
            underTarget: 0,
            total: 0,
            branchManager: item.branchManager,
          });
        }

        const alert = branchAlerts.get(branchName)!;
        alert.total += 1;
        if (score < 70) {
          alert.underTarget += 1;
        }
      });

      return Array.from(branchAlerts.entries()).map(([branchName, data]) => ({
        branchName,
        underTargetCount: data.underTarget,
        totalCount: data.total,
        alertPercentage: ((data.underTarget / data.total) * 100).toFixed(2),
        branchManager: data.branchManager,
      }));
    }),

  /**
   * Uyarı gönder - Owner'a bildirim
   */
  sendAlert: protectedProcedure
    .input(
      z.object({
        period: z.string(),
        branchName: z.string(),
        kpiName: z.string(),
        currentScore: z.number(),
        threshold: z.number().default(70),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Admin kontrolü
      if (ctx.user?.role !== "admin") {
        throw new Error("Yalnızca yöneticiler uyarı gönderebilir");
      }

      try {
        const message = `
KPI Performans Uyarısı

Dönem: ${input.period}
Şube: ${input.branchName}
KPI: ${input.kpiName}
Mevcut Puan: ${input.currentScore.toFixed(2)}
Hedef Puan: ${input.threshold}

Bu KPI hedef altında kalmıştır. Lütfen gerekli önlemleri alınız.
        `.trim();

        const result = await notifyOwner({
          title: `KPI Uyarısı: ${input.branchName} - ${input.kpiName}`,
          content: message,
        });

        return {
          success: result,
          message: result
            ? "Uyarı başarıyla gönderildi"
            : "Uyarı gönderilemedi",
        };
      } catch (error: any) {
        throw new Error(`Uyarı gönderme başarısız: ${error.message}`);
      }
    }),

  /**
   * Toplu uyarı gönder - Tüm hedef altı KPI'lar için
   */
  sendBulkAlerts: protectedProcedure
    .input(
      z.object({
        period: z.string(),
        threshold: z.number().default(70),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Admin kontrolü
      if (ctx.user?.role !== "admin") {
        throw new Error("Yalnızca yöneticiler toplu uyarı gönderebilir");
      }

      const db = await getDb();
      if (!db) throw new Error("Veritabanı bağlantısı başarısız");

      try {
        const underTargetKPIs = await db
          .select()
          .from(kpiTargetCardsDetail)
          .where(
            and(
              eq(kpiTargetCardsDetail.period, input.period),
              lt(kpiTargetCardsDetail.score, input.threshold.toString())
            )
          );

        if (underTargetKPIs.length === 0) {
          return {
            success: true,
            sentCount: 0,
            message: "Uyarı gönderilecek KPI bulunamadı",
          };
        }

        // Şubelere göre grupla
        const branchGroups = new Map<string, any[]>();
        underTargetKPIs.forEach((kpi: any) => {
          if (!branchGroups.has(kpi.branchName)) {
            branchGroups.set(kpi.branchName, []);
          }
          branchGroups.get(kpi.branchName)!.push(kpi);
        });

        // Her şube için uyarı gönder
        let sentCount = 0;
        const branchEntries = Array.from(branchGroups.entries());
        for (const [branchName, kpis] of branchEntries) {
          const kpiList = kpis
            .map(
              (k: any) =>
                `- ${k.target}: ${parseFloat(k.score || "0").toFixed(2)} puan`
            )
            .join("\n");

          const message = `
KPI Performans Uyarısı - Toplu Bildirim

Dönem: ${input.period}
Şube: ${branchName}

Hedef Altında Kalan KPI'lar (${kpis.length}):
${kpiList}

Lütfen bu KPI'lar için gerekli önlemleri alınız.
          `.trim();

          const result = await notifyOwner({
            title: `KPI Uyarısı: ${branchName} - ${kpis.length} KPI hedef altında`,
            content: message,
          });

          if (result) sentCount++;
        }

        return {
          success: true,
          sentCount,
          totalAlerts: underTargetKPIs.length,
          message: `${sentCount} şube için uyarı gönderildi`,
        };
      } catch (error: any) {
        throw new Error(`Toplu uyarı gönderme başarısız: ${error.message}`);
      }
    }),
});
