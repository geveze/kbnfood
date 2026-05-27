import ExcelJS from "exceljs";
// import { getPositionById } from "./db";

export async function generateOpenPifExcel(data: {
  positionId: number;
  employeeName: string;
  employeeIdNumber: string;
  evaluatedByName: string;
  evaluationDate: Date;
  answers: Record<number, number>;
  categoryScores: Record<number, { name: string; score: number; maxScore: number }>;
  totalScore: number;
}) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Değerlendirme");

  // Set column widths
  worksheet.columns = [
    { width: 40 },
    { width: 20 },
    { width: 15 },
  ];

  // Header section
  let row = 1;
  worksheet.mergeCells(`A${row}:C${row}`);
  const headerCell = worksheet.getCell(`A${row}`);
  headerCell.value = "PERFORMANS İZLEME FORMU (PİF)";
  headerCell.font = { bold: true, size: 14 };
  headerCell.alignment = { horizontal: "center", vertical: "middle" };
  row++;

  // Position info
  // const position = await getPositionById(data.positionId);
  worksheet.mergeCells(`A${row}:C${row}`);
  const positionCell = worksheet.getCell(`A${row}`);
  positionCell.value = `Pozisyon: Bilinmiyor`;
  positionCell.font = { bold: true, size: 12 };
  positionCell.alignment = { horizontal: "center", vertical: "middle" };
  row += 2;

  // Employee info
  worksheet.getCell(`A${row}`).value = "Personel Adı:";
  worksheet.getCell(`B${row}`).value = data.employeeName;
  row++;

  worksheet.getCell(`A${row}`).value = "Sicil Numarası:";
  worksheet.getCell(`B${row}`).value = data.employeeIdNumber;
  row++;

  worksheet.getCell(`A${row}`).value = "Değerlendirmeyi Yapan:";
  worksheet.getCell(`B${row}`).value = data.evaluatedByName;
  row++;

  worksheet.getCell(`A${row}`).value = "Değerlendirme Tarihi:";
  worksheet.getCell(`B${row}`).value = data.evaluationDate.toLocaleDateString("tr-TR");
  row += 2;

  // Category scores
  worksheet.getCell(`A${row}`).value = "Kategori";
  worksheet.getCell(`B${row}`).value = "Puan";
  worksheet.getCell(`C${row}`).value = "Maksimum";
  const headerRow = worksheet.getRow(row);
  headerRow.font = { bold: true };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD3D3D3" } };
  row++;

  for (const [categoryId, categoryData] of Object.entries(data.categoryScores)) {
    worksheet.getCell(`A${row}`).value = categoryData.name;
    worksheet.getCell(`B${row}`).value = categoryData.score;
    worksheet.getCell(`C${row}`).value = categoryData.maxScore;
    row++;
  }

  row++;
  worksheet.getCell(`A${row}`).value = "TOPLAM PUAN";
  worksheet.getCell(`B${row}`).value = data.totalScore.toFixed(2);
  const totalRow = worksheet.getRow(row);
  totalRow.font = { bold: true };
  totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };

  return workbook;
}
