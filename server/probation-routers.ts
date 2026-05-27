import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { probationEvaluations } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendProbationReminders, checkPendingEvaluations } from "./probation-notifications";

// Probation Evaluation Router
export const probationEvaluationRouter = router({
  // Hatırlatıcı bildirimlerini kontrol et
  checkReminders: publicProcedure
    .query(async () => {
      await sendProbationReminders();
      return { success: true };
    }),

  // Bekleyen değerlendirmeleri kontrol et
  checkPending: publicProcedure
    .query(async () => {
      await checkPendingEvaluations();
      return { success: true };
    }),

  // Yeni değerlendirme oluştur
  create: protectedProcedure
    .input(
      z.object({
        employeeTCNumber: z.string().min(11).max(11),
        employeeName: z.string().min(1),
        branchId: z.number().optional(),
        branchName: z.string().min(1),
        department: z.string().optional(),
        hireDate: z.string().optional(),
        evaluationPeriod: z.enum(["1.5_months", "5.5_months"]),
        evaluationDate: z.string(),
        
        // 15 Değerlendirme Kriteri
        criteria1Score: z.number().min(1).max(5).optional(),
        criteria2Score: z.number().min(1).max(5).optional(),
        criteria3Score: z.number().min(1).max(5).optional(),
        criteria4Score: z.number().min(1).max(5).optional(),
        criteria5Score: z.number().min(1).max(5).optional(),
        criteria6Score: z.number().min(1).max(5).optional(),
        criteria7Score: z.number().min(1).max(5).optional(),
        criteria8Score: z.number().min(1).max(5).optional(),
        criteria9Score: z.number().min(1).max(5).optional(),
        criteria10Score: z.number().min(1).max(5).optional(),
        criteria11Score: z.number().min(1).max(5).optional(),
        criteria12Score: z.number().min(1).max(5).optional(),
        criteria13Score: z.number().min(1).max(5).optional(),
        criteria14Score: z.number().min(1).max(5).optional(),
        criteria15Score: z.number().min(1).max(5).optional(),
        
        // 4 Temel Yetkinlik
        competency1Score: z.number().min(1).max(5).optional(),
        competency2Score: z.number().min(1).max(5).optional(),
        competency3Score: z.number().min(1).max(5).optional(),
        competency4Score: z.number().min(1).max(5).optional(),
        
        // Hesaplanan puanlar
        totalScore: z.number().optional(),
        successPercentage: z.number().optional(),
        evaluationScale: z.string().optional(),
        
        // Karar ve görüşler
        continueEmployment: z.boolean().optional(),
        continueEmploymentReason: z.string().optional(),
        managerOpinion: z.string().optional(),
        overallComments: z.string().optional(),
        
        // İmzalar ve tarihler
        evaluatedBy: z.string().optional(),
        evaluatedByDate: z.string().optional(),
        evaluatedBySecond: z.string().optional(),
        evaluatedBySecondDate: z.string().optional(),
        hrReviewedBy: z.string().optional(),
        hrReviewedByDate: z.string().optional(),
        
        // PDF
        pdfUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      try {
        // Hesaplamaları yap
        const scores = [
          input.criteria1Score,
          input.criteria2Score,
          input.criteria3Score,
          input.criteria4Score,
          input.criteria5Score,
          input.criteria6Score,
          input.criteria7Score,
          input.criteria8Score,
          input.criteria9Score,
          input.criteria10Score,
          input.criteria11Score,
          input.criteria12Score,
          input.criteria13Score,
          input.criteria14Score,
          input.criteria15Score,
          input.competency1Score,
          input.competency2Score,
          input.competency3Score,
          input.competency4Score,
        ].filter((score) => score !== undefined && score !== null) as number[];

        const totalScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const successPercentage = scores.length > 0 ? Math.round((totalScore / 5) * 100) : 0;

        // Değerlendirme skalasını belirle
        let evaluationScale = "Yetersiz";
        if (successPercentage >= 85) evaluationScale = "Çok İyi";
        else if (successPercentage >= 70) evaluationScale = "İyi";
        else if (successPercentage >= 50) evaluationScale = "Beklenen";
        else if (successPercentage >= 30) evaluationScale = "Gelişime Açık";

        // Veritabanına kaydet
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const result = await db
          .insert(probationEvaluations)
          .values({
            employeeTCNumber: input.employeeTCNumber,
            employeeName: input.employeeName,
            branchId: input.branchId,
            branchName: input.branchName,
            department: input.department,
            hireDate: input.hireDate,
            evaluationPeriod: input.evaluationPeriod,
            evaluationDate: input.evaluationDate,
            
            criteria1Score: input.criteria1Score,
            criteria2Score: input.criteria2Score,
            criteria3Score: input.criteria3Score,
            criteria4Score: input.criteria4Score,
            criteria5Score: input.criteria5Score,
            criteria6Score: input.criteria6Score,
            criteria7Score: input.criteria7Score,
            criteria8Score: input.criteria8Score,
            criteria9Score: input.criteria9Score,
            criteria10Score: input.criteria10Score,
            criteria11Score: input.criteria11Score,
            criteria12Score: input.criteria12Score,
            criteria13Score: input.criteria13Score,
            criteria14Score: input.criteria14Score,
            criteria15Score: input.criteria15Score,
            
            competency1Score: input.competency1Score,
            competency2Score: input.competency2Score,
            competency3Score: input.competency3Score,
            competency4Score: input.competency4Score,
            
            totalScore,
            successPercentage: successPercentage as any,
            evaluationScale,
            
            continueEmployment: input.continueEmployment,
            continueEmploymentReason: input.continueEmploymentReason,
            managerOpinion: input.managerOpinion,
            overallComments: input.overallComments,
            
            evaluatedBy: input.evaluatedBy,
            evaluatedByDate: input.evaluatedByDate,
            evaluatedBySecond: input.evaluatedBySecond,
            evaluatedBySecondDate: input.evaluatedBySecondDate,
            hrReviewedBy: input.hrReviewedBy,
            hrReviewedByDate: input.hrReviewedByDate,
            
            pdfUrl: input.pdfUrl,
            createdByUserId: ctx.user?.id?.toString(),
          });

        return { success: true, id: 1 };
      } catch (error) {
        console.error("[probation] create error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Değerlendirme kaydedilemedi",
        });
      }
    }),

  // Değerlendirmeleri listele
  list: protectedProcedure
    .input(
      z.object({
        branchId: z.number().optional(),
        employeeTCNumber: z.string().optional(),
        evaluationPeriod: z.enum(["1.5_months", "5.5_months"]).optional(),
      })
    )
    .query(async ({ input }: any) => {
      try {
        const conditions = [];

        if (input.branchId) {
          conditions.push(eq(probationEvaluations.branchId, input.branchId));
        }

        if (input.employeeTCNumber) {
          conditions.push(eq(probationEvaluations.employeeTCNumber, input.employeeTCNumber));
        }

        if (input.evaluationPeriod) {
          conditions.push(eq(probationEvaluations.evaluationPeriod, input.evaluationPeriod));
        }

        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const query = conditions.length > 0 ? db.select().from(probationEvaluations).where(and(...conditions)) : db.select().from(probationEvaluations);

        const evaluations = await query.orderBy(desc(probationEvaluations.evaluationDate));

        return evaluations || [];
      } catch (error) {
        console.error("[probation] list error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Değerlendirmeler listelenemedi",
        });
      }
    }),

  // Tek bir değerlendirmeyi getir
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }: any) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const evaluation = await db
          .select()
          .from(probationEvaluations)
          .where(eq(probationEvaluations.id, input.id))
          .limit(1);

        return evaluation?.[0] || null;
      } catch (error) {
        console.error("[probation] getById error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Değerlendirme bulunamadı",
        });
      }
    }),

  // Değerlendirmeyi güncelle
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        pdfUrl: z.string().optional(),
        evaluatedBy: z.string().optional(),
        evaluatedByDate: z.string().optional(),
        evaluatedBySecond: z.string().optional(),
        evaluatedBySecondDate: z.string().optional(),
        hrReviewedBy: z.string().optional(),
        hrReviewedByDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db
          .update(probationEvaluations)
          .set({
            pdfUrl: input.pdfUrl,
            evaluatedBy: input.evaluatedBy,
            evaluatedByDate: input.evaluatedByDate,
            evaluatedBySecond: input.evaluatedBySecond,
            evaluatedBySecondDate: input.evaluatedBySecondDate,
            hrReviewedBy: input.hrReviewedBy,
            hrReviewedByDate: input.hrReviewedByDate,
          })
          .where(eq(probationEvaluations.id, input.id));

        return { success: true };
      } catch (error) {
        console.error("[probation] update error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Değerlendirme güncellenemedi",
        });
      }
    }),

  // Geçmiş değerlendirmeleri getir
  getPreviousEvaluations: protectedProcedure
    .input(z.object({ employeeTCNumber: z.string() }))
    .query(async ({ input }: any) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const evaluations = await db
          .select()
          .from(probationEvaluations)
          .where(eq(probationEvaluations.employeeTCNumber, input.employeeTCNumber))
          .orderBy(desc(probationEvaluations.evaluationDate));

        return evaluations || [];
      } catch (error) {
        console.error("[probation] getPreviousEvaluations error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Geçmiş değerlendirmeler bulunamadı",
        });
      }
    }),
});
