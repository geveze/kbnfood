import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { getDb } from "./db";
import { performanceEvaluations } from "../drizzle/schema";
import ExcelJS from "exceljs";

export const reportsRouter = router({
  downloadMasterEvaluations: protectedProcedure
    .input(
      z.object({
        period: z.string().optional(),
        branchIds: z.array(z.number()).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Veritabanı bağlantısı kurulamadı");
        }

        // Tüm değerlendirmeleri getir
        let evaluations: any[] = await db
          .select()
          .from(performanceEvaluations);

        // Dönem filtresi uygula
        if (input.period) {
          evaluations = evaluations.filter(
            (e: any) => e.evaluationPeriod === input.period
          );
        }

        // Şube filtresi uygula
        if (input.branchIds && input.branchIds.length > 0) {
          evaluations = evaluations.filter((e: any) =>
            input.branchIds!.includes(e.branchId)
          );
        }

        // Excel dosyası oluştur
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Performans İzleme");

        // Header satırı
        worksheet.columns = [
          { header: "Sıra No", key: "siraNo", width: 8 },
          { header: "Personel Adı", key: "employeeName", width: 20 },
          { header: "Pozisyon", key: "employeePosition", width: 20 },
          { header: "Personel ID", key: "employeeIdNumber", width: 15 },
          { header: "İşe Giriş Tarihi", key: "hireDate", width: 15 },
          { header: "Değerlendirme Tarihi", key: "evaluationDate", width: 15 },
          { header: "Dönem", key: "evaluationPeriod", width: 12 },
          { header: "Değerlendiren", key: "evaluatedByManager", width: 20 },
          { header: "Toplam Puan", key: "totalScore", width: 12 },
          { header: "Skalası", key: "evaluationScale", width: 15 },
          { header: "Yönetici Görüşü", key: "managerOpinion", width: 30 },
        ];

        // Veri satırlarını ekle
        evaluations.forEach((evaluation: any, index: number) => {
          worksheet.addRow({
            siraNo: index + 1,
            employeeName: evaluation.employeeName,
            employeePosition: evaluation.employeePosition,
            employeeIdNumber: evaluation.employeeIdNumber || "-",
            hireDate: evaluation.hireDate
              ? new Date(evaluation.hireDate).toLocaleDateString("tr-TR")
              : "-",
            evaluationDate: new Date(evaluation.evaluationDate).toLocaleDateString(
              "tr-TR"
            ),
            evaluationPeriod: evaluation.evaluationPeriod,
            evaluatedByManager: evaluation.evaluatedByManager || "-",
            totalScore: evaluation.totalScore,
            evaluationScale: evaluation.evaluationScale,
            managerOpinion: evaluation.managerOpinion || "-",
          });
        });

        // Excel dosyasını buffer'a dönüştür
        const buffer = await workbook.xlsx.writeBuffer();

        return {
          success: true,
          buffer: Buffer.from(buffer as ArrayBuffer),
          filename: `Performans_Izleme_${input.period || "Tum_Donemler"}_${
            new Date().toISOString().split("T")[0]
          }.xlsx`,
        };
      } catch (error: any) {
        console.error("Master Excel indirme hatası:", error);
        throw new Error(error?.message || "Master Excel indirme başarısız");
      }
    }),
});
