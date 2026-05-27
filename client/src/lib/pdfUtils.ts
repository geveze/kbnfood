/**
 * PDF generation utility functions using html2pdf.js
 */

export interface PDFOptions {
  filename: string;
  margin: [number, number, number, number];
  image: { type: string; quality: number };
  html2canvas: { scale: number; useCORS: boolean; letterRendering: boolean };
  jsPDF: { unit: string; format: string; orientation: string };
  pagebreak: { mode: string[] };
}

export const DEFAULT_PDF_OPTIONS: PDFOptions = {
  filename: 'denetim_rapor.pdf',
  margin: [4, 0, 6, 0],
  image: { type: 'jpeg', quality: 0.95 },
  html2canvas: { scale: 2, useCORS: true, letterRendering: true },
  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  pagebreak: { mode: ['css', 'legacy'] },
};

export async function generatePDF(
  elementId: string,
  filename: string,
  options?: Partial<PDFOptions>
): Promise<boolean> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with id "${elementId}" not found`);
      return false;
    }

    const html2pdf = (window as any).html2pdf;
    if (!html2pdf) {
      console.error('html2pdf not loaded');
      return false;
    }

    const finalOptions = {
      ...DEFAULT_PDF_OPTIONS,
      filename,
      ...options,
    };

    await html2pdf().set(finalOptions).from(element).save();
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}

export function generatePDFFilename(
  date: Date | string,
  branchCode: string,
  reportNo: string
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = d.toISOString().split('T')[0].replace(/-/g, '');
  return `denetim_${dateStr}_${branchCode}_${reportNo}.pdf`;
}
