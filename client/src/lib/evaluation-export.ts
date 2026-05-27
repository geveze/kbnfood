export interface EvaluationData {
  id: number;
  employeeName: string;
  employeePosition: string;
  employeeIdNumber?: string;
  hireDate?: Date;
  evaluationDate: Date;
  evaluationPeriod: string;
  evaluatedByManager?: string;
  totalScore: number;
  evaluationScale: string;
  managerOpinion?: string;
  scoreExplanations?: Record<string, string>;
  items?: Array<{
    id: string;
    category: string;
    subcategory: string;
    itemNumber: number;
    description: string;
    score: number;
  }>;
}

// Ünvana göre renk paleti
const getPositionColors = (position: string) => {
  const colorMap: Record<string, { primary: string; secondary: string; accent: string; light: string }> = {
    "Kasa": { primary: "#2E7D32", secondary: "#81C784", accent: "#4CAF50", light: "#E8F5E9" },
    "Izgara": { primary: "#D32F2F", secondary: "#EF5350", accent: "#F44336", light: "#FFEBEE" },
    "Servis": { primary: "#1976D2", secondary: "#42A5F5", accent: "#2196F3", light: "#E3F2FD" },
    "Izgara Yöneticisi": { primary: "#F57C00", secondary: "#FFB74D", accent: "#FF9800", light: "#FFF3E0" },
    "Restoran Yönetimi": { primary: "#7B1FA2", secondary: "#BA68C8", accent: "#9C27B0", light: "#F3E5F5" },
  };
  
  return colorMap[position] || { primary: "#1a5f7a", secondary: "#42A5F5", accent: "#2196F3", light: "#E3F2FD" };
};

/**
 * PDF olarak değerlendirme raporu oluştur ve S3'e yükle
 */
export const generateEvaluationPDF = async (evaluation: EvaluationData): Promise<{ pdfBlob: Blob; pdfUrl?: string }> => {
  try {
    const colors = getPositionColors(evaluation.employeePosition);
    
    // Keban Food logosu (Base64 encoded)
    const logoSvg = `<svg width="60" height="40" viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg"><text x="10" y="70" font-size="60" font-weight="bold" font-family="Arial, sans-serif" fill="#333">Keban</text><text x="200" y="70" font-size="60" font-weight="bold" font-family="Arial, sans-serif" fill="#DC143C">Food</text><text x="360" y="30" font-size="20" font-weight="bold" font-family="Arial, sans-serif" fill="#DC143C">TM</text></svg>`;
    const logoUrl = `data:image/svg+xml;base64,${btoa(logoSvg)}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Performans İzleme Formu - ${evaluation.employeePosition}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          @page {
            size: A4;
            margin: 5mm;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .page-break {
              page-break-after: always;
            }
          }
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.3;
            color: #333;
            background: white;
            font-size: 9px;
          }
          .container {
            max-height: 1188mm;
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            overflow: hidden;
          }
          .page {
            page-break-after: auto;
            max-height: auto;
            page-break-inside: auto;
            padding: 8mm 8mm;
            box-sizing: border-box;
          }
          .page:last-child {
            page-break-after: avoid;
          }
          .header {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            border-bottom: 3px solid ${colors.primary};
            padding-bottom: 6px;
            background: ${colors.light};
          }
          .logo {
            width: 60px;
            height: 40px;
            margin-right: 15px;
            flex-shrink: 0;
          }
          .header-text {
            flex: 1;
          }
          .header-text h1 {
            font-size: 13px;
            color: ${colors.primary};
            margin: 0;
            font-weight: bold;
          }
          .header-text p {
            font-size: 8px;
            color: #666;
            margin: 1px 0 0 0;
          }
          .position-badge {
            display: inline-block;
            background: ${colors.primary};
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: bold;
            margin-left: auto;
          }
          .section {
            margin-bottom: 6px;
            page-break-inside: auto;
          }
          .section-title {
            font-size: 9px;
            font-weight: bold;
            color: white;
            background-color: ${colors.primary};
            padding: 3px 6px;
            margin-bottom: 4px;
            border-left: 4px solid ${colors.accent};
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            margin-bottom: 6px;
          }
          .info-item {
            border: 1px solid ${colors.secondary};
            padding: 3px 5px;
            background: ${colors.light};
          }
          .info-label {
            font-weight: bold;
            font-size: 8px;
            color: ${colors.primary};
          }
          .info-value {
            font-size: 9px;
            color: #333;
            margin-top: 1px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
            margin-bottom: 6px;
          }
          .items-table th {
            background-color: ${colors.primary};
            color: white;
            padding: 3px 4px;
            text-align: left;
            font-weight: bold;
            border: 1px solid ${colors.primary};
          }
          .items-table td {
            padding: 2px 3px;
            border: 1px solid #ddd;
            vertical-align: top;
          }
          .items-table tr:nth-child(even) {
            background-color: ${colors.light};
          }
          .category-header {
            background-color: ${colors.secondary}33;
            font-weight: bold;
            color: ${colors.primary};
          }
          .score-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: bold;
            text-align: center;
            min-width: 25px;
          }
          .score-1 { background-color: #ff6b6b; color: white; }
          .score-2 { background-color: #ffa94d; color: white; }
          .score-3 { background-color: #ffd93d; color: #333; }
          .score-4 { background-color: #6bcf7f; color: white; }
          .score-5 { background-color: ${colors.accent}; color: white; }
          .opinion-box {
            border: 2px solid ${colors.secondary};
            padding: 5px;
            background: ${colors.light};
            border-radius: 3px;
            min-height: 25px;
            font-size: 8px;
            line-height: 1.2;
          }
          .signature-section {
            margin-top: 4px;
            page-break-inside: auto;
          }
          .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 8px;
            margin-top: 12px;
          }
          .signature-box {
            text-align: center;
            border-top: 2px solid ${colors.primary};
            padding-top: 5px;
          }
          .signature-label {
            font-size: 7px;
            font-weight: bold;
            color: ${colors.primary};
            margin-top: 3px;
          }
          .evaluation-summary {
            background: ${colors.light};
            border: 2px solid ${colors.primary};
            padding: 6px;
            border-radius: 3px;
            margin-bottom: 6px;
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
            font-size: 9px;
          }
          .summary-label {
            font-weight: bold;
            color: ${colors.primary};
          }
          .summary-value {
            color: #333;
            font-weight: bold;
          }
          .scale-info {
            font-size: 7px;
            color: #666;
            margin-top: 3px;
            line-height: 1.2;
          }
          .footer {
            margin-top: 8px;
            padding-top: 5px;
            border-top: 2px solid ${colors.primary};
            font-size: 7px;
            color: ${colors.primary};
            text-align: center;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="page">
            <div class="header">
              <img src="${logoUrl}" alt="Keban Food" class="logo">
              <div class="header-text">
                <h1>Performans İzleme Formu (PİF)</h1>
                <p>Keban Food - Personel Performans Değerlendirmesi</p>
              </div>
              <div class="position-badge">${evaluation.employeePosition}</div>
            </div>

            <div class="section">
              <div class="section-title">BAŞLIK BİLGİLERİ</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Personel Adı Soyadı</div>
                  <div class="info-value">${evaluation.employeeName}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Görevi/Ünvan</div>
                  <div class="info-value">${evaluation.employeePosition}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Sicil No (T.C.)</div>
                  <div class="info-value">${evaluation.employeeIdNumber || "-"}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Değerlendirme Dönemi</div>
                  <div class="info-value">${evaluation.evaluationPeriod}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">DEĞERLENDİRME ÖZETI</div>
              <div class="evaluation-summary">
                <div class="summary-item">
                  <span class="summary-label">Toplam Puan:</span>
                  <span class="summary-value">${evaluation.totalScore}/100</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Değerlendirme Skalası:</span>
                  <span class="summary-value">${evaluation.evaluationScale}</span>
                </div>
              </div>
            </div>

            ${evaluation.items && evaluation.items.length > 0 ? `
            <div class="section">
              <div class="section-title">SORU DETAYLARI</div>
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 5%;">No</th>
                    <th style="width: 20%;">Kategori</th>
                    <th style="width: 65%;">Soru</th>
                    <th style="width: 10%; text-align: center;">Puan</th>
                  </tr>
                </thead>
                <tbody>
                  ${evaluation.items.map((item) => `
                    <tr>
                      <td>${item.itemNumber}</td>
                      <td>${item.category}</td>
                      <td>
                        <div>${item.description}</div>
                        ${(item.score === 1 || item.score === 5) && evaluation.scoreExplanations?.[item.id] ? `
                          <div style="margin-top: 3px; padding-top: 3px; border-top: 1px solid #ddd; font-size: 8px; color: #d9534f; font-weight: bold;">
                            ${item.score === 1 ? "Neden 1 puan:" : "Neden 5 puan:"} ${evaluation.scoreExplanations[item.id]}
                          </div>
                        ` : ""}
                      </td>
                      <td style="text-align: center;"><span class="score-badge score-${item.score}">${item.score}</span></td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
            ` : ""}

            ${evaluation.managerOpinion ? `
            <div class="section">
              <div class="section-title">YÖNETİCİ GÖRÜŞÜ</div>
              <div class="opinion-box">${evaluation.managerOpinion}</div>
            </div>
            ` : ""}

            <div class="signature-section">
              <div class="section-title">İMZA VE ONAY</div>
              <div class="signature-grid">
                <div class="signature-box">
                  <div style="height: 30px;"></div>
                  <div class="signature-label">Değerlendirme Yapılan Personel</div>
                </div>
                <div class="signature-box">
                  <div style="height: 30px;"></div>
                  <div class="signature-label">Değerlendirmeyi Yapan</div>
                  <div style="font-size: 7px; color: #666; margin-top: 1px;">${evaluation.evaluatedByManager || ""}</div>
                </div>
                <div class="signature-box">
                  <div style="height: 30px;"></div>
                  <div class="signature-label">İlgili Operasyon / Bölge Müdürü</div>
                </div>
                <div class="signature-box">
                  <div style="height: 30px;"></div>
                  <div class="signature-label">İlgili Mutfak Operasyon Müdürü / Yöneticisi</div>
                </div>
              </div>
            </div>

            <div class="footer">
              ✓ Bu rapor ${new Date().toLocaleDateString("tr-TR")} tarihinde oluşturulmuştur
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // HTML'i Blob'a dönüştür
    const blob = new Blob([htmlContent], { type: "text/html" });
    
    // PDF'i S3'e yükle (backend'den çağrılacak)
    return { pdfBlob: blob };
  } catch (error) {
    console.error("PDF oluşturma hatası:", error);
    throw error;
  }
};

export const exportToPDF = async (evaluation: EvaluationData): Promise<{ pdfBlob: Blob; pdfUrl?: string }> => {
  try {
    const colors = getPositionColors(evaluation.employeePosition);
    
    // Keban Food logosu (Base64 encoded)
    const logoSvg = `<svg width="60" height="40" viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg"><text x="10" y="70" font-size="60" font-weight="bold" font-family="Arial, sans-serif" fill="#333">Keban</text><text x="200" y="70" font-size="60" font-weight="bold" font-family="Arial, sans-serif" fill="#DC143C">Food</text><text x="360" y="30" font-size="20" font-weight="bold" font-family="Arial, sans-serif" fill="#DC143C">TM</text></svg>`;
    const logoUrl = `data:image/svg+xml;base64,${btoa(logoSvg)}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Değerlendirme Raporu</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; color: #333; background: white; }
          .container { width: 100%; margin: 0 auto; }
          .page { page-break-after: always; padding: 20px; }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 3px solid ${colors.primary};
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .logo { height: 50px; width: auto; }
          .header-text { flex: 1; margin-left: 20px; }
          .header-text h1 { font-size: 18px; color: ${colors.primary}; margin-bottom: 5px; }
          .header-text p { font-size: 12px; color: #666; }
          .position-badge {
            background: ${colors.accent};
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 12px;
          }
          .section { margin-bottom: 20px; }
          .section-title {
            background: ${colors.primary};
            color: white;
            padding: 8px 12px;
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 10px;
            border-radius: 2px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 15px;
          }
          .info-item { border: 1px solid #ddd; padding: 8px; border-radius: 2px; }
          .info-label { font-size: 9px; font-weight: bold; color: ${colors.primary}; margin-bottom: 3px; }
          .info-value { font-size: 10px; color: #333; }
          .table-wrapper { overflow-x: auto; margin-bottom: 15px; }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
          }
          th {
            background: ${colors.light};
            border: 1px solid ${colors.primary};
            padding: 5px;
            text-align: left;
            font-weight: bold;
            color: ${colors.primary};
          }
          td {
            border: 1px solid #ddd;
            padding: 5px;
          }
          tr:nth-child(even) { background: ${colors.light}; }
          .score-cell {
            text-align: center;
            font-weight: bold;
            border-radius: 3px;
            padding: 3px;
          }
          .score-1 { background: #ff6b6b; color: white; }
          .score-2 { background: #ffa94d; color: white; }
          .score-3 { background: #ffd93d; color: #333; }
          .score-4 { background: #6bcf7f; color: white; }
          .score-5 { background: ${colors.accent}; color: white; }
          .evaluation-summary {
            background: ${colors.light};
            border: 2px solid ${colors.primary};
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 10px;
          }
          .summary-label { font-weight: bold; color: ${colors.primary}; }
          .summary-value { color: #333; font-weight: bold; }
          .opinion-box {
            border: 2px solid ${colors.secondary};
            padding: 10px;
            background: ${colors.light};
            border-radius: 4px;
            min-height: 40px;
            font-size: 9px;
            line-height: 1.4;
          }
          .signature-section { margin-top: 30px; }
          .signature-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-top: 20px;
          }
          .signature-box {
            text-align: center;
            border-top: 2px solid ${colors.primary};
            padding-top: 10px;
          }
          .signature-label {
            font-size: 8px;
            font-weight: bold;
            color: ${colors.primary};
            margin-top: 5px;
          }
          .scale-info {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
            margin-bottom: 15px;
          }
          .scale-item {
            border: 2px solid ${colors.primary};
            padding: 8px;
            text-align: center;
            border-radius: 4px;
            background: ${colors.light};
          }
          .scale-range {
            font-size: 9px;
            font-weight: bold;
            color: ${colors.primary};
            margin-bottom: 4px;
          }
          .scale-label {
            font-size: 8px;
            font-weight: bold;
            color: #333;
          }
          .scale-1 {
            background-color: #ff6b6b;
            border-color: #d32f2f !important;
          }
          .scale-1 .scale-range,
          .scale-1 .scale-label {
            color: white;
          }
          .scale-2 {
            background-color: #ffa94d;
            border-color: #f57c00 !important;
          }
          .scale-2 .scale-range,
          .scale-2 .scale-label {
            color: white;
          }
          .scale-3 {
            background-color: #ffd93d;
            border-color: #f9a825 !important;
          }
          .scale-3 .scale-range,
          .scale-3 .scale-label {
            color: #333;
          }
          .scale-4 {
            background-color: #6bcf7f;
            border-color: #2e7d32 !important;
          }
          .scale-4 .scale-range,
          .scale-4 .scale-label {
            color: white;
          }
          .scale-5 {
            background-color: #42a5f5;
            border-color: #1976d2 !important;
          }
          .scale-5 .scale-range,
          .scale-5 .scale-label {
            color: white;
          }
          .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 2px solid ${colors.primary};
            font-size: 8px;
            color: ${colors.primary};
            text-align: center;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="page">
            <div class="header">
              <img src="${logoUrl}" alt="Keban Food" class="logo">
              <div class="header-text">
                <h1>Performans İzleme Formu (PİF)</h1>
                <p>Keban Food - Personel Performans Değerlendirmesi</p>
              </div>
              <div class="position-badge">${evaluation.employeePosition}</div>
            </div>

            <div class="section">
              <div class="section-title">BAŞLIK BİLGİLERİ</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Personel Adı Soyadı</div>
                  <div class="info-value">${evaluation.employeeName}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Görevi/Ünvan</div>
                  <div class="info-value">${evaluation.employeePosition}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Sicil No</div>
                  <div class="info-value">${evaluation.employeeIdNumber || "-"}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Işe Giriş Tarihi</div>
                  <div class="info-value">${evaluation.hireDate ? new Date(evaluation.hireDate).toLocaleDateString("tr-TR") : "-"}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Değerlendirme Tarihi</div>
                  <div class="info-value">${evaluation.evaluationDate ? new Date(evaluation.evaluationDate).toLocaleDateString("tr-TR") : "-"}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Değerlendirme Dönemi</div>
                  <div class="info-value">${evaluation.evaluationPeriod}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">DEĞERLENDİRME ÖZETI</div>
              <div class="evaluation-summary">
                <div class="summary-item">
                  <span class="summary-label">Toplam Puan:</span>
                  <span class="summary-value">${evaluation.totalScore}/100</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Değerlendirme Skalası:</span>
                  <span class="summary-value">${evaluation.evaluationScale}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Değerlendirmeyi Yapan:</span>
                  <span class="summary-value">${evaluation.evaluatedByManager || "-"}</span>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">DEĞERLENDİRME SKALASI</div>
              <div class="scale-info">
                <div class="scale-item scale-1">
                  <div class="scale-range">0-30 Puan</div>
                  <div class="scale-label">YETERSİZ</div>
                </div>
                <div class="scale-item scale-2">
                  <div class="scale-range">30-49 Puan</div>
                  <div class="scale-label">GELİŞİME AÇIK</div>
                </div>
                <div class="scale-item scale-3">
                  <div class="scale-range">50-69 Puan</div>
                  <div class="scale-label">BEKLENEN</div>
                </div>
                <div class="scale-item scale-4">
                  <div class="scale-range">70-84 Puan</div>
                  <div class="scale-label">İYİ</div>
                </div>
                <div class="scale-item scale-5">
                  <div class="scale-range">85-100 Puan</div>
                  <div class="scale-label">ÇOK İYİ</div>
                </div>
              </div>
            </div>

            ${evaluation.items && evaluation.items.length > 0 ? `
            <div class="section">
              <div class="section-title">SORU DETAYLARI</div>
              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Kategori</th>
                      <th>Soru</th>
                      <th>Puan</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${evaluation.items.map((item) => `
                      <tr>
                        <td>${item.category}</td>
                        <td>${item.description}</td>
                        <td class="score-cell score-${item.score}">${item.score}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            </div>
            ` : ""}

            ${evaluation.managerOpinion ? `
            <div class="section">
              <div class="section-title">YÖNETİCİ GÖRÜŞÜ</div>
              <div class="opinion-box">${evaluation.managerOpinion}</div>
            </div>
            ` : ""}
            <div class="signature-section">
              <div class="section-title">İMZA VE ONAY</div>
              <div class="signature-grid">
                <div class="signature-box">
                  <div style="height: 30px;"></div>
                  <div class="signature-label">Değerlendirme Yapılan Personel</div>
                </div>
                <div class="signature-box">
                  <div style="height: 30px;"></div>
                  <div class="signature-label">Değerlendirmeyi Yapan</div>
                  <div style="font-size: 7px; color: #666; margin-top: 1px;">${evaluation.evaluatedByManager || ""}</div>
                </div>
                <div class="signature-box">
                  <div style="height: 30px;"></div>
                  <div class="signature-label">İlgili Operasyon / Bölge Müdürü</div>
                </div>
                <div class="signature-box">
                  <div style="height: 30px;"></div>
                  <div class="signature-label">İlgili Mutfak Operasyon Müdürü / Yöneticisi</div>
                </div>
              </div>
            </div>
            <div class="footer">
              ✓ Bu rapor ${new Date().toLocaleDateString("tr-TR")} tarihinde oluşturulmuştur
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    // Mobil Safari uyumluluğu için iframe kullan
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    if (iframe.contentDocument) {
      iframe.contentDocument.write(htmlContent);
      iframe.contentDocument.close();
      
      // Mobil Safari'de print dialog açmak için setTimeout kullan
      setTimeout(() => {
        iframe.focus();
        iframe.contentWindow?.print();
      }, 500);
      
      // 2 saniye sonra iframe'i kaldır
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    } else {
      // Fallback: window.open kullan
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    }
    return { pdfBlob: new Blob(), pdfUrl: undefined };
  } catch (error) {
    console.error("PDF oluşturma hatası:", error);
    return { pdfBlob: new Blob(), pdfUrl: undefined };
  }
};

export const saveToSharePoint = async (evaluation: EvaluationData) => {
  // SharePoint entegrasyonu için placeholder
  console.log("SharePoint'e kaydediliyor:", evaluation);
};
