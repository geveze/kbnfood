import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { visitPlans } from "../drizzle/schema";
import { getDb } from "./db";
import { eq, desc } from "drizzle-orm";

export const visitPlansRouter = router({
  // Tüm ziyaret planlarını getir
  getAll: protectedProcedure
    .input(
      z.object({
        branchId: z.number().optional(),
        status: z.enum(["Planlandı", "Gerçekleşti", "İptal"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query: any = db.select().from(visitPlans);

      if (input.branchId) {
        query = query.where(eq(visitPlans.branchId, input.branchId));
      }

      if (input.status) {
        query = query.where(eq(visitPlans.status, input.status));
      }

      const result = await query.orderBy(desc(visitPlans.visitDate));
      return result;
    }),

  // Yeni ziyaret planı oluştur
  create: protectedProcedure
    .input(
      z.object({
        branchId: z.number(),
        branchName: z.string(),
        visitDate: z.date(),
        visitTime: z.string(),
        visitType: z.enum(["Denetim", "Eğitim", "Ürün Tanıtımı", "Sorun Çözümü", "Diğer"]),
        visitDescription: z.string(),
        visitManagerId: z.number(),
        visitManager: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(visitPlans).values({
        branchId: input.branchId,
        branchName: input.branchName,
        visitDate: input.visitDate,
        visitTime: input.visitTime,
        visitType: input.visitType,
        visitDescription: input.visitDescription,
        visitManagerId: input.visitManagerId,
        visitManager: input.visitManager,
        notes: input.notes,
        status: "Planlandı",
      });

      return result;
    }),

  // Ziyaret planını güncelle
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["Planlandı", "Gerçekleşti", "İptal"]).optional(),
        visitDate: z.date().optional(),
        visitTime: z.string().optional(),
        visitType: z.enum(["Denetim", "Eğitim", "Ürün Tanıtımı", "Sorun Çözümü", "Diğer"]).optional(),
        visitDescription: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;
      const result = await db
        .update(visitPlans)
        .set(updateData)
        .where(eq(visitPlans.id, id));

      return result;
    }),

  // Ziyaret planını sil
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .delete(visitPlans)
        .where(eq(visitPlans.id, input.id));

      return result;
    }),

  // ID'ye göre ziyaret planını getir
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(visitPlans)
        .where(eq(visitPlans.id, input.id));

      return result[0];
    }),
});
