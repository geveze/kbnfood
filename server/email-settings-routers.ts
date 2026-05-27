import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

/**
 * Email Settings Router - Admin paneli için mail ayarları yönetimi
 */
export const emailSettingsRouter = router({
  /**
   * Tüm mail ayarlarını getir
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Sadece admin erişebilir
      if (ctx.user?.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      // SQL ile doğrudan sorgu yap (email_settings tablosu Drizzle schema'sında tanımlı değil)
      try {
        const result = await (db as any).execute(
          `SELECT id, \`key\`, \`value\`, description, isEncrypted, createdAt, updatedAt FROM email_settings ORDER BY createdAt DESC`
        );
        return result || [];
      } catch (dbError) {
        console.warn('[emailSettings] Table might not exist, returning empty array');
        return []; // Tablo yoksa boş dizi dön
      }
    } catch (error) {
      console.error('[emailSettings] Error fetching settings:', error);
      throw new Error('Mail ayarları alınamadı');
    }
  }),

  /**
   * Belirli bir mail ayarını getir
   */
  getByKey: protectedProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        // Sadece admin erişebilir
        if (ctx.user?.role !== 'admin') {
          throw new Error('Unauthorized');
        }

        const db = await getDb();
        if (!db) {
          throw new Error('Database connection failed');
        }

        // SQL ile doğrudan sorgu yap
        const result = await (db as any).execute(
          `SELECT id, \`key\`, \`value\`, description, isEncrypted FROM email_settings WHERE \`key\` = ?`,
          [input.key]
        );

        return result?.[0] || null;
      } catch (error) {
        console.error('[emailSettings] Error fetching setting:', error);
        throw new Error('Mail ayarı alınamadı');
      }
    }),

  /**
   * Mail ayarını güncelle
   */
  update: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Sadece admin güncelleyebilir
        if (ctx.user?.role !== 'admin') {
          throw new Error('Unauthorized');
        }

        const db = await getDb();
        if (!db) {
          throw new Error('Database connection failed');
        }

        // SQL ile doğrudan güncelleme yap
        await (db as any).execute(
          `UPDATE email_settings SET \`value\` = ?, description = ?, updatedAt = NOW() WHERE \`key\` = ?`,
          [input.value, input.description || null, input.key]
        );

        return {
          success: true,
          message: 'Mail ayarı başarıyla güncellendi',
        };
      } catch (error) {
        console.error('[emailSettings] Error updating setting:', error);
        throw new Error('Mail ayarı güncellenirken hata oluştu');
      }
    }),

  /**
   * Yeni mail ayarı ekle
   */
  create: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Sadece admin ekleyebilir
        if (ctx.user?.role !== 'admin') {
          throw new Error('Unauthorized');
        }

        const db = await getDb();
        if (!db) {
          throw new Error('Database connection failed');
        }

        // SQL ile doğrudan ekleme yap
        await (db as any).execute(
          `INSERT INTO email_settings (\`key\`, \`value\`, description, isEncrypted) VALUES (?, ?, ?, false)`,
          [input.key, input.value, input.description || null]
        );

        return {
          success: true,
          message: 'Mail ayarı başarıyla eklendi',
        };
      } catch (error) {
        console.error('[emailSettings] Error creating setting:', error);
        throw new Error('Mail ayarı eklenirken hata oluştu');
      }
    }),

  /**
   * Mail ayarını sil
   */
  delete: protectedProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Sadece admin silebilir
        if (ctx.user?.role !== 'admin') {
          throw new Error('Unauthorized');
        }

        const db = await getDb();
        if (!db) {
          throw new Error('Database connection failed');
        }

        // SQL ile doğrudan silme yap
        await (db as any).execute(
          `DELETE FROM email_settings WHERE \`key\` = ?`,
          [input.key]
        );

        return {
          success: true,
          message: 'Mail ayarı başarıyla silindi',
        };
      } catch (error) {
        console.error('[emailSettings] Error deleting setting:', error);
        throw new Error('Mail ayarı silinirken hata oluştu');
      }
    }),
});
