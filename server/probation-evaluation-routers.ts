import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { probationEvaluations, users } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";

/**
 * Deneme Süresi Değerlendirme Router
 * 1,5 ay ve 5,5 ay değerlendirme formlarını yönetir
 */
export const probationEvaluationRouter = router({
  /**
   * Yeni deneme süresi değerlendirmesi kaydet (create alias)
   */
  create: protectedProcedure
    .input(
      z.object({
        employeeTCNumber: z.string().length(11),
        employeeName: z.string(),
        branchName: z.string(),
        department: z.string().optional(),
        hireDate: z.string().optional(),
        evaluationPeriod: z.enum(["1.5_months", "5.5_months"]),
        evaluationDate: z.string(),
        criteria: z.array(z.number()),
        competencies: z.array(z.number()),
        continueEmployment: z.boolean(),
        continueEmploymentReason: z.string().optional(),
        managerOpinion: z.string().optional(),

      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
        // Mevcut değerlendirmeyi kontrol et (TC No benzersiz)
        const existing = await db
          .select()
          .from(probationEvaluations)
          .where(eq(probationEvaluations.employeeTCNumber, input.employeeTCNumber))
          .limit(1);

        // Başarı yüdesi hesapla
        const allScores = [...input.criteria, ...input.competencies].filter((s) => s > 0);
        const avgScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
        const successPercentage = Math.round((avgScore / 5) * 100);

        const evaluationData: any = {
          employeeTCNumber: input.employeeTCNumber,
          employeeName: input.employeeName,
          branchName: input.branchName,
          department: input.department,
          hireDate: input.hireDate,
          evaluationPeriod: input.evaluationPeriod,
          evaluationDate: input.evaluationDate,
          successPercentage,
          continueEmployment: input.continueEmployment,
          continueEmploymentReason: input.continueEmploymentReason,
          managerOpinion: input.managerOpinion,

          evaluatedBy: ctx.user?.name,
          createdByUserId: String(ctx.user?.id || ""),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Puanları sakla
        input.criteria.forEach((score, index) => {
          evaluationData[`criteria${index + 1}`] = score;
        });
        input.competencies.forEach((score, index) => {
          evaluationData[`competency${index + 1}`] = score;
        });

        if (existing.length > 0) {
          // Güncelle
          await db
            .update(probationEvaluations)
            .set(evaluationData)
            .where(eq(probationEvaluations.employeeTCNumber, input.employeeTCNumber));
        } else {
          // Yeni kayıt oluştur
          await db.insert(probationEvaluations).values(evaluationData);
        }

        // Bildirim gönder
        try {
          await notifyOwner({
            title: `Deneme Süresi Değerlendirmesi - ${input.employeeName}`,
            content: `<h2>Deneme Süresi Değerlendirmesi Tamamlandı</h2>
              <p><strong>Personel Adı:</strong> ${input.employeeName}</p>
              <p><strong>Şube:</strong> ${input.branchName}</p>
              <p><strong>Değerlendirme Dönemi:</strong> ${input.evaluationPeriod === "1.5_months" ? "1,5 Ay" : "5,5 Ay"}</p>
              <p><strong>Başarı Yüdesi:</strong> %${successPercentage}</p>
              <p><strong>Devam Kararı:</strong> ${input.continueEmployment ? "Evet" : "Hayır"}</p>`,
          });
        } catch (error) {
          console.error("[Notification] Failed:", error);
        }

        return {
          success: true,
          message: existing.length > 0 ? "Değerlendirme güncellenedi" : "Değerlendirme kaydedildi",
          canContinue: successPercentage >= 55,
        };
      } catch (error) {
        console.error("[Probation Evaluation Create] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Değerlendirme kaydedilirken hata oluştu",
        });
      }
    }),

  /**
   * Yeni deneme süresi değerlendirmesi kaydet
   */
  save: protectedProcedure
    .input(
      z.object({
        employeeTCNumber: z.string().length(11), // TC Numarası (11 haneli)
        employeeName: z.string(),
        branch: z.string(),
        department: z.string().optional(),
        hireDate: z.string().optional(),
        evaluationType: z.enum(["1.5_months", "5.5_months"]),
        evaluationMonth: z.string(), // 2026/3 gibi
        scores: z.record(z.string(), z.number()), // 15 kriter + 5 yetkinlik puanları
        successPercentage: z.number().min(0).max(100),
        continueEmployment: z.boolean(),

        evaluatedBy: z.string().optional(),
        evaluatedBySecond: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Yalnızca admin, branch_manager ve region_manager kaydedebilir
      if (!["admin", "branch_manager", "region_manager"].includes(ctx.user?.role || "")) {
        throw new Error("Unauthorized");
      }

      try {
        // Mevcut değerlendirmeyi kontrol et (TC No benzersiz)
        const existing = await db
          .select()
          .from(probationEvaluations)
          .where(eq(probationEvaluations.employeeTCNumber, input.employeeTCNumber))
          .limit(1);

        let result;

        if (existing.length > 0) {
          // Güncelle
          const updateData: any = {
            employeeName: input.employeeName,
            branchName: input.branch,
            department: input.department,
            hireDate: input.hireDate,
            evaluationPeriod: input.evaluationType,
            evaluationDate: input.evaluationMonth,
            successPercentage: input.successPercentage,
            continueEmployment: input.continueEmployment,
  
            evaluatedBy: input.evaluatedBy || ctx.user?.name,
            evaluatedBySecond: input.evaluatedBySecond,
            updatedAt: new Date(),
          };
          
          // scores'ı individual alanlarına dönüştür
          Object.entries(input.scores).forEach(([key, value]) => {
            updateData[key + 'Score'] = value;
          });
          
          result = await db
            .update(probationEvaluations)
            .set(updateData)
            .where(eq(probationEvaluations.employeeTCNumber, input.employeeTCNumber));
        } else {
          // Yeni kayıt oluştur
          const insertData: any = {
            employeeTCNumber: input.employeeTCNumber,
            employeeName: input.employeeName,
            branchName: input.branch,
            department: input.department || undefined,
            hireDate: input.hireDate || undefined,
            evaluationPeriod: input.evaluationType,
            evaluationDate: input.evaluationMonth,
            successPercentage: input.successPercentage,
            continueEmployment: input.continueEmployment,

            evaluatedBy: input.evaluatedBy || ctx.user?.name || undefined,
            evaluatedBySecond: input.evaluatedBySecond || undefined,
            createdByUserId: String(ctx.user?.id || ""),
          };
          
          // scores'ı individual alanlarına dönüştür
          Object.entries(input.scores).forEach(([key, value]) => {
            insertData[key + 'Score'] = value;
          });
          
          result = await db.insert(probationEvaluations).values(insertData);
        }

        // Email bildirimi gönder
        const emailContent = `
          <h2>Deneme Süresi Değerlendirmesi Tamamlandı</h2>
          <p><strong>Personel Adı:</strong> ${input.employeeName}</p>
          <p><strong>Şube:</strong> ${input.branch}</p>
          <p><strong>Değerlendirme Dönemi:</strong> ${input.evaluationType === "1.5_months" ? "1,5 Ay" : "5,5 Ay"}</p>
          <p><strong>Başarı Yüzdesi:</strong> %${input.successPercentage}</p>
          <p><strong>Devam Kararı:</strong> ${input.continueEmployment ? "Evet - Görevine Devam Edebilir" : "Hayır - Görevine Devam Edemez"}</p>
          <p><strong>Değerlendiren:</strong> ${input.evaluatedBy || ctx.user?.name || "Bilinmiyor"}</p>

        `;

        // Sahibine ve İK'ya bildirim gönder
        try {
          await notifyOwner({
            title: `Deneme Süresi Değerlendirmesi - ${input.employeeName}`,
            content: emailContent,
          });
        } catch (error) {
          console.error("[Email Notification] Failed to send notification:", error);
        }

        return {
          success: true,
          message: existing.length > 0 ? "Değerlendirme güncellendi" : "Değerlendirme kaydedildi",
          canContinue: input.successPercentage >= 55,
        };
      } catch (error) {
        console.error("[Probation Evaluation Save] Error:", error);
        throw new Error("Değerlendirme kaydedilirken hata oluştu");
      }
    }),

  /**
   * Değerlendirmeyi getir (TC No ile)
   */
  getByTCNumber: protectedProcedure
    .input(z.object({ tcNumber: z.string().length(11) }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      const evaluation = await db
        .select()
        .from(probationEvaluations)
        .where(eq(probationEvaluations.employeeTCNumber, input.tcNumber))
        .limit(1);

      return evaluation.length > 0 ? evaluation[0] : null;
    }),

  /**
   * Personel için tüm değerlendirmeleri listele (geçmiş karşılaştırma için)
   */
  listByTCNumber: protectedProcedure
    .input(z.object({ tcNumber: z.string().length(11) }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const evaluations = await db
        .select()
        .from(probationEvaluations)
        .where(eq(probationEvaluations.employeeTCNumber, input.tcNumber))
        .orderBy(desc(probationEvaluations.createdAt));

      return evaluations;
    }),

  /**
   * Şube için tüm değerlendirmeleri listele (rol bazlı filtreleme)
   */
  listByBranch: protectedProcedure
    .input(
      z.object({
        branch: z.string().optional(),
        evaluationType: z.enum(["1.5_months", "5.5_months"]).optional(),
        evaluationMonth: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions: any[] = [];

      // Rol bazlı filtreleme - kritik güvenlik kontrolü
      if (ctx.user?.role === "branch_manager") {
        // Şube müdürü sadece kendi şubesini görebilir
        if (ctx.user?.branchName) {
          conditions.push(eq(probationEvaluations.branchName, ctx.user.branchName));
        }
      } else if (ctx.user?.role === "region_manager") {
        // Bölge müdürü - şimdilik admin gibi davranış (ileriye dönük uyumlu)
        // TODO: Bölge bilgisi eklendikten sonra filtreleme yap
      } else if (ctx.user?.role !== "admin") {
        // Bilinmeyen rol - erişim reddedildi
        return [];
      }
      // Admin: hiçbir filtreleme yok, tüm verileri görebilir

      // Admin tarafından seçilen şube filtresi
      if (input.branch && ctx.user?.role === "admin") {
        conditions.push(eq(probationEvaluations.branchName, input.branch));
      }

      // Değerlendirme türü filtresi
      if (input.evaluationType) {
        conditions.push(eq(probationEvaluations.evaluationPeriod, input.evaluationType));
      }

      // Değerlendirme ayı filtresi
      if (input.evaluationMonth) {
        conditions.push(eq(probationEvaluations.evaluationDate, input.evaluationMonth));
      }

      let query = db.select().from(probationEvaluations) as any;
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const evaluations = await query.orderBy(desc(probationEvaluations.createdAt));
      return evaluations;
    }),

  /**
   * Değerlendirmeyi sil
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Yalnızca admin silebilir
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }

      await db
        .delete(probationEvaluations)
        .where(eq(probationEvaluations.id, input.id));

      return { success: true, message: "Değerlendirme silindi" };
    }),

  /**
   * Mail gönderilmesi gereken değerlendirmeleri getir
   * 45. gün, 165. gün ve 180. günde mail gönderilecek
   */
  getMailSchedule: protectedProcedure
    .input(
      z.object({
        branch: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      // Yalnızca admin ve şube müdürü görebilir
      if (!["admin", "branch_manager", "region_manager"].includes(ctx.user?.role || "")) {
        return [];
      }

      const conditions: any[] = [];

      // Rol bazlı filtreleme
      if (ctx.user?.role === "branch_manager" && ctx.user?.branchName) {
        conditions.push(eq(probationEvaluations.branchName, ctx.user.branchName));
      } else if (input.branch && ctx.user?.role === "admin") {
        conditions.push(eq(probationEvaluations.branchName, input.branch));
      }

      let query = db.select().from(probationEvaluations) as any;
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const evaluations = await query.orderBy(desc(probationEvaluations.createdAt));

      // Gün farkını hesapla ve mail gönderilmesi gereken değerlendirmeleri filtrele
      const now = new Date();
      const mailSchedule = evaluations
        .map((evaluation: any) => {
          const hireDate = new Date(evaluation.hireDate);
          const daysDiff = Math.floor((now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24));
          const daysUntilMail = daysDiff % 180; // 180 gün döngüsü
          const nextMailDay = daysDiff < 45 ? 45 : daysDiff < 165 ? 165 : 180;
          const daysUntilNextMail = nextMailDay - daysDiff;

          return {
            ...evaluation,
            daysSinceHire: daysDiff,
            nextMailDay,
            daysUntilNextMail,
            shouldSendMail: [45, 165, 180].includes(nextMailDay),
          };
        })
        .filter((item: any) => item.daysUntilNextMail <= 1 && item.daysUntilNextMail >= 0);

      return mailSchedule;
    }),

  /**
   * Deneme süresi mail gönder
   */
  sendProbationEmails: protectedProcedure
    .input(
      z.object({
        evaluationIds: z.array(z.number()),
        mailType: z.enum(["45days", "165days", "180days"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Yalnızca admin gönderebilir
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
        const evals = await db
          .select()
          .from(probationEvaluations)
          .where(eq(probationEvaluations.id, input.evaluationIds[0]));

        if (evals.length === 0) {
          throw new Error("Değerlendirme bulunamadı");
        }

        const evaluation = evals[0];
        const mailTypeText =
          input.mailType === "45days"
            ? "1,5 Ay Değerlendirmesi"
            : input.mailType === "165days"
              ? "5,5 Ay Değerlendirmesi"
              : "180 Gün Deneme Süresi Sonu";

        const emailContent = `
          <h2>Deneme Süresi Hatırlatıcısı</h2>
          <p><strong>Personel Adı:</strong> ${evaluation.employeeName}</p>
          <p><strong>T.C. Numarası:</strong> ${evaluation.employeeTCNumber}</p>
          <p><strong>Şube:</strong> ${evaluation.branchName}</p>
          <p><strong>Mail Tipi:</strong> ${mailTypeText}</p>
          <p><strong>İşe Giriş Tarihi:</strong> ${evaluation.hireDate}</p>
          <p>Lütfen deneme süresi değerlendirmesini yapınız.</p>
        `;

        // Sahibine ve İK'ya bildirim gönder
        try {
          await notifyOwner({
            title: `Deneme Süresi Hatırlatıcısı - ${mailTypeText} - ${evaluation.employeeName}`,
            content: emailContent,
          });
        } catch (error) {
          console.error("[Probation Email] Failed to send notification:", error);
        }

        return {
          success: true,
          message: `${evaluation.employeeName} için ${mailTypeText} maili gönderildi`,
          sentCount: input.evaluationIds.length,
        };
      } catch (error) {
        console.error("[Probation Email Send] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Mail gönderilirken hata oluştu",
        });
      }
    }),
});
