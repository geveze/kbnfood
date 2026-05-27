import axios from 'axios';

export async function generateInspectionPdfHtml(data: any): Promise<string> {
  // Fetch logo from URL
  let logoBase64 = '';
  try {
    const response = await axios.get('https://portal.kebanfood.com/logo.png', {
      responseType: 'arraybuffer',
      timeout: 5000
    });
    logoBase64 = Buffer.from(response.data).toString('base64');
  } catch (err) {
    console.warn('Logo yüklenemedi:', err);
  }

  const logoImg = logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" style="height: 60px; width: auto;" />` : '';

  // Calculate weighted score
  const categoryScores = calculateCategoryScores(data.answers);
  const weightedScore = calculateWeightedScore(categoryScores);

  // Format dates
  const inspectionDate = new Date(data.inspectionDate).toLocaleDateString('tr-TR');

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Şube Denetim Raporu</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'DejaVu Sans', 'Arial Unicode MS', Arial, sans-serif;
      letter-spacing: normal !important;
      word-spacing: normal !important;
    }

    @page {
      size: A4;
      margin: 20mm;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-after: always;
      }
    }

    body {
      font-size: 11px;
      line-height: 1.4;
      color: #333;
      background: white;
    }

    .container {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      padding: 0;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #d32f2f;
    }

    .logo-section {
      flex: 0 0 auto;
    }

    .logo-section img {
      height: 60px;
      width: auto;
      object-fit: contain;
    }

    .title-section {
      flex: 1;
      text-align: center;
      margin: 0 20px;
    }

    .title-section h1 {
      font-size: 16px;
      font-weight: bold;
      color: #d32f2f;
      margin-bottom: 5px;
      white-space: normal;
      word-break: break-word;
    }

    .title-section p {
      font-size: 10px;
      color: #666;
      white-space: normal;
      word-break: break-word;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .info-item {
      display: block;
    }

    .info-label {
      font-weight: bold;
      font-size: 10px;
      color: #666;
      margin-bottom: 3px;
      white-space: normal;
      word-break: break-word;
    }

    .info-value {
      font-size: 11px;
      color: #333;
      white-space: normal;
      word-break: break-word;
    }

    .section {
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 12px;
      font-weight: bold;
      color: white;
      background: #d32f2f;
      padding: 8px 10px;
      margin-bottom: 10px;
      white-space: normal;
      word-break: break-word;
    }

    .score-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 15px;
    }

    .score-card {
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      text-align: center;
    }

    .score-label {
      font-size: 10px;
      color: #666;
      margin-bottom: 5px;
      white-space: normal;
      word-break: break-word;
    }

    .score-value {
      font-size: 18px;
      font-weight: bold;
      color: #d32f2f;
    }

    .score-percentage {
      font-size: 12px;
      color: #d32f2f;
      font-weight: bold;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }

    th {
      background: #f0f0f0;
      padding: 8px;
      text-align: left;
      font-weight: bold;
      font-size: 10px;
      border: 1px solid #ddd;
      white-space: normal;
      word-break: break-word;
    }

    td {
      padding: 8px;
      border: 1px solid #ddd;
      font-size: 10px;
      white-space: normal;
      word-break: break-word;
    }

    tr:nth-child(even) {
      background: #f9f9f9;
    }

    .question-text {
      font-weight: 500;
      white-space: normal;
      word-break: break-word;
    }

    .answer-yes {
      color: #4caf50;
      font-weight: bold;
    }

    .answer-no {
      color: #d32f2f;
      font-weight: bold;
    }

    .evaluation-section {
      padding: 12px;
      background: #f9f9f9;
      border: 1px solid #ddd;
      margin-bottom: 10px;
      border-radius: 4px;
    }

    .evaluation-title {
      font-weight: bold;
      color: #d32f2f;
      margin-bottom: 5px;
      font-size: 11px;
      white-space: normal;
      word-break: break-word;
    }

    .evaluation-content {
      font-size: 10px;
      line-height: 1.5;
      white-space: normal;
      word-break: break-word;
    }

    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      font-size: 9px;
      color: #999;
      text-align: center;
    }

    .page-break {
      page-break-after: always;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        ${logoImg}
      </div>
      <div class="title-section">
        <h1>Şube Denetim Raporu</h1>
        <p>Keban Food İnsan Kaynakları</p>
      </div>
    </div>

    <!-- Bilgi Kartı -->
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Şube Adı</div>
        <div class="info-value">${escapeHtml(data.branchName)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Denetim Tarihi</div>
        <div class="info-value">${inspectionDate}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Denetçi Adı</div>
        <div class="info-value">${escapeHtml(data.inspectorName)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Denetçi E-posta</div>
        <div class="info-value">${escapeHtml(data.inspectorEmail)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Şube Müdürü</div>
        <div class="info-value">${escapeHtml(data.restaurantManagerName)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Şube Müdürü E-posta</div>
        <div class="info-value">${escapeHtml(data.restaurantManagerEmail)}</div>
      </div>
    </div>

    <!-- Puan Özeti -->
    <div class="section">
      <div class="section-title">Denetim Puanı Özeti</div>
      <div class="score-box">
        <div class="score-card">
          <div class="score-label">Toplam Puan</div>
          <div class="score-percentage">${data.totalScore.toFixed(2)}%</div>
        </div>
        <div class="score-card">
          <div class="score-label">Kritik Puan Düşümü</div>
          <div class="score-percentage">${data.criticalPenalty}</div>
        </div>
      </div>
    </div>

    <!-- Kategori Puanları -->
    <div class="section">
      <div class="section-title">Kategori Bazlı Puanlar</div>
      <table>
        <thead>
          <tr>
            <th>Kategori</th>
            <th>Puan</th>
            <th>Ağırlık</th>
            <th>Ağırlıklı Puan</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(categoryScores).map(([category, score]: any) => `
            <tr>
              <td>${escapeHtml(category)}</td>
              <td class="score-percentage">${score.score.toFixed(2)}%</td>
              <td>${score.weight}%</td>
              <td class="score-percentage">${(score.score * score.weight / 100).toFixed(2)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Denetim Soruları ve Cevapları -->
    <div class="section page-break">
      <div class="section-title">Denetim Soruları ve Cevapları</div>
      <table>
        <thead>
          <tr>
            <th style="width: 50%;">Soru</th>
            <th style="width: 15%;">Cevap</th>
            <th style="width: 15%;">Puan</th>
            <th style="width: 20%;">Açıklama</th>
          </tr>
        </thead>
        <tbody>
          ${data.answers.map((answer: any) => `
            <tr>
              <td class="question-text">${escapeHtml(answer.questionText || '')}</td>
              <td class="answer-${answer.answer === 'E' ? 'yes' : 'no'}">
                ${answer.answer === 'E' ? 'EVET' : 'HAYIR'}
              </td>
              <td>${answer.earnedPoints}/${answer.questionPoints}</td>
              <td>${escapeHtml(answer.explanation || '')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Denetçi Değerlendirmesi -->
    <div class="section page-break">
      <div class="section-title">Denetçi Genel Değerlendirmesi</div>
      
      ${data.generalEvaluation?.comments ? `
        <div class="evaluation-section">
          <div class="evaluation-title">Genel Yorum</div>
          <div class="evaluation-content">${escapeHtml(data.generalEvaluation.comments)}</div>
        </div>
      ` : ''}

      ${data.generalEvaluation?.strengths ? `
        <div class="evaluation-section">
          <div class="evaluation-title">Güçlü Yönler</div>
          <div class="evaluation-content">${escapeHtml(data.generalEvaluation.strengths)}</div>
        </div>
      ` : ''}

      ${data.generalEvaluation?.improvementAreas ? `
        <div class="evaluation-section">
          <div class="evaluation-title">İyileştirilmesi Gereken Alanlar</div>
          <div class="evaluation-content">${escapeHtml(data.generalEvaluation.improvementAreas)}</div>
        </div>
      ` : ''}

      ${data.generalEvaluation?.suggestions ? `
        <div class="evaluation-section">
          <div class="evaluation-title">Öneriler</div>
          <div class="evaluation-content">${escapeHtml(data.generalEvaluation.suggestions)}</div>
        </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Bu rapor otomatik olarak oluşturulmuştur. Tarih: ${new Date().toLocaleDateString('tr-TR')}</p>
    </div>
  </div>
</body>
</html>
  `;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function calculateCategoryScores(answers: any[]): Record<string, any> {
  const categoryMap: Record<string, any> = {};

  answers.forEach(answer => {
    const category = answer.category || 'Diğer';
    if (!categoryMap[category]) {
      categoryMap[category] = {
        totalPoints: 0,
        earnedPoints: 0,
        weight: 20 // Default weight
      };
    }
    categoryMap[category].totalPoints += answer.questionPoints || 0;
    categoryMap[category].earnedPoints += answer.earnedPoints || 0;
  });

  // Calculate percentage for each category
  Object.keys(categoryMap).forEach(category => {
    const data = categoryMap[category];
    data.score = data.totalPoints > 0 ? (data.earnedPoints / data.totalPoints) * 100 : 0;
  });

  return categoryMap;
}

function calculateWeightedScore(categoryScores: Record<string, any>): number {
  let totalWeightedScore = 0;
  let totalWeight = 0;

  Object.values(categoryScores).forEach((data: any) => {
    totalWeightedScore += (data.score * data.weight) / 100;
    totalWeight += data.weight;
  });

  return totalWeight > 0 ? totalWeightedScore : 0;
}
