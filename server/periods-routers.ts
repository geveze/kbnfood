import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { periods } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// Admin procedure - sadece admin kullanıcılar erişebilir
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

export const periodsRouter = router({
  /**
   * Tüm dönemleri listele
   */
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const result = await db
      .select()
      .from(periods)
      .orderBy(periods.year, periods.month);

    return result;
  }),

  /**
   * Aktif dönemleri listele
   */
  listActive: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const result = await db
      .select()
      .from(periods)
      .where(eq(periods.isActive, true))
      .orderBy(periods.year, periods.month);

    return result;
  }),

  /**
   * Dönem oluştur (Admin)
   */
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Dönem adı gerekli"),
        year: z.number().int().min(2000),
        month: z.number().int().min(1).max(12),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Dönem adı zaten var mı kontrol et
      const existing = await db
        .select()
        .from(periods)
        .where(eq(periods.name, input.name))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Bu dönem adı zaten kullanılıyor",
        });
      }

      await db.insert(periods).values({
        name: input.name,
        year: input.year,
        month: input.month,
        startDate: input.startDate,
        endDate: input.endDate,
        isActive: true,
      });

      return { success: true };
    }),

  /**
   * Dönem güncelle (Admin)
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        isActive: z.boolean().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      await db.update(periods).set(updateData).where(eq(periods.id, id));

      return { success: true };
    }),

  /**
   * Dönem sil (Admin)
   */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(periods).where(eq(periods.id, input.id));

      return { success: true };
    }),
});
