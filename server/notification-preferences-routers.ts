import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { notificationPreferences } from "../drizzle/schema";
import { eq } from "drizzle-orm";

let db: any = null;

const initDb = async () => {
  if (!db) {
    db = await getDb();
  }
  return db;
};

export const notificationPreferencesRouter = router({
  /**
   * Kullanıcının bildirim tercihlerini getir
   */
  getPreferences: protectedProcedure.query(async ({ ctx }: any) => {
    try {
      const database = await initDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Veritabanı bağlantısı kurulamadı",
        });
      }

      const preferences = await database
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, ctx.user.id))
        .limit(1);

      if (!preferences || preferences.length === 0) {
        // Varsayılan tercihleri döndür
        return {
          userId: ctx.user.id,
          emailNotifications: true,
          smsNotifications: false,
          weeklyPlanCompleted: true,
          weeklyPlanFailed: true,
          inspectionResults: true,
          performanceAlerts: true,
          systemUpdates: false,
          phoneNumber: "",
        };
      }

      return preferences[0];
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Bildirim tercihleri alınırken hata oluştu",
      });
    }
  }),

  /**
   * Bildirim tercihlerini güncelle
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.boolean().optional(),
        smsNotifications: z.boolean().optional(),
        weeklyPlanCompleted: z.boolean().optional(),
        weeklyPlanFailed: z.boolean().optional(),
        inspectionResults: z.boolean().optional(),
        performanceAlerts: z.boolean().optional(),
        systemUpdates: z.boolean().optional(),
        phoneNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      try {
        const database = await initDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Veritabanı bağlantısı kurulamadı",
          });
        }

        // Mevcut tercihleri kontrol et
        const existing = await database
          .select()
          .from(notificationPreferences)
          .where(eq(notificationPreferences.userId, ctx.user.id))
          .limit(1);

        if (!existing || existing.length === 0) {
          // Yeni tercihler oluştur
          await database.insert(notificationPreferences).values({
            userId: ctx.user.id,
            emailNotifications: input.emailNotifications ?? true,
            smsNotifications: input.smsNotifications ?? false,
            weeklyPlanCompleted: input.weeklyPlanCompleted ?? true,
            weeklyPlanFailed: input.weeklyPlanFailed ?? true,
            inspectionResults: input.inspectionResults ?? true,
            performanceAlerts: input.performanceAlerts ?? true,
            systemUpdates: input.systemUpdates ?? false,
            phoneNumber: input.phoneNumber ?? "",
          });
        } else {
          // Mevcut tercihleri güncelle
          const updateData: any = {};
          if (input.emailNotifications !== undefined)
            updateData.emailNotifications = input.emailNotifications;
          if (input.smsNotifications !== undefined)
            updateData.smsNotifications = input.smsNotifications;
          if (input.weeklyPlanCompleted !== undefined)
            updateData.weeklyPlanCompleted = input.weeklyPlanCompleted;
          if (input.weeklyPlanFailed !== undefined)
            updateData.weeklyPlanFailed = input.weeklyPlanFailed;
          if (input.inspectionResults !== undefined)
            updateData.inspectionResults = input.inspectionResults;
          if (input.performanceAlerts !== undefined)
            updateData.performanceAlerts = input.performanceAlerts;
          if (input.systemUpdates !== undefined)
            updateData.systemUpdates = input.systemUpdates;
          if (input.phoneNumber !== undefined)
            updateData.phoneNumber = input.phoneNumber;

          await database
            .update(notificationPreferences)
            .set(updateData)
            .where(eq(notificationPreferences.userId, ctx.user.id));
        }

        return {
          success: true,
          message: "Bildirim tercihleri başarıyla güncellendi",
        };
      } catch (error) {
        console.error("Error updating notification preferences:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Bildirim tercihleri güncellenirken hata oluştu",
        });
      }
    }),
});
