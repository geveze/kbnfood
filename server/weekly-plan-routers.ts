import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { weeklyPlans, branches, users } from "../drizzle/schema";
import { eq, and, gte, lte, sql, desc, like } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { generateICSFromWeeklyPlans } from "./ics-export";
import { format } from "date-fns";

/**
 * Gorev tamamlandi bildirimini gonder
 */
async function sendCompletionEmail(data: any) {
  try {
    const planDate = new Date(data.planDate);
    const formattedDate = planDate.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailContent = `
    <h2>Gorev Tamamlandi Bildirimi</h2>
    <p>Merhaba,</p>
    <p>Asagidaki gorev basariyla tamamlanmistir:</p>
    <ul>
      <li><strong>Sube:</strong> ${data.branchName}</li>
      <li><strong>Magaza:</strong> ${data.storeName}</li>
      <li><strong>Tarih:</strong> ${formattedDate}</li>
      <li><strong>Saat:</strong> ${data.planTime}</li>
      <li><strong>Aksiyon Tipi:</strong> ${data.actionType}</li>
      <li><strong>Bolge Muduru:</strong> ${data.managerName}</li>
    </ul>
    <p>Detaylar icin sisteme giris yapabilirsiniz.</p>
    `;

    await notifyOwner({
      title: `Gorev Tamamlandi: ${data.branchName}`,
      content: emailContent,
    });

    console.log(`Completion notification sent for plan ${data.planId}`);
  } catch (error) {
    console.error("Error in sendCompletionEmail:", error);
    throw error;
  }
}

/**
 * Haftalık Saha Planı Router
 * Bölge müdürleri haftalık planlarını yönetir
 */
let db: any = null;

// Initialize db on first use
const initDb = async () => {
  if (!db) {
    db = await getDb();
  }
  return db;
};

// Haftalık Giriş Sistemi için prosedürler
const saveWeeklyPlanEntriesProcedure = protectedProcedure
  .input(
    z.object({
      weekStart: z.string(),
      weekEnd: z.string(),
      entries: z.array(
        z.object({
          planDate: z.string(),
          planTime: z.string(),
          branchName: z.string(),
          planDescription: z.string().optional(),
          actualValue: z.string().optional(),
          status: z.string().default("Planlandı"),
        })
      ),
    })
  )
  .mutation(async ({ ctx, input }: any) => {
    try {
      const database = await getDb();
      
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Veritabanı bağlantısı başarısız",
        });
      }

      // Her entry'i veritabanına kaydet
      const results = await Promise.all(
        input.entries.map((entry: any) =>
          database.insert(weeklyPlans).values({
            branchId: 1,
            branchCode: "",
            branchName: entry.branchName,
            managerId: ctx.user.id,
            managerName: ctx.user.name || "",
            managerEmail: ctx.user.email,
            planDate: new Date(entry.planDate),
            planTime: entry.planTime,
            storeName: entry.branchName,
            city: "",
            actionType: "Diğer",
            priority: "Orta",
            planDescription: entry.planDescription || "",
            status: entry.status || "Planlandı",
            actualNotes: entry.actualValue || "",
          })
        )
      );

      return {
        success: true,
        count: results.length,
        message: `${results.length} plan başarıyla kaydedildi`,
      };
    } catch (error: any) {
      console.error("Error saving weekly plan entries:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Planlar kaydedilirken hata oluştu: ${error?.message || 'Bilinmeyen hata'}`,
      });
    }
  });

export const weeklyPlanRouter = router({
  /**
   * Haftalık planları getir
   */
  getPlans: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        branchName: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }: any) => {
      try {
        const db = await getDb();
        if (!db) return [];

        let query: any = db.select().from(weeklyPlans);

        // Rol tabanlı filtrele
        if (ctx.user.role !== 'admin') {
          query = query.where(eq(weeklyPlans.managerId, ctx.user.id));
        }

        // Tarih aralığı filtresi
        query = query.where(
          and(
            gte(weeklyPlans.planDate, input.startDate),
            lte(weeklyPlans.planDate, input.endDate)
          )
        );

        // Şube adı filtresi
        if (input.branchName && input.branchName.trim() !== '') {
          query = query.where(
            like(weeklyPlans.branchName, `%${input.branchName}%`)
          );
        }

        // Durum filtresi
        if (input.status && input.status.trim() !== '') {
          query = query.where(eq(weeklyPlans.status, input.status));
        }

        const result = await query.orderBy(desc(weeklyPlans.planDate));
        return result;
      } catch (error) {
        console.error('Error fetching weekly plans:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Planlar yüklenirken hata oluştu',
        });
      }
    }),

  /**
   * Haftalık Giriş Sistemi: Planları kaydet
   */
  savePlans: saveWeeklyPlanEntriesProcedure,
  saveWeeklyPlanEntries: saveWeeklyPlanEntriesProcedure,
  /**
   * Haftalık planları Outlook ICS formatına dönüştür
   */
  exportToICS: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        managerId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      try {
        // Tüm kullanıcılar export edebilir
        const icsContent = await generateICSFromWeeklyPlans(
          input.startDate,
          input.endDate,
          input.managerId || ctx.user.id.toString()
        );

        return {
          content: icsContent,
          filename: `haftalik-plan-${format(input.startDate, 'yyyy-MM-dd')}.ics`,
        };
      } catch (error) {
        console.error('Error exporting to ICS:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'ICS dosyası oluşturulurken hata oluştu',
        });
      }
    }),

  /**
   * Hafta bazlı planları getir
   * Filtreleme: bölge, müdür, aksiyon tipi, tarih aralığı
   */
  getWeeklyPlans: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        branchId: z.number().optional(),
        managerId: z.number().optional(),
        actionType: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }: any) => {
      try {
        const database = await initDb();
        if (!database) {
          return [];
        }
        // Rol kontrolü
        let query = database.select().from(weeklyPlans);

        // Bölge Müdürü: sadece kendi kayıtlarını görebilir
        if (ctx.user.role === "region_manager") {
          query = query.where(eq(weeklyPlans.managerId, ctx.user.id));
        }
        // Şube Müdürü: sadece kendi şubesinin kayıtlarını görebilir
        else if (ctx.user.role === "branch_manager" && ctx.user.branchId) {
          query = query.where(eq(weeklyPlans.branchId, ctx.user.branchId));
        }
        // Admin ve Operasyon Direktörü: tüm kayıtları görebilir
        // Patron: read-only (bu prosedürde zaten read-only)

        // Filtreleme
        if (input.startDate && input.endDate) {
          query = query.where(
            and(
              gte(weeklyPlans.planDate, input.startDate),
              lte(weeklyPlans.planDate, input.endDate)
            )
          );
        }

        if (input.branchId) {
          query = query.where(eq(weeklyPlans.branchId, input.branchId));
        }

        if (input.managerId) {
          query = query.where(eq(weeklyPlans.managerId, input.managerId));
        }

        if (input.actionType) {
          query = query.where(eq(weeklyPlans.actionType, input.actionType));
        }

        if (input.status) {
          query = query.where(eq(weeklyPlans.status, input.status));
        }

        const result = await query;
        return result || [];
      } catch (error) {
        console.error("Error fetching weekly plans:", error);
        return [];
      }
    }),

  /**
   * Yeni haftalık plan oluştur
   */
  createWeeklyPlan: protectedProcedure
    .input(
      z.object({
        branchId: z.number(),
        branchCode: z.string().optional(),
        branchName: z.string(),
        planDate: z.date(),
        planTime: z.string(),
        storeName: z.string(),
        city: z.string(),
        actionType: z.enum(["Denetim", "Eğitim", "Ürün Tanıtımı", "Sorun Çözümü", "Diğer"]),
        priority: z.enum(["Yüksek", "Orta", "Düşük"]).default("Orta"),
        planDescription: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      try {
        // Rol kontrolü: Bölge Müdürü, Operasyon Direktörü ve Admin oluşturabilir
        if (!["region_manager", "operations_manager", "admin"].includes(ctx.user.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Bu işlem için yetkiniz yok",
          });
        }

        // Bölge Müdürü: sadece kendi kayıtlarını oluşturabilir
        // Not: Bu kontrol zaten managerId: ctx.user.id ile yapılıyor, bu satır güvenlik için kaldırılabilir

        const database = await initDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Veritabanı bağlantısı kurulamadı",
          });
        }
        const result = await database.insert(weeklyPlans).values({
          branchId: input.branchId,
          branchCode: input.branchCode,
          branchName: input.branchName,
          managerId: ctx.user.id,
          managerName: ctx.user.name || "",
          managerEmail: ctx.user.email,
          planDate: input.planDate,
          planTime: input.planTime,
          storeName: input.storeName,
          city: input.city,
          actionType: input.actionType,
          priority: input.priority,
          planDescription: input.planDescription,
          status: "Planlandı",
        });

        return {
          success: true,
          id: result.insertId,
          message: "Plan başarıyla oluşturuldu",
        };
      } catch (error) {
        console.error("Error creating weekly plan:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Plan oluşturulurken hata oluştu",
        });
      }
    }),

  /**
   * Haftalık planı güncelle
   */
  updateWeeklyPlan: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        planTime: z.string().optional(),
        storeName: z.string().optional(),
        city: z.string().optional(),
        actionType: z.enum(["Denetim", "Eğitim", "Ürün Tanıtımı", "Sorun Çözümü", "Diğer"]).optional(),
        priority: z.enum(["Yüksek", "Orta", "Düşük"]).optional(),
        planDescription: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      try {
        // Rol kontrolü
        if (!["region_manager", "operations_manager", "admin"].includes(ctx.user.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Bu işlem için yetkiniz yok",
          });
        }

        const database = await initDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Veritabanı bağlantısı kurulamadı",
          });
        }
        // Planı bul
        const plan = await database
          .select()
          .from(weeklyPlans)
          .where(eq(weeklyPlans.id, input.id))
          .limit(1);

        if (!plan || plan.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Plan bulunamadı",
          });
        }

        // Bölge Müdürü: sadece kendi planlarını güncelleyebilir
        if (ctx.user.role === "region_manager" && plan[0].managerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Sadece kendi planlarınızı güncelleyebilirsiniz",
          });
        }

        const updateData: any = {};
        if (input.planTime) updateData.planTime = input.planTime;
        if (input.storeName) updateData.storeName = input.storeName;
        if (input.city) updateData.city = input.city;
        if (input.actionType) updateData.actionType = input.actionType;
        if (input.priority) updateData.priority = input.priority;
        if (input.planDescription !== undefined) updateData.planDescription = input.planDescription;

        await database.update(weeklyPlans).set(updateData).where(eq(weeklyPlans.id, input.id));

        return {
          success: true,
          message: "Plan başarıyla güncellendi",
        };
      } catch (error) {
        console.error("Error updating weekly plan:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Plan güncellenirken hata oluştu",
        });
      }
    }),

  /**
   * Haftalık planın gerçekleşme durumunu güncelle
   */
  updateWeeklyPlanStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["Planlandı", "Tamamlandı", "Kısmen", "Tamamlanmadı", "Ertelendi"]),
        actualTime: z.string().optional(),
        actualNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      try {
        // Rol kontrolü
        if (!["region_manager", "operations_manager", "admin"].includes(ctx.user.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Bu işlem için yetkiniz yok",
          });
        }

        // Tamamlanmadı seçilirse açıklama zorunlu
        if (input.status === "Tamamlanmadı" && !input.actualNotes) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Tamamlanmadı seçilirse açıklama zorunludur",
          });
        }

        const database = await initDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Veritabanı bağlantısı kurulamadı",
          });
        }
        // Planı bul
        const plan = await database
          .select()
          .from(weeklyPlans)
          .where(eq(weeklyPlans.id, input.id))
          .limit(1);

        if (!plan || plan.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Plan bulunamadı",
          });
        }

        // Bölge Müdürü: sadece kendi planlarını güncelleyebilir
        if (ctx.user.role === "region_manager" && plan[0].managerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Sadece kendi planlarınızı güncelleyebilirsiniz",
          });
        }

        const updateData: any = {
          status: input.status,
        };

        if (input.actualTime) updateData.actualTime = input.actualTime;
        if (input.actualNotes) updateData.actualNotes = input.actualNotes;

        await database.update(weeklyPlans).set(updateData).where(eq(weeklyPlans.id, input.id));

        // Tamamlandı durumunda mail gönder (bildirim tercihleri kontrolü)
        if (input.status === "Tamamlandı") {
          try {
            // TODO: Bildirim tercihlerini kontrol et
            // const preferences = await database.select().from(notificationPreferences).where(eq(notificationPreferences.userId, ctx.user.id));
            // if (preferences[0]?.emailNotifications) {
            await sendCompletionEmail({
              planId: input.id,
              managerEmail: plan[0].managerEmail,
              managerName: plan[0].managerName,
              branchName: plan[0].branchName,
              storeName: plan[0].storeName,
              planDate: plan[0].planDate,
              planTime: plan[0].planTime,
              actionType: plan[0].actionType,
            });
          } catch (mailError) {
            console.error("Error sending completion email:", mailError);
            // Mail gönderme hatası görevlerin güncellenmesini engellemesin
          }
        }

        return {
          success: true,
          message: "Durum başarıyla güncellendi",
        };
      } catch (error) {
        console.error("Error updating weekly plan status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Durum güncellenirken hata oluştu",
        });
      }
    }),

  /**
   * Haftalık planı sil
   */
  deleteWeeklyPlan: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }: any) => {
      try {
        // Rol kontrolü: Admin ve Operasyon Direktörü silebilir
        if (!["operations_manager", "admin"].includes(ctx.user.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Bu işlem için yetkiniz yok",
          });
        }

        const database = await initDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Veritabanı bağlantısı kurulamadı",
          });
        }
        const plan = await database
          .select()
          .from(weeklyPlans)
          .where(eq(weeklyPlans.id, input.id))
          .limit(1);

        if (!plan || plan.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Plan bulunamadı",
          });
        }

        await database.delete(weeklyPlans).where(eq(weeklyPlans.id, input.id));

        return {
          success: true,
          message: "Plan başarıyla silindi",
        };
      } catch (error) {
        console.error("Error deleting weekly plan:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Plan silinirken hata oluştu",
        });
      }
    }),

  /**
   * Haftalık plan istatistikleri getir
   * Toplam, tamamlanan, tamamlanma oranı
   */
  getWeeklyPlanStats: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        branchId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }: any) => {
      try {
        const database = await initDb();
        if (!database) {
          return {
            total: 0,
            completed: 0,
            partial: 0,
            notCompleted: 0,
            delayed: 0,
            planned: 0,
            completionRate: 0,
            notCompletedPlans: [],
          };
        }
        let query = database.select().from(weeklyPlans);

        // Rol kontrolü
        if (ctx.user.role === "region_manager") {
          query = query.where(eq(weeklyPlans.managerId, ctx.user.id));
        } else if (ctx.user.role === "branch_manager" && ctx.user.branchId) {
          query = query.where(eq(weeklyPlans.branchId, ctx.user.branchId));
        }

        // Filtreleme
        if (input.startDate && input.endDate) {
          query = query.where(
            and(
              gte(weeklyPlans.planDate, input.startDate),
              lte(weeklyPlans.planDate, input.endDate)
            )
          );
        }

        if (input.branchId) {
          query = query.where(eq(weeklyPlans.branchId, input.branchId));
        }

        const plans = await query;

        const total = plans.length;
        const completed = plans.filter((p: any) => p.status === "Tamamlandı").length;
        const partial = plans.filter((p: any) => p.status === "Kısmen").length;
        const notCompleted = plans.filter((p: any) => p.status === "Tamamlanmadı").length;
        const delayed = plans.filter((p: any) => p.status === "Ertelendi").length;
        const planned = plans.filter((p: any) => p.status === "Planlandı").length;

        const completionRate = total > 0 ? ((completed + partial) / total) * 100 : 0;

        return {
          total,
          completed,
          partial,
          notCompleted,
          delayed,
          planned,
          completionRate: Math.round(completionRate),
          notCompletedPlans: plans.filter((p: any) => p.status === "Tamamlanmadı"),
        };
      } catch (error) {
        console.error("Error fetching weekly plan stats:", error);
        return {
          total: 0,
          completed: 0,
          partial: 0,
          notCompleted: 0,
          delayed: 0,
          planned: 0,
          completionRate: 0,
          notCompletedPlans: [],
        };
      }
    }),

  /**
   * Haftalık planı başka güne taşı (drag-drop)
   */
  moveWeeklyPlanToDay: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        newDate: z.date(),
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
        // Rol kontrolü
        if (!["region_manager", "operations_manager", "admin"].includes(ctx.user.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Bu işlem için yetkiniz yok",
          });
        }

        // Planı bul
        const plan = await database
          .select()
          .from(weeklyPlans)
          .where(eq(weeklyPlans.id, input.id))
          .limit(1);

        if (!plan || plan.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Plan bulunamadı",
          });
        }

        // Bölge Müdürü: sadece kendi planlarını taşıyabilir
        if (ctx.user.role === "region_manager" && plan[0].managerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Sadece kendi planlarınızı taşıyabilirsiniz",
          });
        }

        await database
          .update(weeklyPlans)
          .set({ planDate: input.newDate })
          .where(eq(weeklyPlans.id, input.id));

        return {
          success: true,
          message: "Plan başarıyla taşındı",
        };
      } catch (error) {
        console.error("Error moving weekly plan:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Plan taşınırken hata oluştu",
        });
      }
    }),

  /**
   * Bölge müdürlerini getir (form için)
   */
  getRegionManagers: protectedProcedure.query(async ({ ctx }: any) => {
    try {
      const database = await initDb();
      if (!database) {
        return [];
      }
      const managers = await database
        .select()
        .from(users)
        .where(eq(users.role, "region_manager"));

      return managers.map((m: any) => ({
        id: m.id,
        name: m.name,
        email: m.email,
      }));
    } catch (error) {
      console.error("Error fetching region managers:", error);
      return [];
    }
  }),

  /**
   * Şubeleri getir (form için)
   */
  getBranchesForForm: protectedProcedure.query(async ({ ctx }: any) => {
    try {
      const database = await initDb();
      if (!database) {
        return [];
      }
      const branchList = await database.select().from(branches);

      return branchList.map((b: any) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        region: b.region,
      }));
    } catch (error) {
      console.error("Error fetching branches:", error);
      return [];
    }
  }),

  /**
   * Toplu haftalık plan oluştur (batch işlem)
   * Performans iyileştirmesi: tek seferde birden fazla plan kaydı
   */
  createWeeklyPlansBatch: protectedProcedure
    .input(
      z.object({
        plans: z.array(
          z.object({
            branchId: z.number(),
            branchCode: z.string().optional(),
            branchName: z.string(),
            planDate: z.date(),
            planTime: z.string(),
            storeName: z.string(),
            city: z.string(),
            actionType: z.enum(["Denetim", "Eğitim", "Ürün Tanıtımı", "Sorun Çözümü", "Diğer"]),
            priority: z.enum(["Yüksek", "Orta", "Düşük"]).default("Orta"),
            planDescription: z.string().optional(),
          })
        ),
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

        // Rol kontrolü
        if (ctx.user.role !== "region_manager" && ctx.user.role !== "admin" && ctx.user.role !== "operations_manager") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Bu işlem için yetkiniz yok",
          });
        }

        const savedPlans = [];

        // Toplu insert işlemi
        for (const plan of input.plans) {
          const newPlan = await database.insert(weeklyPlans).values({
            branchId: plan.branchId,
            branchCode: plan.branchCode || "",
            branchName: plan.branchName,
            planDate: plan.planDate,
            planTime: plan.planTime,
            storeName: plan.storeName,
            city: plan.city || "",
            actionType: plan.actionType,
            priority: plan.priority || "Orta",
            planDescription: plan.planDescription || "",
            status: "Planlandı",
            managerId: ctx.user.id,
            managerName: ctx.user.name || "",
            managerEmail: ctx.user.email || "",
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          savedPlans.push(newPlan);
        }

        return {
          success: true,
          count: savedPlans.length,
          message: `${savedPlans.length} plan başarıyla kaydedildi`,
        };
      } catch (error) {
        console.error("Error creating weekly plans batch:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Toplu plan kaydı sırasında hata oluştu",
        });
      }
    }),

  /**
   * Haftalık giriş verilerini getir (WeeklyPlans.tsx için)
   */
  getWeeklyPlanEntries: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        branchName: z.string().optional(),
        managerName: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }: any) => {
      try {
        const database = await initDb();
        if (!database) {
          return [];
        }

        let query = database.select().from(weeklyPlans);

        // Rol kontrolü
        if (ctx.user.role === "region_manager") {
          query = query.where(eq(weeklyPlans.managerId, ctx.user.id));
        } else if (ctx.user.role === "branch_manager" && ctx.user.branchId) {
          query = query.where(eq(weeklyPlans.branchId, ctx.user.branchId));
        }

        // Filtreleme
        if (input.startDate && input.endDate) {
          query = query.where(
            and(
              gte(weeklyPlans.planDate, input.startDate),
              lte(weeklyPlans.planDate, input.endDate)
            )
          );
        }

        if (input.branchName) {
          query = query.where(
            sql`${weeklyPlans.branchName} LIKE ${"%" + input.branchName + "%"}`
          );
        }

        if (input.managerName) {
          query = query.where(
            sql`${weeklyPlans.managerName} LIKE ${"%" + input.managerName + "%"}`
          );
        }

        if (input.status) {
          query = query.where(eq(weeklyPlans.status, input.status));
        }

        const result = await query;
        return result || [];
      } catch (error) {
        console.error("Error fetching weekly plan entries:", error);
        return [];
      }
    }),

  /**
   * Haftalık giriş verilerini güncelle
   */
  updateWeeklyPlanEntry: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.string().optional(),
        actualTime: z.string().optional(),
        actualNotes: z.string().optional(),
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

        // Rol kontrolü
        if (![
          "admin",
          "operations_manager",
          "region_manager",
        ].includes(ctx.user.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Bu işlem için yetkiniz yok",
          });
        }

        // Güncellenecek alanları hazırla
        const updateData: any = {};
        if (input.status) updateData.status = input.status;
        if (input.actualTime) updateData.actualTime = input.actualTime;
        if (input.actualNotes) updateData.actualNotes = input.actualNotes;
        updateData.updatedAt = new Date();

        const result = await database
          .update(weeklyPlans)
          .set(updateData)
          .where(eq(weeklyPlans.id, input.id));

        return {
          success: true,
          message: "Plan başarıyla güncellendi",
        };
      } catch (error) {
        console.error("Error updating weekly plan entry:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Plan güncellenirken hata oluştu",
        });
      }
    }),

  /**
   * Haftalık planı sil
   */
  deletePlan: protectedProcedure
    .input(
      z.object({
        id: z.number(),
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

        // Rol kontrolü
        if (![
          "admin",
          "operations_manager",
          "region_manager",
        ].includes(ctx.user.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Bu işlem için yetkiniz yok",
          });
        }

        // Planı sil
        const result = await database
          .delete(weeklyPlans)
          .where(eq(weeklyPlans.id, input.id));

        return {
          success: true,
          message: "Plan başarıyla silindi",
        };
      } catch (error) {
        console.error("Error deleting weekly plan:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Plan silinirken hata oluştu",
        });
      }
    }),
});
