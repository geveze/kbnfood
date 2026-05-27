/**
 * Inspection Print Page to PDF Generator
 * Renders the inspection-print page as PDF using Puppeteer
 */

import puppeteer from "puppeteer";

export async function generateInspectionPrintPDF(
  inspectionId: number,
  baseUrl: string
): Promise<Buffer> {
  let browser: any = null;
  try {
    // Puppeteer başlat
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Sayfayi yukle (public view parametresi ile authentication bypass)
    const url = `${baseUrl}/inspection-print/${inspectionId}?view=public`;
    console.log(`[PDF] Rendering inspection-print page: ${url}`);

    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    // Sayfanin tam olarak yuklenmesin bekle
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Sayfanin icerigi kontrol et
    const content = await page.content();
    console.log(`[PDF] Page content length: ${content.length}`);
    if (content.length < 500) {
      console.warn(`[PDF] Page content seems too short, might not have loaded properly`);
    }

    // PDF oluştur
    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
      printBackground: true,
      scale: 1,
    });

    await page.close();
    return pdfBuffer;
  } catch (error) {
    console.error("[PDF] Error generating inspection print PDF:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
