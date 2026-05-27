import { z } from "zod";

/**
 * Excel dosyasından performans verilerini işle
 * Beklenen format:
 * - Sütun 1: Şube Adı
 * - Sütun 2: KPI Hedefi
 * - Sütun 3: Dönem
 * - Sütun 4: Gerçek Değer
 * - Sütun 5: Notlar (opsiyonel)
 */

export interface ExcelRow {
  branchName: string;
  kpiTarget: string;
  period: string;
  actualValue: number;
  notes?: string;
}

export interface ProcessingResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  errors: Array<{
    rowNumber: number;
    error: string;
  }>;
  warnings: Array<{
    rowNumber: number;
    message: string;
  }>;
}

/**
 * CSV formatındaki verileri işle
 */
export function parseCSVData(csvContent: string): ExcelRow[] {
  const lines = csvContent.trim().split("\n");
  const rows: ExcelRow[] = [];

  // İlk satırı başlık olarak atla
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const columns = line.split(",").map((col) => col.trim());

    if (columns.length < 4) {
      continue;
    }

    const row: ExcelRow = {
      branchName: columns[0],
      kpiTarget: columns[1],
      period: columns[2],
      actualValue: parseFloat(columns[3]),
      notes: columns[4] || undefined,
    };

    rows.push(row);
  }

  return rows;
}

/**
 * Verileri doğrula
 */
export function validateExcelData(rows: ExcelRow[]): {
  valid: ExcelRow[];
  errors: Array<{ rowNumber: number; error: string }>;
  warnings: Array<{ rowNumber: number; message: string }>;
} {
  const valid: ExcelRow[] = [];
  const errors: Array<{ rowNumber: number; error: string }> = [];
  const warnings: Array<{ rowNumber: number; message: string }> = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because of 0-indexing and header row

    // Gerekli alanları kontrol et
    if (!row.branchName || !row.branchName.trim()) {
      errors.push({
        rowNumber,
        error: "Şube adı boş olamaz",
      });
      return;
    }

    if (!row.kpiTarget || !row.kpiTarget.trim()) {
      errors.push({
        rowNumber,
        error: "KPI hedefi boş olamaz",
      });
      return;
    }

    if (!row.period || !row.period.trim()) {
      errors.push({
        rowNumber,
        error: "Dönem boş olamaz",
      });
      return;
    }

    if (isNaN(row.actualValue)) {
      errors.push({
        rowNumber,
        error: "Gerçek değer sayı olmalıdır",
      });
      return;
    }

    // Uyarıları kontrol et
    if (row.actualValue < 0) {
      warnings.push({
        rowNumber,
        message: "Gerçek değer negatif olarak girilmiştir",
      });
    }

    if (row.actualValue > 999999) {
      warnings.push({
        rowNumber,
        message: "Gerçek değer çok yüksek görünmektedir",
      });
    }

    valid.push(row);
  });

  return { valid, errors, warnings };
}

/**
 * Excel yükleme sonuçlarını özetle
 */
export function summarizeUploadResult(
  totalRows: number,
  processedRows: number,
  errors: Array<{ rowNumber: number; error: string }>,
  warnings: Array<{ rowNumber: number; message: string }>
): ProcessingResult {
  return {
    success: errors.length === 0,
    totalRows,
    processedRows,
    errors,
    warnings,
  };
}

/**
 * Excel yükleme şeması
 */
export const ExcelUploadSchema = z.object({
  fileName: z.string(),
  csvContent: z.string(),
});

export type ExcelUploadInput = z.infer<typeof ExcelUploadSchema>;
