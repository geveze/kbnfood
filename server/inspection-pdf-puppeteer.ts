import puppeteer from 'puppeteer';

interface InspectionData {
  id: number;
  branchName: string;
  branchCode: string;
  restaurantManagerName: string;
  restaurantManagerEmail: string;
  inspectionDate: string;
  createdAt?: string;
  inspectorName: string;
  answers: Array<{
    questionId?: number;
    questionText: string;
    categoryName: string;
    score: number;
    explanation?: string;
    isCritical?: boolean;
    photoUrls?: string[];
    earnedPoints?: number;
    questionPoints?: number;
  }>;
  totalScore: number;
}

/**
 * Puppeteer tabanlı PDF oluşturucu
 * - Türkçe karakter desteği ✓
 * - Profesyonel layout ✓
 * - Font embedding ✓
 * - Doğru puan hesaplaması ✓
 */
export async function generateInspectionPDFWithPuppeteer(
  inspectionData: InspectionData
): Promise<Buffer | Uint8Array> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // HTML şablonunu oluştur
    const html = generateInspectionHTML(inspectionData);

    // Sayfaya içeriği yükle
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // PDF oluştur
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    await page.close();
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('Puppeteer PDF oluşturma hatası:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Türkçe karakter desteğiyle HTML şablonu oluştur
 */
function generateInspectionHTML(data: InspectionData): string {
  // Kategori başına soruları grupla
  const categorizedAnswers = data.answers.reduce(
    (acc, answer) => {
      if (!acc[answer.categoryName]) {
        acc[answer.categoryName] = [];
      }
      acc[answer.categoryName].push(answer);
      return acc;
    },
    {} as Record<string, typeof data.answers>
  );

  // Puan hesapla
  const totalEarned = data.answers.reduce((sum, a) => sum + (a.score || 0), 0);
  const totalMax = data.answers.reduce((sum, a) => sum + (a.questionPoints || 5), 0);
  const percentage = totalMax > 0 ? ((totalEarned / totalMax) * 100).toFixed(2) : '0.00';

  const categoriesHTML = Object.entries(categorizedAnswers)
    .map(
      ([category, answers]) => `
    <div class="category-section">
      <h3 class="category-title">${escapeHtml(category)}</h3>
      <table class="questions-table">
        <thead>
          <tr>
            <th>Soru</th>
            <th>Alınan Puan</th>
            <th>Açıklama</th>
          </tr>
        </thead>
        <tbody>
          ${answers
            .map(
              (answer) => `
            <tr>
              <td class="question-cell">${escapeHtml(answer.questionText)}</td>
              <td class="score-cell">${answer.score}/${answer.questionPoints || 5}</td>
              <td class="explanation-cell">${escapeHtml(answer.explanation || '-')}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Saha Denetim Raporu</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      letter-spacing: normal !important;
      word-spacing: normal !important;
    }

    @page {
      size: A4;
      margin: 20mm;
    }

    body {
      font-family: 'DejaVu Sans', 'Noto Sans', Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      background: white;
    }

    .container {
      max-width: 100%;
      margin: 0;
      padding: 0;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 15px;
    }

    .header h1 {
      font-size: 24px;
      margin-bottom: 5px;
      white-space: normal;
      word-break: break-word;
    }

    .header p {
      font-size: 12px;
      margin: 3px 0;
      white-space: normal;
      word-break: break-word;
    }

    .info-section {
      margin-bottom: 20px;
      display: block;
    }

    .info-row {
      display: flex;
      margin-bottom: 8px;
      page-break-inside: avoid;
    }

    .info-label {
      font-weight: bold;
      width: 150px;
      min-width: 150px;
      white-space: normal;
      word-break: break-word;
    }

    .info-value {
      flex: 1;
      white-space: normal;
      word-break: break-word;
    }

    .score-summary {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }

    .score-summary h3 {
      margin-bottom: 10px;
      font-size: 14px;
    }

    .score-display {
      font-size: 32px;
      font-weight: bold;
      color: #d32f2f;
      text-align: center;
    }

    .score-percentage {
      font-size: 18px;
      text-align: center;
      margin-top: 5px;
    }

    .category-section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }

    .category-title {
      background: #1976d2;
      color: white;
      padding: 10px;
      margin-bottom: 10px;
      font-size: 14px;
      white-space: normal;
      word-break: break-word;
    }

    .questions-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 11px;
    }

    .questions-table thead {
      background: #e0e0e0;
    }

    .questions-table th {
      border: 1px solid #999;
      padding: 8px;
      text-align: left;
      font-weight: bold;
      white-space: normal;
      word-break: break-word;
    }

    .questions-table td {
      border: 1px solid #ddd;
      padding: 8px;
      white-space: normal;
      word-break: break-word;
    }

    .question-cell {
      width: 50%;
    }

    .score-cell {
      width: 15%;
      text-align: center;
    }

    .explanation-cell {
      width: 35%;
    }

    .signature-section {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }

    .signature-box {
      width: 23%;
      text-align: center;
      border-top: 1px solid #333;
      padding-top: 10px;
      font-size: 11px;
    }

    .signature-box p {
      margin: 3px 0;
      white-space: normal;
      word-break: break-word;
    }

    .no-print {
      display: none;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="margin-bottom: 15px;">
        <img src="https://portal.kebanfood.com/logo.png" style="height: 60px; width: auto; object-fit: contain;" alt="Keban Food Logo" />
      </div>
      <h1>KEBAN FOOD ŞUBESİ SAHA DENETİM RAPORU</h1>
      <p>Rapor No: ${data.id}</p>
      <p>Denetim Tarihi: ${data.inspectionDate}</p>
    </div>

    <div class="info-section">
      <div class="info-row">
        <div class="info-label">Şube Adı:</div>
        <div class="info-value">${escapeHtml(data.branchName)}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Şube Kodu:</div>
        <div class="info-value">${escapeHtml(data.branchCode)}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Denetçi Adı:</div>
        <div class="info-value">${escapeHtml(data.inspectorName)}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Restoran Yöneticisi E-posta:</div>
        <div class="info-value">${escapeHtml(data.restaurantManagerEmail)}</div>
      </div>
    </div>

    <div class="score-summary">
      <h3>DENETIM SONUCU</h3>
      <div class="score-display">${percentage}%</div>
      <div class="score-percentage">Alınan Puan: ${totalEarned} / ${totalMax}</div>
    </div>

    <h2 style="margin-bottom: 15px; font-size: 16px;">DENETIM SORULARI VE CEVAPLAR</h2>
    ${categoriesHTML}

    <div class="signature-section">
      <div class="signature-box">
        <p><strong>Denetçi</strong></p>
        <p>${escapeHtml(data.inspectorName)}</p>
        <p style="margin-top: 20px;">İmza</p>
      </div>
      <div class="signature-box">
        <p><strong>Restoran Yöneticisi</strong></p>
        <p>${escapeHtml(data.restaurantManagerName)}</p>
        <p style="margin-top: 20px;">İmza</p>
      </div>
      <div class="signature-box">
        <p><strong>Bölge Müdürü</strong></p>
        <p></p>
        <p style="margin-top: 20px;">İmza</p>
      </div>
      <div class="signature-box">
        <p><strong>İK Müdürü</strong></p>
        <p></p>
        <p style="margin-top: 20px;">İmza</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * HTML karakterlerini escape et
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
