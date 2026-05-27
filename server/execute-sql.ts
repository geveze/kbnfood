import { protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";

export const executeSqlProcedure = protectedProcedure
  .input(z.object({ sql: z.string() }))
  .mutation(async ({ input, ctx }: any) => {
    // Sadece admin kullanıcıları SQL çalıştırabilir
    if (ctx.user.role !== "admin") {
      throw new Error("Bu işlemi yapmaya yetkiniz yoktur");
    }

    const db = await getDb();
    try {
      const result = await (db as any)?.execute(input.sql);
      return { success: true, message: "SQL başarıyla çalıştırıldı" };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Unknown error' };
    }
  });
