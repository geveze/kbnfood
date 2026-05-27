/**
 * Performans İzleme Detaylı HTML Rapor Şablonu
 * Ünvan, puanlama, şube, tarih, gelişim durumu ve kategori detaylarını içerir
 */

interface EvaluationItem {
  id: number;
  evaluationId: number;
  category: string;
  subcategory: string;
  itemNumber: number;
  itemDescription: string;
  score: number;
}

interface Evaluation {
  id: number;
  branchId: number;
  evaluationPeriod: string;
  employeeName: string;
  employeePosition: string;
  employeeIdNumber?: string;
  hireDate?: Date;
  evaluationDate: Date;
  evaluatedByManager?: string;
  managerOpinion?: string;
  totalScore: string | number;
  evaluationScale: string;
  createdAt?: Date;
  items?: EvaluationItem[];
}

const getScaleColor = (scale: string): string => {
  switch (scale) {
    case "Yetersiz":
      return "#EF4444"; // Kırmızı
    case "Gelişime Açık":
      return "#F97316"; // Turuncu
    case "Beklenen":
      return "#EAB308"; // Sarı
    case "İyi":
      return "#22C55E"; // Yeşil
    case "Çok İyi":
      return "#3B82F6"; // Mavi
    default:
      return "#6B7280"; // Gri
  }
};

const getPositionColor = (position: string): { primary: string; secondary: string; accent: string } => {
  const positionLower = position.toLowerCase();
  
  if (positionLower.includes("kasa")) {
    return { primary: "#10B981", secondary: "#D1FAE5", accent: "#059669" };
  } else if (positionLower.includes("izgara") && positionLower.includes("yönetici")) {
    return { primary: "#F97316", secondary: "#FFEDD5", accent: "#EA580C" };
  } else if (positionLower.includes("izgara")) {
    return { primary: "#EF4444", secondary: "#FEE2E2", accent: "#DC2626" };
  } else if (positionLower.includes("servis")) {
    return { primary: "#3B82F6", secondary: "#DBEAFE", accent: "#1D4ED8" };
  } else if (positionLower.includes("restoran")) {
    return { primary: "#8B5CF6", secondary: "#F3E8FF", accent: "#7C3AED" };
  }
  
  return { primary: "#6366F1", secondary: "#E0E7FF", accent: "#4F46E5" };
};

const groupItemsByCategory = (items: EvaluationItem[]): Record<string, EvaluationItem[]> => {
  return items.reduce((acc, item) => {
    const key = item.category;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, EvaluationItem[]>);
};

const calculateCategoryScores = (items: EvaluationItem[]): Record<string, number> => {
  const categoryGroups = groupItemsByCategory(items);
  const scores: Record<string, number> = {};
  
  Object.entries(categoryGroups).forEach(([category, categoryItems]) => {
    const validItems = categoryItems.filter(item => item.score > 0);
    if (validItems.length > 0) {
      const average = validItems.reduce((sum, item) => sum + item.score, 0) / validItems.length;
      scores[category] = Math.round(average * 10) / 10;
    }
  });
  
  return scores;
};

export const generatePerformanceMonitoringReport = (evaluations: Evaluation[]): string => { // eslint-disable-line no-eval
  const reportDate = new Date().toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const evaluationsByPosition = evaluations.reduce((acc, evaluation) => {
    const key = evaluation.employeePosition;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(evaluation);
    return acc;
  }, {} as Record<string, Evaluation[]>);

  let html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performans İzleme Detaylı Raporu</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f9fafb;
      color: #1f2937;
      line-height: 1.6;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .header p {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .report-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
      padding: 20px;
      background: white;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
    }
    
    .info-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 5px;
    }
    
    .info-value {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .position-section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    
    .position-header {
      padding: 15px 20px;
      border-radius: 8px 8px 0 0;
      color: white;
      margin-bottom: 0;
    }
    
    .position-header h2 {
      font-size: 20px;
      margin-bottom: 5px;
    }
    
    .position-header p {
      font-size: 13px;
      opacity: 0.9;
    }
    
    .evaluation-card {
      background: white;
      border-radius: 8px;
      margin-bottom: 20px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .evaluation-header {
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 20px;
      align-items: center;
    }
    
    .employee-info h3 {
      font-size: 18px;
      margin-bottom: 5px;
    }
    
    .employee-details {
      font-size: 13px;
      color: #6b7280;
      margin-top: 5px;
    }
    
    .score-badge {
      text-align: center;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
    }
    
    .score-value {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    
    .score-label {
      font-size: 12px;
      opacity: 0.9;
    }
    
    .evaluation-content {
      padding: 20px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .summary-item {
      padding: 15px;
      background: #f9fafb;
      border-radius: 6px;
      border-left: 3px solid #667eea;
    }
    
    .summary-item-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 5px;
    }
    
    .summary-item-value {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .category-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    
    .category-title {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .category-score {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    
    .items-table th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
    }
    
    .items-table tr:hover {
      background: #f9fafb;
    }
    
    .score-cell {
      font-weight: 600;
      text-align: center;
      min-width: 50px;
    }
    
    .opinion-section {
      margin-top: 15px;
      padding: 15px;
      background: #f0f9ff;
      border-left: 3px solid #3b82f6;
      border-radius: 4px;
    }
    
    .opinion-label {
      font-size: 12px;
      font-weight: 600;
      color: #1e40af;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    
    .opinion-text {
      font-size: 13px;
      color: #1f2937;
      line-height: 1.5;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    
    .no-data {
      padding: 20px;
      text-align: center;
      color: #6b7280;
      background: #f9fafb;
      border-radius: 8px;
    }
    
    @media print {
      body {
        background: white;
      }
      .evaluation-card {
        page-break-inside: avoid;
      }
      .position-section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Performans İzleme Detaylı Raporu</h1>
      <p>Keban Food - Personel Performans Değerlendirmesi</p>
    </div>
    
    <div class="report-info">
      <div class="info-item">
        <span class="info-label">Rapor Tarihi</span>
        <span class="info-value">${reportDate}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Toplam Değerlendirme</span>
        <span class="info-value">${evaluations.length}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Ünvan Sayısı</span>
        <span class="info-value">${Object.keys(evaluationsByPosition).length}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Ortalama Puan</span>
        <span class="info-value">${(evaluations.reduce((sum, e) => sum + parseFloat(String(e.totalScore)), 0) / evaluations.length).toFixed(1)}</span>
      </div>
    </div>
  `;

  // Her ünvan için bölüm oluştur
  Object.entries(evaluationsByPosition).forEach(([position, positionEvals]) => {
    const colors = getPositionColor(position);
    const avgScore = positionEvals.reduce((sum, e) => sum + parseFloat(String(e.totalScore)), 0) / positionEvals.length;

    html += `
    <div class="position-section">
      <div class="position-header" style="background-color: ${colors.primary};">
        <h2>${position}</h2>
        <p>${positionEvals.length} değerlendirme | Ortalama Puan: ${avgScore.toFixed(1)}/100</p>
      </div>
    `;

    // Her değerlendirme kartı
    positionEvals.forEach((evaluation) => {
      const scaleColor = getScaleColor(evaluation.evaluationScale);
      const categoryScores = calculateCategoryScores(evaluation.items || []);
      const groupedItems = groupItemsByCategory(evaluation.items || []);

      html += `
      <div class="evaluation-card">
        <div class="evaluation-header">
          <div class="employee-info">
            <h3>${evaluation.employeeName}</h3>
            <div class="employee-details">
              ${evaluation.employeeIdNumber ? `<div>Sicil No: ${evaluation.employeeIdNumber}</div>` : ""}
              <div>Değerlendirme Tarihi: ${new Date(evaluation.evaluationDate).toLocaleDateString("tr-TR")}</div>
              <div>Dönem: ${evaluation.evaluationPeriod}</div>
            </div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">Gelişim Durumu</div>
            <div class="score-badge" style="background-color: ${scaleColor};">
              <div class="score-label">${evaluation.evaluationScale}</div>
            </div>
          </div>
          <div class="score-badge" style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%);">
            <div class="score-value">${parseFloat(String(evaluation.totalScore)).toFixed(1)}</div>
            <div class="score-label">/ 100</div>
          </div>
        </div>
        
        <div class="evaluation-content">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-item-label">Ünvan</div>
              <div class="summary-item-value">${evaluation.employeePosition}</div>
            </div>
            <div class="summary-item">
              <div class="summary-item-label">Değerlendiren</div>
              <div class="summary-item-value">${evaluation.evaluatedByManager || "Belirtilmemiş"}</div>
            </div>
            <div class="summary-item">
              <div class="summary-item-label">Kategori Sayısı</div>
              <div class="summary-item-value">${Object.keys(groupedItems).length}</div>
            </div>
            <div class="summary-item">
              <div class="summary-item-label">Soru Sayısı</div>
              <div class="summary-item-value">${(evaluation.items || []).filter(i => i.score > 0).length}</div>
            </div>
          </div>
          
          ${Object.entries(groupedItems).length > 0 ? `
            <div class="category-section">
              <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 15px; color: #1f2937;">Kategori Detayları</h4>
              ${Object.entries(groupedItems).map(([category, items]) => {
                const categoryScore = categoryScores[category] || 0;
                const validItems = items.filter(i => i.score > 0);
                return `
                <div style="margin-bottom: 20px;">
                  <div class="category-title">
                    ${category}
                    <span class="category-score" style="background-color: ${colors.primary};">${categoryScore.toFixed(1)}</span>
                  </div>
                  <table class="items-table">
                    <thead>
                      <tr>
                        <th>Soru No</th>
                        <th>Açıklama</th>
                        <th class="score-cell">Puan</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${validItems.map(item => `
                        <tr>
                          <td>${item.itemNumber}</td>
                          <td>${item.itemDescription}</td>
                          <td class="score-cell" style="color: ${colors.primary}; font-weight: 600;">${item.score}</td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                </div>
                `;
              }).join("")}
            </div>
          ` : ""}
          
          ${evaluation.managerOpinion ? `
            <div class="opinion-section">
              <div class="opinion-label">Yönetici Görüşü</div>
              <div class="opinion-text">${evaluation.managerOpinion}</div>
            </div>
          ` : ""}
        </div>
      </div>
      `;
    });

    html += `</div>`;
  });

  html += `
    <div style="margin-top: 40px; page-break-before: always;">
      <div class="header" style="margin-bottom: 30px;">
        <h1>📋 Değerlendirme Skalası</h1>
        <p>Performans Değerlendirme Ölçütleri ve Tanımları</p>
      </div>
      
      <table class="items-table" style="margin-bottom: 30px;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Puan</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Toplam Puan</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Skala</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Tanım</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Açıklama</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; font-size: 13px;">1</td>
            <td style="padding: 12px; font-size: 13px;">0-30</td>
            <td style="padding: 12px; font-size: 13px;"><span style="background: #EF4444; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 600;">Yetersiz</span></td>
            <td style="padding: 12px; font-size: 13px;">Beklenen davranışı göstermiyorum.</td>
            <td style="padding: 12px; font-size: 13px;">Yetkinlik göstergelerini gözlemlenmiyor veya nadiren görülüyor. Gelişim ihtiyacı belirgin.</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
            <td style="padding: 12px; font-size: 13px;">2</td>
            <td style="padding: 12px; font-size: 13px;">30-49</td>
            <td style="padding: 12px; font-size: 13px;"><span style="background: #F97316; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 600;">Gelişime Açık</span></td>
            <td style="padding: 12px; font-size: 13px;">Zaman zaman gösteriyor.</td>
            <td style="padding: 12px; font-size: 13px;">Yetkinlik bazı durumlarda gözlemeniyor ama tutarlı değil. Destek ve yönlendirme gerekiyor.</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; font-size: 13px;">3</td>
            <td style="padding: 12px; font-size: 13px;">50-69</td>
            <td style="padding: 12px; font-size: 13px;"><span style="background: #EAB308; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 600;">Beklenen</span></td>
            <td style="padding: 12px; font-size: 13px;">Beklenen düzeyde davranış sergiliyor.</td>
            <td style="padding: 12px; font-size: 13px;">Yetkinlik göstergelerini tutarlı şekilde gözlemeniyor. Görevi başarıyla yerine getiriyor.</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
            <td style="padding: 12px; font-size: 13px;">4</td>
            <td style="padding: 12px; font-size: 13px;">70-84</td>
            <td style="padding: 12px; font-size: 13px;"><span style="background: #22C55E; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 600;">İyi</span></td>
            <td style="padding: 12px; font-size: 13px;">Beklenin üzerinde davranış sergiliyor.</td>
            <td style="padding: 12px; font-size: 13px;">Yetkinlik göstergelerini çoğunlukla yüksek düzeyde ve örnek teşkil ediyor.</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; font-size: 13px;">5</td>
            <td style="padding: 12px; font-size: 13px;">85-100</td>
            <td style="padding: 12px; font-size: 13px;"><span style="background: #3B82F6; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 600;">Çok İyi</span></td>
            <td style="padding: 12px; font-size: 13px;">Üst düzeyde ve sürekli olarak sergiliyor.</td>
            <td style="padding: 12px; font-size: 13px;">Yetkinlikte uzman, başkalarına mentorluk yapabilecek düzeyde. Katma değer yaratıyor.</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="footer">
      <p>Bu rapor otomatik olarak oluşturulmuştur. ${reportDate} tarihinde hazırlanmıştır.</p>
      <p>Keban Food İnsan Kaynakları Departmanı</p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
};
