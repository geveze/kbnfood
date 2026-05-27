import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getMicrosoftGraphToken,
  getSharePointSiteInfo,
  getExcelFileItemId,
  addRowToSharePointExcel,
} from "./_core/microsoft-graph";

export const sharepointRouter = router({
  /**
   * Değerlendirmeyi SharePoint Excel dosyasına senkronize et
   */
  syncEvaluationToSharePoint: protectedProcedure
    .input(
      z.object({
        employeeName: z.string(),
        employeePosition: z.string(),
        evaluationPeriod: z.string(),
        totalScore: z.number(),
        evaluationScale: z.string(),
        evaluationDate: z.string(),
        evaluatedByManager: z.string().optional(),
        managerOpinion: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // SharePoint site ve drive bilgisini al
        const sharePointSiteUrl =
          "https://kebanentegre-my.sharepoint.com/personal/abdullah_er_kebanet_com";
        const excelFileName = "PİF Keban.xlsx";
        const excelFilePath = "Documents/PİF - Raporları/PİF Keban.xlsx"; // Dosya tam yolu

        const { siteId, driveId } = await getSharePointSiteInfo(
          sharePointSiteUrl
        );
        const itemId = await getExcelFileItemId(driveId, excelFilePath);

        // Excel dosyasına satır ekle
        const rowData = {
          "Personel Adı": input.employeeName,
          Görevi: input.employeePosition,
          "Değerlendirme Dönemi": input.evaluationPeriod,
          Puan: input.totalScore,
          Skalası: input.evaluationScale,
          Tarih: input.evaluationDate,
          "Değerlendiren Yönetici": input.evaluatedByManager || "",
          "Yönetici Görüşü": input.managerOpinion || "",
        };

        await addRowToSharePointExcel(siteId, driveId, itemId, rowData);

        return {
          success: true,
          message: "Değerlendirme SharePoint Excel dosyasına eklendi",
        };
      } catch (error) {
        console.error("SharePoint senkronizasyon hatası:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `SharePoint senkronizasyon başarısız: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
        });
      }
    }),

  /**
   * Microsoft Graph API token'ını test et
   */
  testMicrosoftGraphConnection: protectedProcedure.query(async () => {
    try {
      const token = await getMicrosoftGraphToken();
      return {
        success: true,
        message: "Microsoft Graph API bağlantısı başarılı",
        tokenLength: token.length,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Microsoft Graph bağlantı hatası: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
      });
    }
  }),
});
