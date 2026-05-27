import { describe, expect, it } from "vitest";
import {
  parseCSVData,
  validateExcelData,
  summarizeUploadResult,
  type ExcelRow,
} from "./excel-upload";

describe("Excel Upload - CSV Parsing", () => {
  it("should parse valid CSV data correctly", () => {
    const csvContent = `Şube Adı,KPI Hedefi,Dönem,Gerçek Değer,Notlar
Şube 1,Satış Hedefi,2026-01,150000,İyi performans
Şube 2,Müşteri Memnuniyeti,2026-01,92.5,Ortalama`;

    const result = parseCSVData(csvContent);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      branchName: "Şube 1",
      kpiTarget: "Satış Hedefi",
      period: "2026-01",
      actualValue: 150000,
      notes: "İyi performans",
    });
    expect(result[1]).toEqual({
      branchName: "Şube 2",
      kpiTarget: "Müşteri Memnuniyeti",
      period: "2026-01",
      actualValue: 92.5,
      notes: "Ortalama",
    });
  });

  it("should handle empty lines in CSV", () => {
    const csvContent = `Şube Adı,KPI Hedefi,Dönem,Gerçek Değer,Notlar
Şube 1,Satış Hedefi,2026-01,150000,İyi performans

Şube 2,Müşteri Memnuniyeti,2026-01,92.5,Ortalama`;

    const result = parseCSVData(csvContent);

    expect(result).toHaveLength(2);
  });

  it("should skip rows with insufficient columns", () => {
    const csvContent = `Şube Adı,KPI Hedefi,Dönem,Gerçek Değer,Notlar
Şube 1,Satış Hedefi,2026-01,150000,İyi performans
Şube 2,Müşteri Memnuniyeti`;

    const result = parseCSVData(csvContent);

    expect(result).toHaveLength(1);
  });
});

describe("Excel Upload - Data Validation", () => {
  it("should validate correct data", () => {
    const rows: ExcelRow[] = [
      {
        branchName: "Şube 1",
        kpiTarget: "Satış Hedefi",
        period: "2026-01",
        actualValue: 150000,
        notes: "İyi performans",
      },
    ];

    const result = validateExcelData(rows);

    expect(result.valid).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("should detect missing branch name", () => {
    const rows: ExcelRow[] = [
      {
        branchName: "",
        kpiTarget: "Satış Hedefi",
        period: "2026-01",
        actualValue: 150000,
      },
    ];

    const result = validateExcelData(rows);

    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.error).toContain("Şube adı");
  });

  it("should detect missing KPI target", () => {
    const rows: ExcelRow[] = [
      {
        branchName: "Şube 1",
        kpiTarget: "",
        period: "2026-01",
        actualValue: 150000,
      },
    ];

    const result = validateExcelData(rows);

    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.error).toContain("KPI hedefi");
  });

  it("should detect missing period", () => {
    const rows: ExcelRow[] = [
      {
        branchName: "Şube 1",
        kpiTarget: "Satış Hedefi",
        period: "",
        actualValue: 150000,
      },
    ];

    const result = validateExcelData(rows);

    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.error).toContain("Dönem");
  });

  it("should detect invalid actual value", () => {
    const rows: ExcelRow[] = [
      {
        branchName: "Şube 1",
        kpiTarget: "Satış Hedefi",
        period: "2026-01",
        actualValue: NaN,
      },
    ];

    const result = validateExcelData(rows);

    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.error).toContain("sayı");
  });

  it("should warn on negative values", () => {
    const rows: ExcelRow[] = [
      {
        branchName: "Şube 1",
        kpiTarget: "Satış Hedefi",
        period: "2026-01",
        actualValue: -100,
      },
    ];

    const result = validateExcelData(rows);

    expect(result.valid).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.message).toContain("negatif");
  });

  it("should warn on very high values", () => {
    const rows: ExcelRow[] = [
      {
        branchName: "Şube 1",
        kpiTarget: "Satış Hedefi",
        period: "2026-01",
        actualValue: 9999999,
      },
    ];

    const result = validateExcelData(rows);

    expect(result.valid).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.message).toContain("yüksek");
  });
});

describe("Excel Upload - Result Summary", () => {
  it("should create successful summary", () => {
    const result = summarizeUploadResult(10, 10, [], []);

    expect(result.success).toBe(true);
    expect(result.totalRows).toBe(10);
    expect(result.processedRows).toBe(10);
    expect(result.errors).toHaveLength(0);
  });

  it("should create failed summary with errors", () => {
    const errors = [
      { rowNumber: 2, error: "Şube adı boş olamaz" },
      { rowNumber: 3, error: "Gerçek değer sayı olmalıdır" },
    ];

    const result = summarizeUploadResult(10, 8, errors, []);

    expect(result.success).toBe(false);
    expect(result.totalRows).toBe(10);
    expect(result.processedRows).toBe(8);
    expect(result.errors).toHaveLength(2);
  });

  it("should include warnings in summary", () => {
    const warnings = [{ rowNumber: 5, message: "Gerçek değer negatif olarak girilmiştir" }];

    const result = summarizeUploadResult(10, 10, [], warnings);

    expect(result.success).toBe(true);
    expect(result.warnings).toHaveLength(1);
  });
});

describe("Excel Upload - Integration", () => {
  it("should process complete workflow", () => {
    const csvContent = `Şube Adı,KPI Hedefi,Dönem,Gerçek Değer,Notlar
Şube 1,Satış Hedefi,2026-01,150000,İyi performans
Şube 2,Müşteri Memnuniyeti,2026-01,92.5,Ortalama
Şube 3,Operasyon Verimliliği,2026-01,88.0,İyileştirme gerekli`;

    // Parse CSV
    const rows = parseCSVData(csvContent);
    expect(rows).toHaveLength(3);

    // Validate data
    const validation = validateExcelData(rows);
    expect(validation.valid).toHaveLength(3);
    expect(validation.errors).toHaveLength(0);

    // Create summary
    const summary = summarizeUploadResult(
      rows.length,
      validation.valid.length,
      validation.errors,
      validation.warnings
    );

    expect(summary.success).toBe(true);
    expect(summary.totalRows).toBe(3);
    expect(summary.processedRows).toBe(3);
  });
});
