import { z } from "zod";
import { protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { kpiTargetCardsDetail } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import XLSX from "xlsx";

/**
 * Excel dosyasından KPI hedef kartlarını parse et
 */
export async function parseExcelFile(
  fileBuffer: Buffer
): Promise<{
  success: boolean;
  data?: any[];
  errors?: string[];
}> {
  try {
    // Excel dosyasını oku
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });

    // "Hedef Kartları Detay" sheet'ini bul
    const sheetName = workbook.SheetNames.find((name: string) =>
      name.toLowerCase().includes("detay")
    );

    if (!sheetName) {
      return {
        success: false,
        errors: [
          'Veritabanında "Hedef Kartları Detay" sheet\'i bulunamadı. Lütfen Excel dosyasını kontrol edin.',
        ],
      };
    }

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (!jsonData || jsonData.length === 0) {
      return {
        success: false,
        errors: ["Excel dosyasında veri bulunamadı"],
      };
    }

    // Veriyi normalize et ve validate et
    const normalizedData = jsonData.map((row: any) => ({
      period: row["Dönem"] || row["dönem"] || "",
      branchName: row["Şube Adı"] || row["şube adı"] || "",
      branchManager: row["Bölge Sorumlusu"] || row["bölge sorumlusu"] || "",
      dimension: row["Boyut"] || row["boyut"] || "",
      target: row["Hedef"] || row["hedef"] || "",
      targetDescription: row["Hedef Açıklaması"] || row["hedef açıklaması"] || "",
      unit: row["Birim"] || row["birim"] || "",
      source: row["Kaynak"] || row["kaynak"] || "",
      frequency: row["Sıklık"] || row["sıklık"] || "",
      weight: parseInt(row["Ağırlık %"] || row["ağırlık %"] || "0") || 0,
      targetType: row["Hedef Tipi"] || row["hedef tipi"] || "",
      lowerLimit: String(row["Hedef Alt Limit (80 P)"] || row["hedef alt limit (80 p)"] || ""),
      targetValue: String(row["Hedef Değeri (100 P)"] || row["hedef değeri (100 p)"] || ""),
      upperLimit: String(row["Hedef Üst Limit (120 P)"] || row["hedef üst limit (120 p)"] || ""),
      actualValue: String(row["Gerçekleşen Değer"] || row["gerçekleşen değer"] || ""),
      score: String(row["Puan"] || row["puan"] || ""),
      weightedScore: String(row["Hedef Puanı (Ağırlık*Puan)"] || row["hedef puanı (ağırlık*puan)"] || ""),
    }));

    // Validate et
    const errors: string[] = [];
    const validData = normalizedData.filter((row: any, idx: number) => {
      if (!row.period || !row.branchName || !row.branchManager || !row.dimension || !row.target) {
        errors.push(
          `Satır ${idx + 2}: Dönem, Şube Adı, Bölge Sorumlusu, Boyut ve Hedef alanları zorunludur`
        );
        return false;
      }
      return true;
    });

    if (validData.length === 0) {
      return {
        success: false,
        errors: errors.length > 0 ? errors : ["Geçerli veri bulunamadı"],
      };
    }

    return {
      success: true,
      data: validData,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      errors: [`Excel dosyası işlenirken hata oluştu: ${error.message}`],
    };
  }
}

/**
 * Excel dosyasından yüklenen verileri veritabanına ekle
 */
export const importExcelProcedure = protectedProcedure
  .input(
    z.object({
      fileBase64: z.string(),
      fileName: z.string(),
      replacePeriod: z.boolean().optional().default(false),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // Admin kontrolü
    if (ctx.user?.role !== "admin") {
      throw new Error("Yalnızca yöneticiler Excel dosyası yükleyebilir");
    }

    try {
      // Base64'ten Buffer'a dönüştür
      const fileBuffer = Buffer.from(input.fileBase64, "base64");

      // Excel dosyasını parse et
      const parseResult = await parseExcelFile(fileBuffer);

      if (!parseResult.success || !parseResult.data) {
        return {
          success: false,
          errors: parseResult.errors || ["Bilinmeyen bir hata oluştu"],
        };
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Veritabanı bağlantısı başarısız");
      }

      // Eğer replacePeriod true ise, önce eski verileri sil
      if (parseResult.data.length > 0 && input.replacePeriod) {
        const period = parseResult.data[0].period;
        await db
          .delete(kpiTargetCardsDetail)
          .where(eq(kpiTargetCardsDetail.period, period));
      }

      // Verileri ekle
      await db.insert(kpiTargetCardsDetail).values(parseResult.data as any);

      return {
        success: true,
        insertedCount: parseResult.data.length,
        warnings: parseResult.errors || [],
        message: `${parseResult.data.length} hedef kartı başarıyla yüklendi`,
      };
    } catch (error: any) {
      return {
        success: false,
        errors: [`Yükleme işlemi başarısız: ${error.message}`],
      };
    }
  });
