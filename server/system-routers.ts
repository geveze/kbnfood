import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import { getDb } from './db';
import { fieldInspections, fieldInspectionAnswers, fieldInspectionQuestions } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export const systemRouter = router({
  // Tüm denetimleri getir
  getEvaluations: publicProcedure
    .input(
      z.object({
        branchId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }: { input: any }) => {
      const db = (await getDb())!;
      
      let query = db.select().from(fieldInspections);
      
      if (input?.branchId) {
        query = (query as any).where(eq(fieldInspections.branchId, input.branchId));
      }
      
      const inspections = await (query as any).orderBy(fieldInspections.inspectionDate);
      return inspections;
    }),

  // Denetim detaylarını getir
  getEvaluationDetails: publicProcedure
    .input(z.object({ inspectionId: z.number() }))
    .query(async ({ input }: { input: any }) => {
      const db = (await getDb())!;
      
      const inspection = await db
        .select()
        .from(fieldInspections)
        .where(eq(fieldInspections.id, input.inspectionId));
      
      if (!inspection.length) {
        return null;
      }
      
      const answers = await db
        .select()
        .from(fieldInspectionAnswers)
        .where(eq(fieldInspectionAnswers.inspectionId, input.inspectionId));
      
      return {
        ...inspection[0],
        answers,
      };
    }),

  // Denetim sonuçlarını güncelle
  updateEvaluationResult: publicProcedure
    .input(
      z.object({
        inspectionId: z.number(),
        totalScore: z.number(),
        criticalPenalty: z.number(),
      })
    )
    .mutation(async ({ input }: { input: any }) => {
      const db = (await getDb())!;
      
      await (db as any)
        .update(fieldInspections)
        .set({
          totalScore: input.totalScore,
          criticalPenalty: input.criticalPenalty,
        })
        .where(eq(fieldInspections.id, input.inspectionId));
      
      return { success: true };
    }),
});
