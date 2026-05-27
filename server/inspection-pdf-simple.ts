/**
 * Simple Inspection PDF Generator using Puppeteer
 * Renders a simple HTML string directly to PDF (no React rendering)
 */

import puppeteer from "puppeteer";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { fieldInspections, fieldInspectionAnswers, fieldInspectionCategories, fieldInspectionQuestions, inspectionActions, inspectorGeneralEvaluation } from "../drizzle/schema";

export async function generateSimpleInspectionPDF(inspectionId: number): Promise<Buffer> {
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
  const html = generateSimpleHTML({
    inspection,
    answers,
    categories,
    questions,
    actions,
    generalEvaluation,
  });

  console.log(`[PDF] Generated HTML length: ${html.length}`);

  // Convert to PDF using Puppeteer
  const pdfBuffer = await htmlToPDFWithPuppeteer(html);
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

function generateSimpleHTML(params: GenerateHTMLParams): string {
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

  let questionsHTML = "";
  answersByCategory.forEach((cat: any, catIndex: number) => {
    if (cat.answers.length === 0) return;

    questionsHTML += `
      <div style="margin-top: 20px; page-break-inside: avoid;">
        <div style="background: #333; color: #fff; padding: 10px; font-weight: bold; font-size: 12px;">
          ${catIndex + 1}. ${cat.category.name} (${cat.questions.length} Soru) - 
          ${cat.earnedPoints}/${cat.totalPoints} Puan · %${cat.score} · Ağırlık: %${cat.category.weight}
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 5px;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="border: 1px solid #ccc; padding: 5px; text-align: left; font-size: 10px;">#</th>
              <th style="border: 1px solid #ccc; padding: 5px; text-align: left; font-size: 10px;">Soru</th>
              <th style="border: 1px solid #ccc; padding: 5px; text-align: center; font-size: 10px;">Cevap</th>
              <th style="border: 1px solid #ccc; padding: 5px; text-align: center; font-size: 10px;">Puan</th>
            </tr>
          </thead>
          <tbody>
            ${cat.answers
              .map((answer: any, qIndex: number) => {
                const question = cat.questions.find((q: any) => q.id === answer.questionId);
                if (!question) return "";
                const action = actions.find((a: any) => a.questionId === answer.questionId);
                return `
              <tr style="background: ${answer.answer === "H" ? "#f9f9f9" : "white"};">
                <td style="border: 1px solid #ccc; padding: 5px; font-size: 10px;">${qIndex + 1}</td>
                <td style="border: 1px solid #ccc; padding: 5px; font-size: 10px;">${question.questionText || ""}</td>
                <td style="border: 1px solid #ccc; padding: 5px; text-align: center; font-size: 10px;">
                  ${answer.answer === "E" ? "✓ Evet" : "✗ Hayır"}
                </td>
                <td style="border: 1px solid #ccc; padding: 5px; text-align: center; font-size: 10px;">
                  ${answer.answer === "E" ? answer.earnedPoints : 0}/${answer.questionPoints}
                </td>
              </tr>
              ${
                answer.answer === "H" && answer.explanation
                  ? `
              <tr style="background: #fafafa;">
                <td colspan="4" style="border: 1px solid #ccc; padding: 5px; font-size: 9px; font-style: italic;">
                  <strong>AÇIKLAMA:</strong> ${answer.explanation}
                </td>
              </tr>
              `
                  : ""
              }
              ${
                answer.answer === "H" && action
                  ? `
              <tr style="background: #fafafa;">
                <td colspan="4" style="border: 1px solid #ccc; padding: 5px; font-size: 9px; color: #d32f2f;">
                  <strong>AKSİYON:</strong> ${action.actionDescription || ""}
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
      </div>
    `;
  });

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Denetim Raporu</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #222; line-height: 1.4; font-size: 11px; }
    .container { max-width: 210mm; margin: 0 auto; padding: 20px; background: white; }
    .header { background: #222; color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .logo { font-size: 18px; font-weight: bold; }
    .header-title { font-size: 14px; font-weight: bold; flex: 1; text-align: center; }
    .header-meta { font-size: 10px; text-align: right; }
    .info { display: flex; gap: 20px; margin-bottom: 20px; padding: 10px; border: 1px solid #ccc; }
    .info-item { flex: 1; }
    .info-label { font-size: 9px; color: #666; text-transform: uppercase; font-weight: bold; }
    .info-value { font-size: 11px; font-weight: bold; margin-top: 3px; }
    .summary { display: flex; gap: 20px; margin-bottom: 20px; }
    .score-box { background: #222; color: white; padding: 20px; border-radius: 50%; width: 100px; height: 100px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
    .score-number { font-size: 24px; font-weight: bold; }
    .score-label { font-size: 10px; margin-top: 5px; }
    .categories { flex: 1; display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
    .cat-box { border: 1px solid #ccc; padding: 10px; text-align: center; }
    .cat-name { font-size: 9px; font-weight: bold; color: #666; }
    .cat-score { font-size: 14px; font-weight: bold; margin: 5px 0; }
    .cat-weight { font-size: 8px; color: #999; }
    .section-title { font-size: 12px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #222; padding-bottom: 5px; }
    .general-comment { border: 1px solid #ccc; padding: 10px; margin-bottom: 20px; font-style: italic; background: #f9f9f9; }
    @media print {
      body { margin: 0; padding: 0; }
      .container { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- HEADER -->
    <div class="header">
      <div class="logo">KebanFood™</div>
      <div class="header-title">SAHA DENETİM RAPORU</div>
      <div class="header-meta">
        <div>No: <strong>${reportNo}</strong></div>
        <div>Tarih: <strong>${formatDate(inspection.inspectionDate)}</strong></div>
      </div>
    </div>

    <!-- INFO -->
    <div class="info">
      <div class="info-item">
        <div class="info-label">Şube</div>
        <div class="info-value">${inspection.branchName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Restoran Yöneticisi</div>
        <div class="info-value">${inspection.restaurantManagerName || ""}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Denetçi</div>
        <div class="info-value">${inspection.inspectorName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">E-posta</div>
        <div class="info-value">${inspection.inspectorEmail}</div>
      </div>
    </div>

    <!-- SUMMARY -->
    <div class="summary">
      <div class="score-box">
        <div class="score-number">${successScore}%</div>
        <div class="score-label">${successLabel}</div>
      </div>
      <div class="categories">
        ${answersByCategory
          .map(
            (cat: any) => `
          <div class="cat-box">
            <div class="cat-name">${cat.category.name.substring(0, 12)}</div>
            <div class="cat-score">%${cat.score}</div>
            <div class="cat-weight">Ağr: %${cat.category.weight}</div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>

    <!-- QUESTIONS -->
    <div class="section-title">SORULAR VE CEVAPLAR</div>
    ${questionsHTML}

    <!-- GENERAL EVALUATION -->
    <div class="section-title">GENEL DEĞERLENDİRME</div>
    <div class="general-comment">
      ${generalEvaluation?.comments || "Değerlendirme yapılmamıştır."}
    </div>

    <!-- FOOTER -->
    <div style="border-top: 1px solid #999; padding-top: 10px; margin-top: 20px; font-size: 9px; color: #aaa; display: flex; justify-content: space-between;">
      <div>Keban Food™ - Gizli</div>
      <div>Bu rapor otomatik olarak oluşturulmuştur.</div>
      <div>${formatDate(inspection.inspectionDate)}</div>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

async function htmlToPDFWithPuppeteer(html: string): Promise<Buffer> {
  let browser: any = null;
  const fs = await import("fs/promises");
  const path = await import("path");
  const os = await import("os");
  
  try {
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

    // Set content directly (no network request needed)
    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    console.log(`[PDF] Page content set, generating PDF...`);

    // Generate PDF to temporary file
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `inspection-${Date.now()}.pdf`);
    
    await page.pdf({
      path: tempFile,
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
    
    // Read the file and return as Buffer
    const pdfBuffer = await fs.readFile(tempFile);
    console.log(`[PDF] PDF generated successfully, size: ${pdfBuffer.length} bytes`);
    
    // Clean up temp file
    await fs.unlink(tempFile).catch(() => {});
    
    return pdfBuffer;
  } catch (error) {
    console.error("[PDF] Error generating PDF:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
