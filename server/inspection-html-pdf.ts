/**
 * Inspection HTML to PDF Generator
 * Generates PDF directly from backend data without relying on Puppeteer rendering React
 */

import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { fieldInspections, fieldInspectionAnswers, fieldInspectionCategories, fieldInspectionQuestions, inspectionActions, inspectorGeneralEvaluation } from "../drizzle/schema";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

export async function generateInspectionHTMLPDF(inspectionId: number): Promise<Buffer> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Get inspection data
  const inspectionData = await db
    .select()
    .from(fieldInspections)
    .where(eq(fieldInspections.id, inspectionId))
    .limit(1);

  if (!inspectionData || inspectionData.length === 0) {
    throw new Error(`Inspection ${inspectionId} not found`);
  }

  const inspection = inspectionData[0];

  // Get answers
  const answers = await db
    .select()
    .from(fieldInspectionAnswers)
    .where(eq(fieldInspectionAnswers.inspectionId, inspectionId));

  // Get categories and questions
  const categories = await db
    .select()
    .from(fieldInspectionCategories);

  const questions = await db
    .select()
    .from(fieldInspectionQuestions);

  // Get actions
  const actions = await db
    .select()
    .from(inspectionActions)
    .where(eq(inspectionActions.inspectionId, inspectionId));

  // Get general evaluation
  const evaluations = await db
    .select()
    .from(inspectorGeneralEvaluation)
    .where(eq(inspectorGeneralEvaluation.fieldInspectionId, inspectionId))
    .limit(1);

  const generalEvaluation = evaluations.length > 0 ? evaluations[0] : null;

  // Generate HTML
  const html = generateInspectionHTML({
    inspection,
    answers,
    categories,
    questions,
    actions,
    generalEvaluation,
  });

  // Convert HTML to PDF using weasyprint (manus-md-to-pdf style)
  const pdfBuffer = await htmlToPDFViaWeasyprint(html);
  return pdfBuffer;
}

interface GenerateHTMLParams {
  inspection: any;
  answers: any[];
  categories: any[];
  questions: any[];
  actions: any[];
  generalEvaluation: any;
}

function generateInspectionHTML(params: GenerateHTMLParams): string {
  const { inspection, answers, categories, questions, actions, generalEvaluation } = params;

  const formatDate = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("tr-TR");
  };

  const getSuccessLabel = (score: number): string => {
    if (score >= 91) return "BAŞARILI";
    if (score >= 86) return "BEKLENEN";
    if (score >= 80) return "GELİŞTİRİLEBİLİR";
    return "BAŞARISIZ";
  };

  const reportNo = `DEN-${new Date().getFullYear()}-${String(inspection.id).padStart(4, "0")}`;
  const successScore = Math.round(parseFloat(inspection.totalScore || 0));
  const successLabel = getSuccessLabel(successScore);

  // Group answers by category
  const answersByCategory = categories.map((cat: any) => {
    const catQuestions = questions.filter((q: any) => q.categoryId === cat.id);
    const catAnswers = answers.filter((a: any) =>
      catQuestions.some((q: any) => q.id === a.questionId)
    );

    const earnedPoints = catAnswers
      .filter((a: any) => a.answer === "E")
      .reduce((sum: number, a: any) => sum + (a.earnedPoints || 0), 0);
    const totalPoints = catAnswers.reduce((sum: number, a: any) => sum + (a.questionPoints || 0), 0);
    const catScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    return {
      category: cat,
      questions: catQuestions,
      answers: catAnswers,
      earnedPoints,
      totalPoints,
      score: catScore,
    };
  });

  let html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Denetim Raporu</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #222; line-height: 1.4; font-size: 10pt; }
    
    .header { background: #222; color: #fff; padding: 10mm 8mm; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 16pt; font-weight: 900; }
    .header-title { font-size: 12pt; font-weight: 700; letter-spacing: 1px; flex: 1; text-align: center; }
    .header-meta { font-size: 8pt; text-align: right; line-height: 1.5; }
    .header-meta b { font-weight: 700; }
    
    .bar { height: 2px; background: #222; }
    
    .info { display: flex; padding: 6mm 8mm; border-bottom: 1px solid #ccc; }
    .info > div { flex: 1; padding: 6mm 10mm; font-size: 8pt; line-height: 1.5; }
    .info-label { color: #888; font-size: 7pt; text-transform: uppercase; }
    .info-value { font-weight: 700; font-size: 9pt; }
    
    .summary { display: flex; align-items: center; gap: 10mm; padding: 6mm 8mm; border-bottom: 2px solid #222; }
    .score-circle { width: 50mm; height: 50mm; border-radius: 50%; border: 3mm solid #222; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
    .score-number { font-size: 18pt; font-weight: 900; line-height: 1; }
    .score-label { font-size: 7pt; font-weight: 700; margin-top: 1mm; }
    
    .categories { flex: 1; display: grid; grid-template-columns: repeat(5, 1fr); gap: 3mm; }
    .category-box { border: 1px solid #ccc; border-radius: 2px; padding: 3mm 4mm; text-align: center; }
    .category-name { font-size: 6pt; font-weight: 600; text-transform: uppercase; color: #666; line-height: 1.2; }
    .category-score { font-size: 11pt; font-weight: 900; }
    .category-weight { font-size: 6pt; color: #999; }
    
    .scale { display: flex; margin: 0 8mm; border: 1px solid #222; font-size: 7pt; font-weight: 600; }
    .scale > div { flex: 1; text-align: center; padding: 2mm 0; border-right: 1px solid #222; }
    .scale > div:last-child { border-right: none; }
    .scale .active { background: #222; color: #fff; }
    
    .category-header { background: #333; color: #fff; padding: 3mm 8mm; font-size: 8pt; font-weight: 700; display: flex; justify-content: space-between; margin-top: 3mm; }
    .category-header-score { font-weight: 400; font-size: 7pt; opacity: 0.8; }
    
    table { width: 100%; border-collapse: collapse; margin: 0 8mm; }
    th { background: #f0f0f0; padding: 2mm 3mm; font-size: 6.5pt; font-weight: 700; color: #666; text-transform: uppercase; border-bottom: 1.5px solid #222; text-align: left; }
    td { padding: 1.5mm 3mm; border-bottom: 1px solid #e0e0e0; font-size: 7pt; vertical-align: top; }
    .no { width: 3%; text-align: center; font-weight: 600; color: #888; }
    .qt { width: 55%; }
    .qa { width: 7%; text-align: center; font-weight: 700; }
    .qp { width: 7%; text-align: center; }
    .qk { width: 10%; text-align: center; font-size: 6pt; }
    .hr td { background: #f0f0f0; }
    
    .critical { font-weight: 900; border: 1px solid #222; padding: 0 2px; font-size: 5.5pt; }
    .penalty { font-size: 6pt; border: 1px dashed #666; padding: 0 2px; margin-left: 1mm; }
    
    .explanation-row td { border-bottom: 1px solid #eee; padding: 1mm 3mm 1.5mm 20mm; font-size: 6.5pt; font-style: italic; }
    .explanation-tag { font-size: 6pt; font-weight: 700; font-style: normal; border: 1px solid #888; padding: 0 2px; margin-right: 2px; }
    
    .section-title { font-size: 9pt; font-weight: 700; padding: 5mm 8mm 1.5mm; border-bottom: 1px solid #ccc; margin-top: 3mm; }
    .general-comment { margin: 3mm 8mm; border: 1px solid #ccc; padding: 4mm 8mm; font-size: 7.5pt; line-height: 1.4; font-style: italic; color: #555; min-height: 12mm; }
    
    .signatures { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6mm; padding: 4mm 8mm; text-align: center; }
    .signature-box { }
    .signature-title { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; margin-bottom: 12mm; }
    .signature-line { border-top: 1.5px solid #222; width: 70%; margin: 0 auto 2mm; }
    .signature-info { font-size: 6pt; color: #888; line-height: 1.3; }
    
    .footer { border-top: 1px solid #999; padding: 2.5mm 8mm; display: flex; justify-content: space-between; font-size: 6pt; color: #aaa; margin-top: 3mm; }
    
    @page { margin: 0; }
    @media print { body { margin: 0; padding: 0; background: white; } }
  </style>
</head>
<body>
  <!-- HEADER -->
  <div class="header">
    <div class="logo">KebanFood™</div>
    <div class="header-title">SAHA DENETİM RAPORU</div>
    <div class="header-meta">
      No: <b>${reportNo}</b><br>
      Tarih: <b>${formatDate(inspection.inspectionDate)}</b>
    </div>
  </div>
  <div class="bar"></div>
  
  <!-- INFO -->
  <div class="info">
    <div>
      <span class="info-label">Şube</span><br>
      <span class="info-value">${inspection.branchName}</span>
    </div>
    <div>
      <span class="info-label">Restoran Yöneticisi</span><br>
      <span class="info-value">${inspection.restaurantManagerName || ""}</span>
    </div>
    <div>
      <span class="info-label">Denetçi</span><br>
      <span class="info-value">${inspection.inspectorName}</span>
    </div>
    <div>
      <span class="info-label">E-posta</span><br>
      <span class="info-value">${inspection.inspectorEmail}</span>
    </div>
  </div>
  
  <!-- SUMMARY -->
  <div class="summary">
    <div class="score-circle">
      <div class="score-number">${successScore}%</div>
      <div class="score-label">${successLabel}</div>
    </div>
    <div class="categories">
      ${answersByCategory
        .map(
          (cat: any) => `
        <div class="category-box">
          <div class="category-name">${cat.category.name.substring(0, 12)}</div>
          <div class="category-score">%${cat.score}</div>
          <div class="category-weight">Ağr: %${cat.category.weight}</div>
        </div>
      `
        )
        .join("")}
    </div>
  </div>
  
  <!-- SCALE -->
  <div class="scale">
    <div>79↓ BAŞARISIZ</div>
    <div>80-85 GELİŞTİRİLEBİLİR</div>
    <div>86-90 BEKLENEN</div>
    <div class="active">91+ BAŞARILI</div>
  </div>
  
  <!-- QUESTIONS -->
  ${answersByCategory
    .map((cat: any, catIndex: number) => {
      if (cat.answers.length === 0) return "";
      return `
    <div class="category-header">
      <span>${catIndex + 1}. ${cat.category.name} (${cat.questions.length} Soru)</span>
      <span class="category-header-score">
        ${cat.earnedPoints}/${cat.totalPoints} Puan · %${cat.score} · Ağırlık: %${cat.category.weight}
      </span>
    </div>
    <table>
      <thead>
        <tr>
          <th class="no">#</th>
          <th class="qt">Soru</th>
          <th class="qa">Cevap</th>
          <th class="qp">Puan</th>
          <th class="qk">Durum</th>
        </tr>
      </thead>
      <tbody>
        ${cat.answers
          .map((answer: any, qIndex: number) => {
            const question = cat.questions.find((q: any) => q.id === answer.questionId);
            if (!question) return "";
            const action = actions.find((a: any) => a.questionId === answer.questionId);
            return `
          <tr ${answer.answer === "H" ? 'class="hr"' : ""}>
            <td class="no">${qIndex + 1}</td>
            <td class="qt">${question.questionText || ""}</td>
            <td class="qa">${answer.answer === "E" ? "✓ Evet" : "✗ Hayır"}</td>
            <td class="qp">${answer.answer === "E" ? answer.earnedPoints : 0}/${answer.questionPoints}</td>
            <td class="qk">
              ${question.isCritical ? '<span class="critical">⚠ KRİTİK</span>' : ""}
              ${answer.penaltyPoints && answer.penaltyPoints > 0 ? `<span class="penalty">-${answer.penaltyPoints}</span>` : ""}
            </td>
          </tr>
          ${
            answer.answer === "H" && answer.explanation
              ? `
          <tr class="explanation-row">
            <td></td>
            <td colspan="4">
              <span class="explanation-tag">AÇIKLAMA</span> ${answer.explanation}
            </td>
          </tr>
          `
              : ""
          }
          ${
            answer.answer === "H" && action
              ? `
          <tr class="explanation-row">
            <td></td>
            <td colspan="4">
              <span style="color: #d32f2f; font-weight: bold;">AKSİYON:</span> ${action.actionDescription || ""}
            </td>
          </tr>
          `
              : ""
          }
        `;
          })
          .join("")}
      </tbody>
    </table>
  `;
    })
    .join("")}
  
  <!-- GENERAL EVALUATION -->
  <div class="section-title">GENEL DEĞERLENDİRME</div>
  <div class="general-comment">${generalEvaluation?.comments || "Değerlendirme yapılmamıştır."}</div>
  
  <!-- SIGNATURES -->
  <div class="section-title">İMZA BÖLÜMÜ</div>
  <div class="signatures">
    <div class="signature-box">
      <div class="signature-title">Izgara Şefi</div>
      <div class="signature-line"></div>
      <div class="signature-info">
        Ad Soyad:<br>
        Tarih: __/__/____
      </div>
    </div>
    <div class="signature-box">
      <div class="signature-title">Restoran Yöneticisi</div>
      <div class="signature-line"></div>
      <div class="signature-info">
        Ad Soyad:<br>
        Tarih: __/__/____
      </div>
    </div>
    <div class="signature-box">
      <div class="signature-title">KEBAN</div>
      <div class="signature-line"></div>
      <div class="signature-info">
        Ad Soyad:<br>
        Tarih: __/__/____
      </div>
    </div>
    <div class="signature-box">
      <div class="signature-title">Bölge Müdürü</div>
      <div class="signature-line"></div>
      <div class="signature-info">
        Ad Soyad:<br>
        Tarih: __/__/____
      </div>
    </div>
  </div>
  
  <!-- FOOTER -->
  <div class="footer">
    <div>Keban Food™ - Gizli</div>
    <div>Bu rapor otomatik olarak oluşturulmuştur.</div>
    <div>${formatDate(inspection.inspectionDate)}</div>
  </div>
</body>
</html>`;

  return html;
}

async function htmlToPDFViaWeasyprint(html: string): Promise<Buffer> {
  // Create temporary HTML file
  const tmpDir = os.tmpdir();
  const htmlFile = path.join(tmpDir, `inspection_${Date.now()}.html`);
  const pdfFile = path.join(tmpDir, `inspection_${Date.now()}.pdf`);

  try {
    // Write HTML to file
    fs.writeFileSync(htmlFile, html, "utf-8");

    // Use manus-md-to-pdf style conversion or xhtml2pdf
    // Since we're using xhtml2pdf (pre-installed), convert HTML to PDF
    const pythonScript = `
import sys
from xhtml2pdf import pisa

html_file = "${htmlFile}"
pdf_file = "${pdfFile}"

with open(html_file, 'r', encoding='utf-8') as f:
    html_content = f.read()

with open(pdf_file, 'wb') as f:
    pisa.CreatePDF(html_content, f)

print("PDF created successfully")
`;

    const scriptFile = path.join(tmpDir, `convert_${Date.now()}.py`);
    fs.writeFileSync(scriptFile, pythonScript, "utf-8");

    // Execute Python script
    await execAsync(`python3 "${scriptFile}"`);

    // Read PDF file
    const pdfBuffer = fs.readFileSync(pdfFile);

    // Cleanup
    fs.unlinkSync(htmlFile);
    fs.unlinkSync(pdfFile);
    fs.unlinkSync(scriptFile);

    return pdfBuffer;
  } catch (error) {
    // Cleanup on error
    try {
      if (fs.existsSync(htmlFile)) fs.unlinkSync(htmlFile);
      if (fs.existsSync(pdfFile)) fs.unlinkSync(pdfFile);
    } catch (e) {
      // Ignore cleanup errors
    }
    throw error;
  }
}
