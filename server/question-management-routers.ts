import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import { getDb } from './db';
import { fieldInspectionQuestions, fieldInspectionCategories } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export const questionManagementRouter = router({
  // Kategorileri getir
  getCategories: publicProcedure.query(async () => {
    const db = (await getDb())!;
    const categories = await db.select().from(fieldInspectionCategories).orderBy(fieldInspectionCategories.order);
    return categories;
  }),

  // Soruları kategoriye göre getir
  getQuestions: publicProcedure
    .input(z.object({ categoryId: z.number() }).optional())
    .query(async ({ input }: { input: any }) => {
      const db = (await getDb())!;
      
      if (!input?.categoryId) {
        const questions = await db.select().from(fieldInspectionQuestions).orderBy(fieldInspectionQuestions.order);
        return questions;
      }
      
      const questions = await db
        .select()
        .from(fieldInspectionQuestions)
        .where(eq(fieldInspectionQuestions.categoryId, input.categoryId))
        .orderBy(fieldInspectionQuestions.order);
      
      return questions;
    }),

  // Soru ekle veya güncelle
  upsertQuestion: publicProcedure
    .input(
      z.object({
        id: z.number().optional(),
        categoryId: z.number(),
        questionText: z.string(),
        points: z.number(),
        maxScore: z.number(),
        isCritical: z.boolean(),
        criticalPenalty: z.number(),
        criticalCategory: z.string(),
        order: z.number(),
      })
    )
    .mutation(async ({ input }: { input: any }) => {
      const db = (await getDb())!;
      
      if (input.id) {
        // Güncelle
        await (db as any)
          .update(fieldInspectionQuestions)
          .set({
            categoryId: input.categoryId,
            questionText: input.questionText,
            points: input.points,
            maxScore: input.maxScore,
            isCritical: input.isCritical ? 1 : 0,
            criticalPenalty: input.criticalPenalty,
            criticalCategory: input.criticalCategory,
            order: input.order,
          })
          .where(eq(fieldInspectionQuestions.id, input.id));
      } else {
        // Ekle
        await (db as any).insert(fieldInspectionQuestions).values({
          categoryId: input.categoryId,
          questionText: input.questionText,
          points: input.points,
          maxScore: input.maxScore,
          isCritical: input.isCritical ? 1 : 0,
          criticalPenalty: input.criticalPenalty,
          criticalCategory: input.criticalCategory,
          order: input.order,
        });
      }
      
      return { success: true };
    }),

  // Soru sil
  deleteQuestion: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }: { input: any }) => {
      const db = (await getDb())!;
      
      await (db as any).delete(fieldInspectionQuestions).where(eq(fieldInspectionQuestions.id, input.id));
      
      return { success: true };
    }),
});
