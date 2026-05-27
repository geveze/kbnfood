import puppeteer from 'puppeteer';

/**
 * Puppeteer kullanarak inspection-print/{id} sayfasının tam HTML/CSS çıktısını PDF'e dönüştür
 * - Orijinal tasarımı korur ✓
 * - Tüm CSS stillerini içerir ✓
 * - Responsive layout destekler ✓
 */
/**
 * Delay helper function
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateInspectionPDFFromPage(
  inspectionId: number,
  baseUrl: string
): Promise<Buffer> {
  let browser;
  try {
    console.log(`[PDF Renderer] Starting PDF generation for inspection ${inspectionId}`);
    console.log(`[PDF Renderer] Base URL provided: ${baseUrl}`);
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Sayfa boyutunu A4 olarak ayarla
    await page.setViewport({
      width: 1024,
      height: 1366,
      deviceScaleFactor: 2,
    });

    // inspection-print sayfasına git
    // Not: Localhost yerine gerçek frontend URL'sini kullan
    const pageUrl = `${baseUrl}/inspection-print/${inspectionId}`;
    console.log(`[PDF Renderer] Navigating to: ${pageUrl}`);
    
    await page.goto(pageUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Sayfanın tam yüklenmesini bekle (tüm resimler ve stiller)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // PDF oluştur - orijinal tasarımı koruyarak
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
      scale: 1,
    });

    console.log(`[PDF Renderer] PDF generated successfully, size: ${pdfBuffer.length} bytes`);
    
    await page.close();
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('[PDF Renderer] Error generating PDF:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
