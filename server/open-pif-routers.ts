import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getPositionsRaw, getPositionWithCategoriesAndQuestionsRaw } from "./position-helpers";
import { getDb } from "./db";
import { openPifEvaluations } from "../drizzle/schema";
import { generateOpenPifExcel } from "./open-pif-excel";
import { sendPerformanceEvaluationEmail } from "./email-service";
import type { PerformanceEvaluationEmailData } from "./email-service";

// Convert string keys to numbers for answers
function parseAnswers(answers: Record<string, number>): Record<number, number> {
  const result: Record<number, number> = {};
  for (const [key, value] of Object.entries(answers)) {
    result[parseInt(key)] = value;
  }
  return result;
}


export const openPifRouter = router({
  // Tüm pozisyonları getir
  getPositions: publicProcedure.query(async () => {
    return await getPositionsRaw();
  }),

  // Belirli bir pozisyonu kategorileri ve soruları ile getir
  getPositionWithQuestions: publicProcedure
    .input(z.object({ positionId: z.number() }))
    .query(async ({ input }) => {
      console.log('[openPif] getPositionWithQuestions called with positionId:', input.positionId);
      const result = await getPositionWithCategoriesAndQuestionsRaw(input.positionId);
      console.log('[openPif] getPositionWithQuestions result:', result);
      return result;
    }),



  // Performans Izleme Formu degerlendirmesini kaydet
  create: publicProcedure
    .input(
      z.object({
        branchId: z.number().optional(),
        employeeName: z.string(),
        employeePosition: z.string(),
        employeeIdNumber: z.string().optional(),
        hireDate: z.string().optional(),
        evaluationDate: z.string().optional(),
        evaluationPeriod: z.string(),
        evaluatedByManager: z.string().optional(),
        items: z.array(
          z.object({
            id: z.string(),
            category: z.string(),
            subcategory: z.string(),
            itemNumber: z.number(),
            description: z.string(),
            score: z.number(),
          })
        ),
        scoreExplanations: z.record(z.string(), z.string()).optional(), // 1 veya 5 puan için açıklamalar
        managerOpinion: z.string().optional(),
        totalScore: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database connection failed');
        }

        // Veritabanına kaydet
        console.log('[openPif] CREATE mutation başladı');
        console.log('[openPif] Input data:', {
          branchId: input.branchId,
          employeeName: input.employeeName,
          employeePosition: input.employeePosition,
          employeeIdNumber: input.employeeIdNumber,
          evaluationPeriod: input.evaluationPeriod,
          totalScore: input.totalScore,
          itemsCount: input.items?.length || 0,
        });
        
        await db.insert(openPifEvaluations).values({
          branchId: input.branchId || 0,
          employeeName: input.employeeName,
          employeePosition: input.employeePosition,
          employeeIdNumber: input.employeeIdNumber || '',
          hireDate: input.hireDate ? new Date(input.hireDate) : null,
          evaluationDate: input.evaluationDate ? new Date(input.evaluationDate) : new Date(),
          evaluationPeriod: input.evaluationPeriod,
          evaluatedByManager: input.evaluatedByManager || '',
          items: JSON.stringify(input.items),
          scoreExplanations: input.scoreExplanations ? JSON.stringify(input.scoreExplanations) : null,
          managerOpinion: input.managerOpinion || '',
          totalScore: input.totalScore,
        });

        // Mail gönderme işlemini başlat (arka planda)
        const recipientEmail = process.env.PERFORMANCE_MONITORING_EMAIL || 'abdullah.er@kebanet.com';
        const emailData: PerformanceEvaluationEmailData = {
          employeeName: input.employeeName,
          employeePosition: input.employeePosition,
          employeeIdNumber: input.employeeIdNumber,
          evaluationDate: input.evaluationDate,
          evaluationPeriod: input.evaluationPeriod,
          totalScore: input.totalScore,
          evaluatedByManager: input.evaluatedByManager,
          managerOpinion: input.managerOpinion,
        };
        sendPerformanceEvaluationEmail(emailData, recipientEmail).catch((err: any) => {
          console.error('[openPif] Error sending email:', err);
        });

        console.log('[openPif] Veritabanına kayıt başarılı');
        
        return {
          success: true,
          message: "Degerlendirme basariyla kaydedildi",
          data: {
            employeeName: input.employeeName,
            employeePosition: input.employeePosition,
            totalScore: input.totalScore,
            evaluationDate: input.evaluationDate,
          },
        };
      } catch (error) {
        console.error('[openPif] Error creating evaluation:', error);
        throw new Error('Degerlendirme kaydedilirken hata oluştu');
      }
    }),

  list: publicProcedure
    .input(z.object({ branchId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          console.error('Database connection failed');
          return [];
        }
        
        // pdfUrl sütunu olmadan seç (eski verilerde pdfUrl olmayabilir)
        const query = db.select({
          id: openPifEvaluations.id,
          branchId: openPifEvaluations.branchId,
          employeeName: openPifEvaluations.employeeName,
          employeePosition: openPifEvaluations.employeePosition,
          employeeIdNumber: openPifEvaluations.employeeIdNumber,
          hireDate: openPifEvaluations.hireDate,
          evaluationDate: openPifEvaluations.evaluationDate,
          evaluationPeriod: openPifEvaluations.evaluationPeriod,
          evaluatedByManager: openPifEvaluations.evaluatedByManager,
          items: openPifEvaluations.items,
          scoreExplanations: openPifEvaluations.scoreExplanations,
          managerOpinion: openPifEvaluations.managerOpinion,
          totalScore: openPifEvaluations.totalScore,
          createdAt: openPifEvaluations.createdAt,
          updatedAt: openPifEvaluations.updatedAt,
        }).from(openPifEvaluations) as any;
        
        let finalQuery = query;
        if (input?.branchId && input.branchId > 0) {
          finalQuery = query.where(eq(openPifEvaluations.branchId, input.branchId));
        }
        
        const evaluations = await finalQuery.orderBy(desc(openPifEvaluations.evaluationDate));
        
        return evaluations || [];
      } catch (error) {
        console.error('Error fetching PIF evaluations:', error);
        return [];
      }
    }),

  getEvaluationHistory: publicProcedure
    .input(z.object({ 
      branchId: z.number().optional(),
      userRole: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          console.error('Database connection failed');
          return [];
        }
        
        // pdfUrl sütunu olmadan seç (eski verilerde pdfUrl olmayabilir)
        let query = db
          .select({
            id: openPifEvaluations.id,
            branchId: openPifEvaluations.branchId,
            employeeName: openPifEvaluations.employeeName,
            employeePosition: openPifEvaluations.employeePosition,
            employeeIdNumber: openPifEvaluations.employeeIdNumber,
            hireDate: openPifEvaluations.hireDate,
            evaluationDate: openPifEvaluations.evaluationDate,
            evaluationPeriod: openPifEvaluations.evaluationPeriod,
            evaluatedByManager: openPifEvaluations.evaluatedByManager,
            items: openPifEvaluations.items,
            scoreExplanations: openPifEvaluations.scoreExplanations,
            managerOpinion: openPifEvaluations.managerOpinion,
            totalScore: openPifEvaluations.totalScore,
            createdAt: openPifEvaluations.createdAt,
            updatedAt: openPifEvaluations.updatedAt,
          })
          .from(openPifEvaluations) as any;
        
        // Admin değilse, sadece kendi şubesinin değerlendirmelerini göster
        if (input?.userRole !== 'admin' && input?.branchId && input.branchId > 0) {
          query = query.where(eq(openPifEvaluations.branchId, input.branchId));
        }
        
        const evaluations = await query.orderBy(desc(openPifEvaluations.evaluationDate));
        
        return evaluations || [];
      } catch (error) {
        console.error('Error fetching evaluation history:', error);
        return [];
      }
    }),

  downloadExcel: publicProcedure
    .input(
      z.object({
        positionId: z.number(),
        employeeName: z.string(),
        employeeIdNumber: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const buffer = await generateOpenPifExcel({
          positionId: input.positionId,
          employeeName: input.employeeName,
          employeeIdNumber: input.employeeIdNumber,
          evaluatedByName: 'Admin',
          evaluationDate: new Date(),
          answers: {},
          categoryScores: {},
          totalScore: 0,
        });
        return {
          success: true,
          buffer: buffer,
          fileName: `PIF_${input.employeeName}_${new Date().toISOString().split('T')[0]}.xlsx`,
        };
      } catch (error) {
        console.error('[openPif] Error generating Excel:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Excel dosyası oluşturulurken hata oluştu',
        });
      }
    }),
});
