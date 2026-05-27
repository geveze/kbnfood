/**
 * PDF Upload Service
 * Generates inspection PDF and uploads to S3/CloudFront
 */

import { generateInspectionPrintPDF } from "./inspection-print-pdf";
import { storagePut } from "./storage";

export async function generateAndUploadInspectionPDF(
  inspectionId: number,
  baseUrl: string
): Promise<string> {
  try {
    console.log(`[PDF Upload] Starting PDF generation for inspection ${inspectionId}`);

    // PDF oluştur
    const pdfBuffer = await generateInspectionPrintPDF(inspectionId, baseUrl);
    console.log(`[PDF Upload] PDF generated, size: ${pdfBuffer.length} bytes`);

    // S3'e yükle
    const fileName = `denetim_${inspectionId}_${new Date().getTime()}.pdf`;
    const relKey = `inspections/${fileName}`;

    const { url } = await storagePut(relKey, pdfBuffer, "application/pdf");
    console.log(`[PDF Upload] PDF uploaded successfully: ${url}`);

    return url;
  } catch (error) {
    console.error(`[PDF Upload] Error generating/uploading PDF:`, error);
    throw error;
  }
}
