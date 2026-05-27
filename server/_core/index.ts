import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { setupVite, serveStatic } from "./vite";
import { getDb } from "../db";
import { performanceEvaluations } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import ExcelJS from "exceljs";
import * as path from "path";
import * as fs from "fs";

export async function createServer() {
  const app = express();
  const http = await import("http");
  const server = http.createServer(app);

  // Auto-seed: ensure inspection questions exist on every startup
  try {
    const { seedFieldInspectionData } = await import('./seed');
    await seedFieldInspectionData();
    console.log('[Server] Field inspection data verified on startup');
  } catch (error) {
    console.error('[Server] Seed error (non-fatal):', error);
  }

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS - Allow credentials with proper origin handling
  app.use((req, res, next) => {
    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/');
    
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    } else {
      res.header("Access-Control-Allow-Origin", "*");
    }
    
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Excel indirme endpoint'i
  app.get("/api/download-evaluations", async (req, res) => {
    try {
      const { branchIds, period } = req.query;

      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Veritabanı bağlantısı kurulamadı" });
      }

      // Veritabanından değerlendirmeleri getir
      let evaluations: any[] = await db
        .select()
        .from(performanceEvaluations);

      // Branch filtresi uygula
      if (branchIds && typeof branchIds === "string") {
        const branchIdArray = branchIds.split(",").map(id => parseInt(id, 10));
        evaluations = evaluations.filter((e: any) => branchIdArray.includes(e.branchId));
      }

      // Dönem filtresi uygula
      if (period && typeof period === "string") {
        evaluations = evaluations.filter(
          (e: any) => e.evaluationPeriod === period.trim()
        );
      }

      // Excel dosyası oluştur
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Değerlendirmeler");

      // Header satırı
      worksheet.columns = [
        { header: "Sıra No", key: "sira", width: 8 },
        { header: "Personel Adı", key: "employeeName", width: 20 },
        { header: "Sicil No", key: "employeeIdNumber", width: 15 },
        { header: "Pozisyon", key: "employeePosition", width: 20 },
        { header: "Dönem", key: "evaluationPeriod", width: 12 },
        { header: "Değerlendiren", key: "evaluatedByManager", width: 20 },
        { header: "Toplam Puan", key: "totalScore", width: 12 },
        { header: "Skalası", key: "evaluationScale", width: 15 },
        { header: "Tarih", key: "evaluationDate", width: 12 },
      ];

      // Veri satırları
      evaluations.forEach((evaluation: any, index: number) => {
        worksheet.addRow({
          sira: index + 1,
          employeeName: evaluation.employeeName,
          employeeIdNumber: evaluation.employeeIdNumber || "",
          employeePosition: evaluation.employeePosition,
          evaluationPeriod: evaluation.evaluationPeriod,
          evaluatedByManager: evaluation.evaluatedByManager || "",
          totalScore: evaluation.totalScore,
          evaluationScale: evaluation.evaluationScale,
          evaluationDate: evaluation.evaluationDate ? new Date(evaluation.evaluationDate).toLocaleDateString("tr-TR") : "",
        });
      });

      // Response headers
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Performans_Raporu_${period || "Tum_Donemler"}_${new Date().toISOString().split("T")[0]}.xlsx"`
      );

      // Excel dosyasını gönder
      await workbook.xlsx.write(res);
      res.end();
    } catch (error: any) {
      console.error("Excel indirme hatası:", error);
      res.status(500).json({ error: error?.message || "Excel indirme başarısız" });
    }
  });

  // HTML rapor indirme endpoint'i
  app.get("/api/download-html-report", async (req, res) => {
    try {
      const { period } = req.query;
      const trimmedPeriod = period && typeof period === "string" ? period.trim() : undefined;

      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Veritabanı bağlantısı kurulamadı" });
      }

      // Tüm değerlendirmeleri getir
      let evaluations: any[] = await db
        .select()
        .from(performanceEvaluations);

      console.log("[HTML Report] Toplam degerlendirme:", evaluations.length);
      console.log("[HTML Report] Period param:", period, "Trimmed:", trimmedPeriod);
      
      // Tüm dönemleri listele
      const periods = Array.from(new Set(evaluations.map((e: any) => e.evaluationPeriod)));
      console.log("[HTML Report] Mevcut dönemler:", periods);
      
      // Dönem filtresi uygula (tarih formatı: YYYY-MM)
      if (trimmedPeriod) {
        evaluations = evaluations.filter((e: any) => {
          if (!e.evaluationDate) return false;
          const evalDate = new Date(e.evaluationDate);
          const evalMonth = String(evalDate.getMonth() + 1).padStart(2, '0');
          const evalYear = evalDate.getFullYear();
          const evalYearMonth = `${evalYear}-${evalMonth}`;
          return evalYearMonth === trimmedPeriod;
        });
        console.log("[HTML Report] Donem filtresi sonrasi:", evaluations.length, "(donem:", trimmedPeriod, ")");
      }

      // HTML oluştur
      const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performans İzleme Raporu - ${trimmedPeriod || "Tüm Dönemler"}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; margin-bottom: 10px; text-align: center; }
    .report-info { text-align: center; color: #666; margin-bottom: 30px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background-color: #f0f0f0; color: #333; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #ddd; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    tr:hover { background-color: #f9f9f9; }
    .score { font-weight: bold; color: #2196F3; }
    .scale-excellent { color: #4CAF50; font-weight: bold; }
    .scale-good { color: #2196F3; font-weight: bold; }
    .scale-expected { color: #FF9800; font-weight: bold; }
    .scale-developing { color: #FF5722; font-weight: bold; }
    .scale-insufficient { color: #F44336; font-weight: bold; }
    .date { color: #999; font-size: 12px; }
    @media print {
      body { background-color: white; padding: 0; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Keban Food - Performans İzleme Raporu</h1>
    <div class="report-info">
      <p>Dönem: <strong>${trimmedPeriod || "Tüm Dönemler"}</strong></p>
      <p>Rapor Tarihi: <strong>${new Date().toLocaleDateString("tr-TR")}</strong></p>
      <p>Toplam Değerlendirme: <strong>${evaluations.length}</strong></p>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Sıra</th>
          <th>Personel Adı</th>
          <th>Sicil No</th>
          <th>Pozisyon</th>
          <th>Dönem</th>
          <th>Değerlendiren</th>
          <th>Toplam Puan</th>
          <th>Skalası</th>
          <th>Tarih</th>
        </tr>
      </thead>
      <tbody>
        ${evaluations.map((evaluation: any, index: number) => `
          <tr>
            <td>${index + 1}</td>
            <td>${evaluation.employeeName}</td>
            <td>${evaluation.employeeIdNumber || "-"}</td>
            <td>${evaluation.employeePosition}</td>
            <td>${evaluation.evaluationPeriod}</td>
            <td>${evaluation.evaluatedByManager || "-"}</td>
            <td class="score">${evaluation.totalScore}</td>
            <td class="scale-${evaluation.evaluationScale === "Çok İyi" ? "excellent" : evaluation.evaluationScale === "İyi" ? "good" : evaluation.evaluationScale === "Beklenen" ? "expected" : evaluation.evaluationScale === "Gelişime Açık" ? "developing" : "insufficient"}">${evaluation.evaluationScale}</td>
            <td class="date">${new Date(evaluation.evaluationDate).toLocaleDateString("tr-TR")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>
</body>
</html>
      `;

      // Response headers
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Performans_Raporu_${trimmedPeriod || "Tum_Donemler"}_${new Date().toISOString().split("T")[0]}.html"`
      );

      res.send(html);
    } catch (error: any) {
      console.error("HTML rapor indirme hatası:", error);
      res.status(500).json({ error: error?.message || "HTML rapor indirme başarısız" });
    }
  });

  // PDF indirme endpoint'i
  // JSON verisi döndüren endpoint
  app.get("/api/inspection/:inspectionId", async (req, res) => {
    try {
      const { inspectionId } = req.params;
      const id = parseInt(inspectionId);

      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Veritabanı bağlantısı kurulamadı" });
      }

      // Denetim verilerini getir
      const { fieldInspections, fieldInspectionAnswers, fieldInspectionQuestions, fieldInspectionCategories } = await import("../../drizzle/schema");
      const inspections = await db
        .select()
        .from(fieldInspections)
        .where(eq(fieldInspections.id, id))
        .limit(1);
      
      const inspection = inspections[0];

      if (!inspection) {
        return res.status(404).json({ error: "Denetim bulunamadı" });
      }

      // Cevapları getir - INNER JOIN ile questionText ve categoryName'i çek
      const answers = await db
        .select({
          id: fieldInspectionAnswers.id,
          questionId: fieldInspectionAnswers.questionId,
          earnedPoints: fieldInspectionAnswers.earnedPoints,
          questionPoints: fieldInspectionAnswers.questionPoints,
          answer: fieldInspectionAnswers.answer,
          explanation: fieldInspectionAnswers.explanation,
          isCritical: fieldInspectionAnswers.isCritical,
          photoUrls: fieldInspectionAnswers.photoUrls,
          questionText: fieldInspectionQuestions.questionText,
          categoryName: fieldInspectionCategories.name,
        })
        .from(fieldInspectionAnswers)
        .innerJoin(
          fieldInspectionQuestions,
          eq(fieldInspectionAnswers.questionId, fieldInspectionQuestions.id)
        )
        .innerJoin(
          fieldInspectionCategories,
          eq(fieldInspectionQuestions.categoryId, fieldInspectionCategories.id)
        )
        .where(eq(fieldInspectionAnswers.inspectionId, id));

      // Cevapları categoryName'e göre grupla
      const categorizedAnswers = answers.reduce((acc, answer) => {
        const category = answer.categoryName || "Diğer";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push({
          ...answer,
          photoUrls: answer.photoUrls ? (typeof answer.photoUrls === 'string' ? JSON.parse(answer.photoUrls) : answer.photoUrls) : [],
        });
        return acc;
      }, {} as Record<string, any[]>);

      // Başarı oranını hesapla
      const totalEarned = answers.reduce((sum, a) => sum + a.earnedPoints, 0);
      const totalPossible = answers.reduce((sum, a) => sum + a.questionPoints, 0);
      const totalScore = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;

      // JSON olarak gönder
      // answers'ı da düzelt
      const processedAnswers = answers.map(a => ({
        ...a,
        photoUrls: a.photoUrls ? (typeof a.photoUrls === 'string' ? JSON.parse(a.photoUrls) : a.photoUrls) : [],
      }));

      res.json({
        id: inspection.id,
        branchName: inspection.branchName,
        branchCode: inspection.branchCode,
        inspectionDate: inspection.inspectionDate,
        inspectorName: inspection.inspectorName,
        totalScore,
        categorizedAnswers,
        answers: processedAnswers,
      });
    } catch (error: any) {
      console.error("Denetim verisi hatası:", error);
      res.status(500).json({ error: "Denetim verisi alınamadı" });
    }
  });



  // Resim proxy endpoint'i - S3 URL'lerini backend uzerinden serve et
  app.get("/api/proxy-image", async (req, res) => {
    try {
      let { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL parametresi gerekli' });
      }
      
      // URL'yi decode et (encodeURIComponent ile gelen URL'ler decode edilmeli)
      url = decodeURIComponent(url);
      
      console.log(`[PROXY DEBUG] Decoded URL: ${url}`);
      console.log(`[PROXY DEBUG] URL includes cloudfront.net: ${url.includes('cloudfront.net')}`);
      
      // URL'nin S3 CloudFront'tan oldugunu kontrol et
      if (!url.includes('cloudfront.net')) {
        console.log(`[PROXY ERROR] URL CloudFront'tan değil: ${url}`);
        return res.status(403).json({ error: 'Sadece CloudFront URL\'leri destekleniyor' });
      }
      
      // S3'ten resmi indir
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`[PROXY ERROR] S3 response not ok: ${response.status}`);
        return res.status(response.status).json({ error: 'Resim indirilemedi' });
      }
      
      // S3'ten gelen Content-Type header'ını kullan
      let contentType = response.headers.get('content-type') || 'image/jpeg';
      
      // Eğer S3 header'ı application/octet-stream ise, URL'den tahmin et
      if (contentType === 'application/octet-stream') {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname.toLowerCase();
        
        if (pathname.includes('.png')) {
          contentType = 'image/png';
        } else if (pathname.includes('.jpg') || pathname.includes('.jpeg')) {
          contentType = 'image/jpeg';
        } else if (pathname.includes('.gif')) {
          contentType = 'image/gif';
        } else if (pathname.includes('.webp')) {
          contentType = 'image/webp';
        }
      }
      
      // Upstream'den gelen content-encoding'i kontrol et
      const contentEncoding = response.headers.get('content-encoding');
      console.log(`[PROXY DEBUG] Content-Type: ${contentType}, Content-Encoding: ${contentEncoding}`);
      
      // CORS header'larini ekle
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      
      // Content-Length'i set et (eğer varsa)
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }
      
      // Resim buffer'ını al ve gönder
      const buffer = await response.arrayBuffer();
      console.log(`[PROXY DEBUG] Buffer size: ${buffer.byteLength} bytes`);
      res.status(200).end(Buffer.from(buffer));
    } catch (error: any) {
      console.error('Resim proxy hatasi:', error);
      res.status(500).json({ error: 'Resim proxy hatasi' });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // PDF Endpoint - MUST be before Vite middleware
  app.get("/pdf/:inspectionId", async (req, res) => {
    try {
      const { inspectionId } = req.params;
      const id = parseInt(inspectionId);

      if (!id || isNaN(id)) {
        return res.status(400).json({ error: "Gecersiz denetim ID" });
      }

      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Veritabani baglantisi kurulamadi" });
      }

      const { fieldInspections, branches } = await import("../../drizzle/schema");
      const inspections = await db
        .select({
          id: fieldInspections.id,
          inspectionDate: fieldInspections.inspectionDate,
          branchCode: branches.code,
        })
        .from(fieldInspections)
        .leftJoin(branches, eq(fieldInspections.branchId, branches.id))
        .where(eq(fieldInspections.id, id))
        .limit(1);

      const inspection = inspections[0];
      if (!inspection) {
        return res.status(404).json({ error: "Denetim bulunamadi" });
      }

      const { generateSimpleInspectionPDF } = await import("../inspection-pdf-simple");
      console.log(`[PDF] Generating PDF for inspection ${id}`);
      const pdfBuffer = await generateSimpleInspectionPDF(id);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      const dateStr = new Date(inspection.inspectionDate).toISOString().split("T")[0];
      const sanitizedCode = (inspection.branchCode || "Report").replace(/[^a-zA-Z0-9_-]/g, "");
      const fileName = `Inspection_${sanitizedCode}_${dateStr}.pdf`;
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      console.log(`[PDF] Sending PDF: ${fileName}`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("[PDF] PDF olusturma hatasi:", error);
      res.status(500).json({ error: error?.message || "PDF olusturma basarisiz" });
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  return { app, server };
}

// Start server
(async () => {
  const PORT = process.env.PORT || 3000;
  try {
    const { app, server } = await createServer();
    server.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();
