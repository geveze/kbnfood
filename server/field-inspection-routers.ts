import { router, protectedProcedure, adminProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  fieldInspections,
  fieldInspectionAnswers,
  fieldInspectionCategories,
  fieldInspectionQuestions,
  branches,
  users,
  inspectionActions,
  weeklyPlans,
  inspectionEvaluationScale,
  inspectorGeneralEvaluation,
  positionCategories,
  positionQuestions,
  criticalQuestions,
  positions,
  inspectionWarnings,
} from "../drizzle/schema";
import { eq, desc, sql, gte, lte, lt, and } from "drizzle-orm";
import { getDb } from "./db";
import { generateInspectionPDF } from "./field-inspection-pdf";
import { generateInspectionPDFFromPage } from "./inspection-pdf-renderer";
import { generateProfessionalInspectionPDF } from "./professional-inspection-pdf";
import { generateSimpleInspectionPDF } from "./inspection-pdf-simple";

import { uploadInspectionPhotos } from "./field-inspection-storage";
import { checkAndCreateWarnings, getWarningsForBranch, resolveWarning } from "./inspection-warnings";
import { getInspectionDashboard, getCriticalQuestionsSummary, getWarningsWithBranches, getInspectionTrends } from "./inspection-dashboard";
import { getCategoryQuestions } from "./category-questions";
import { getQuestionDetails } from "./question-details";


// Helper function to get position name by ID
const getPositionName = async (db: any, positionId: number): Promise<string | null> => {
  const position = await db
    .select({ name: positions.name })
    .from(positions)
    .where(eq(positions.id, positionId))
    .limit(1);
  return position.length > 0 ? position[0].name : null;
};

// Aksiyon Planı Email HTML Şablonu
function generateActionPlanEmailHTML(data: {
  sorumlu_kisi: string;
  sube_adi: string;
  tarih: string;
  soru_metni: string;
  kategori: string;
  aksiyon_aciklamasi: string;
  tamamlanma_tarihi: string;
  denetci: string;
}): string {
  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Aksiyon Planı Bildirimi</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px; }
        .info-section { background-color: #fff3cd; border-left: 4px solid #ff6b35; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-weight: 600; color: #ff6b35; min-width: 150px; }
        .info-value { color: #333; text-align: right; }
        .action-box { background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .deadline { background-color: #ffe5cc; color: #d9534f; padding: 10px; border-radius: 4px; font-weight: 600; text-align: center; margin: 15px 0; }
        .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Aksiyon Planı Bildirimi</h1>
        </div>
        <div class="content">
          <p>Merhaba <strong>${data.sorumlu_kisi}</strong>,</p>
          <p>Keban Food İnsan Kaynakları Şube Performans Yönetim Sistemi'nden size bir aksiyon planı atanmıştır.</p>
          <div class="info-section">
            <div class="info-row"><span class="info-label">Şube Adı:</span><span class="info-value"><strong>${data.sube_adi}</strong></span></div>
            <div class="info-row"><span class="info-label">Denetim Tarihi:</span><span class="info-value">${data.tarih}</span></div>
            <div class="info-row"><span class="info-label">Denetçi:</span><span class="info-value">${data.denetci}</span></div>
          </div>
          <h3>Yapılacak Aksiyon:</h3>
          <div class="action-box">
            <p>${data.aksiyon_aciklamasi}</p>
          </div>
          <div class="deadline">⏰ Tamamlanma Tarihi: <strong>${data.tamamlanma_tarihi}</strong></div>
          <p>Lütfen belirtilen tarih içerisinde aksiyonu tamamlayınız. Herhangi bir sorunuz varsa, İnsan Kaynakları departmanı ile iletişime geçiniz.</p>
          <p>Saygılarımızla,<br><strong>Keban Food İnsan Kaynakları</strong></p>
        </div>
        <div class="footer">
          <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export const fieldInspectionRouter = router({
  /**
   * Şubeleri dropdown için getir
   */
  getBranches: protectedProcedure.query(async () => {
    const db = await getDb();
      if (!db) throw new Error("Database connection failed");

    const branchList = await db
      .select({
        id: branches.id,
        name: branches.name,
        code: branches.code,
        branchEmail: branches.branchEmail,
      })
      .from(branches)
      .where(eq(branches.status, "active"));

    return branchList;
  }),

  /**
   * Kategorileri ve soruları getir - Denetim Soruları
   * Tüm soruları fieldInspectionQuestions'dan getir
   */
  getCategoriesWithQuestions: protectedProcedure
    .input(
      z.object({
        positionId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        console.log('[getCategoriesWithQuestions] DB connection established');

        // Always use field inspection categories and questions
        // (positionCategories and positionQuestions are not currently populated)
        // Use Drizzle ORM to fetch categories
        console.log('[getCategoriesWithQuestions] Fetching categories...');
        const categories = await db
          .select({
            id: fieldInspectionCategories.id,
            name: fieldInspectionCategories.name,
            order: fieldInspectionCategories.order,
            weight: fieldInspectionCategories.weight,
          })
          .from(fieldInspectionCategories);
        console.log('[getCategoriesWithQuestions] Categories fetched:', categories.length, 'data:', JSON.stringify(categories).substring(0, 200));


        // Get all questions
        const allQuestions = await db
          .select({
            id: fieldInspectionQuestions.id,
            categoryId: fieldInspectionQuestions.categoryId,
            questionText: fieldInspectionQuestions.questionText,
            points: fieldInspectionQuestions.points,
            maxScore: fieldInspectionQuestions.maxScore,
            penaltyPoints: fieldInspectionQuestions.penaltyPoints,
            isCritical: fieldInspectionQuestions.isCritical,
            order: fieldInspectionQuestions.order,
            createdAt: fieldInspectionQuestions.createdAt,
            updatedAt: fieldInspectionQuestions.updatedAt,
          })
          .from(fieldInspectionQuestions);

        // Group questions by category
        const result = categories.map((category: any) => ({
          id: category.id,
          name: category.name,
          order: category.order,
          weight: category.weight,
          questions: allQuestions
            .filter((q: any) => q.categoryId === category.id)
            .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)),
        }));

        console.log('[getCategoriesWithQuestions] positionId:', input.positionId, 'categories count:', result.length, 'total questions:', allQuestions.length);
        return result;
      } catch (error: any) {
        console.error('[getCategoriesWithQuestions] Error:', error.message);
        console.error('Full error:', JSON.stringify(error, null, 2));
        console.error('Error details - Code:', error.code, 'SQL:', error.sql, 'Errno:', error.errno);
        throw error;
      }
    }),

  /**
   * Denetim formu kaydet
   */
  createInspection: protectedProcedure
    .input(
      z.object({
        branchId: z.number(),
        branchCode: z.string(),
        branchName: z.string(),

        restaurantManagerEmail: z.string().email().optional().or(z.literal("")),
        restaurantManagerName: z.string().optional(),
        inspectionDate: z.string(),
        totalScore: z.number().optional().default(0),
        criticalPenalty: z.number().optional().default(0),
        answers: z.array(
          z.object({
            questionId: z.number(),
            answer: z.enum(["E", "H"]), // Evet / Hayır
            earnedPoints: z.number(),
            questionPoints: z.number(),
            penaltyPoints: z.number().optional().default(0),
            explanation: z.string().optional(),
            isCritical: z.boolean().optional().default(false),
            photoUrls: z.array(z.string()).optional(),
          })
        ),
        generalEvaluation: z.object({
          comments: z.string().optional(),
          strengths: z.string().optional(),
          improvementAreas: z.string().optional(),
          suggestions: z.string().optional(),
        }).optional(),
        actionPlans: z.array(
          z.object({
            questionId: z.number().optional(),
            action: z.string().optional(),
            description: z.string().optional(),
            responsiblePerson: z.string().optional(),
            responsiblePersonEmail: z.string().optional(),
            dueDate: z.string().optional(),
            status: z.enum(["pending", "in_progress", "completed"]).optional().default("pending"),
            approved: z.enum(["yes", "no"]).optional(),
          }).refine(
            (data) => {
              // Eğer action yazılıysa approved alanı zorunlu
              // Aksiyon planı yazılıysa onay zorunlu
            const hasAction = (data.action || data.description) && ((data.action?.trim?.().length || 0) + (data.description?.trim?.().length || 0)) > 0;
            if (hasAction) {
              return data.approved !== undefined;
            }
            return true;
            },
            {
              message: "Aksiyon planı yazılıysa Evet/Hayır seçimi zorunludur",
              path: ["approved"],
            }
          )
        ).optional(),
        inspectorName: z.string().optional(),
        inspectorEmail: z.string().email().optional().or(z.literal("")),
        otherEmail: z.string().email().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log("[createInspection] Mutation başladı, answers count:", input.answers.length);
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Aynı şube ve soruda önceki denetimlerde hayır olup olmadığını kontrol et
      const repeatedNoAnswers: Array<{ questionId: number; questionText: string }> = [];
      
      for (const answer of input.answers) {
        if (answer.answer === 'H') {
          // Bu şube ve soru için son denetimi kontrol et
          const previousAnswers = await db
            .select({
              answer: fieldInspectionAnswers.answer,
              questionText: fieldInspectionQuestions.questionText,
            })
            .from(fieldInspectionAnswers)
            .innerJoin(
              fieldInspections,
              eq(fieldInspectionAnswers.inspectionId, fieldInspections.id)
            )
            .innerJoin(
              fieldInspectionQuestions,
              eq(fieldInspectionAnswers.questionId, fieldInspectionQuestions.id)
            )
            .where(
              sql`${fieldInspections.branchId} = ${input.branchId} AND ${fieldInspectionAnswers.questionId} = ${answer.questionId}`
            )
            .orderBy(desc(fieldInspections.inspectionDate))
            .limit(1);
          
          // Eğer önceki cevap da hayırsa, uyarı listesine ekle
          if (previousAnswers.length > 0 && previousAnswers[0].answer === 'H') {
            repeatedNoAnswers.push({
              questionId: answer.questionId,
              questionText: previousAnswers[0].questionText,
            });
          }
        }
      }

      // Denetim kaydı oluştur
      // inspectionDate is in format "2026-04-27" from frontend (local date)
      // Parse and store as-is (database will store the date string correctly)
      const [year, month, day] = input.inspectionDate.split('-').map(Number);
      const localDate = new Date(year, month - 1, day, 7, 0, 0, 0); // 7:00 AM local time
      
      // Insert inspection record with totalScore
      // Insert inspection record with totalScore
      console.log('[DEBUG] Inserting inspection record...');
      // Round totalScore to 2 decimal places to avoid floating point precision issues
      const roundedTotalScore = Math.round(input.totalScore * 100) / 100;
      
      // Insert and get the ID directly
      // Insert inspection record and get the ID by querying after insert
      try {
        console.log('[DEBUG] Insert values:', {
          branchId: input.branchId,
          inspectorId: ctx.user.id,
          inspectionDate: localDate,
          totalScore: roundedTotalScore
        });
        
        await db.insert(fieldInspections).values({
          branchId: input.branchId,
          branchCode: input.branchCode,
          branchName: input.branchName,
          inspectorId: ctx.user.id,
          inspectorName: input.inspectorName || ctx.user.name || "",
          inspectorEmail: ctx.user.email || "",
          restaurantManagerEmail: input.restaurantManagerEmail || "",
          restaurantManagerName: input.restaurantManagerName || "",
          inspectionDate: localDate,
          totalScore: roundedTotalScore.toString() as any,
          generalAssessment: input.generalEvaluation?.comments || "",
          status: "completed",
          pdfUrl: "",
          additionalEmail: input.otherEmail || undefined,
        });
        console.log('[DEBUG] Insert successful');
      } catch (insertError) {
        console.error('[ERROR] Insert failed:', insertError);
        throw new Error(`Denetim kaydı oluşturma hatası: ${insertError instanceof Error ? insertError.message : String(insertError)}`);
      }
      
      // Get the most recent inspection ID for this branch and date
      let inspectionId: number | undefined;
      try {
        console.log('[DEBUG] Querying for recent inspections');
        
        const recentInspections = await db
          .select({ id: fieldInspections.id })
          .from(fieldInspections)
          .where(
            and(
              eq(fieldInspections.branchId, input.branchId),
              eq(fieldInspections.inspectionDate, localDate),
              eq(fieldInspections.inspectorId, ctx.user.id)
            )
          )
          .orderBy(desc(fieldInspections.id))
          .limit(1);
        
        console.log('[DEBUG] Query result count:', recentInspections.length);
        
        inspectionId = recentInspections[0]?.id;
        
        if (!inspectionId) {
          console.error('[ERROR] Could not get inspection ID after insert');
          throw new Error('Denetim kaydı oluşturulamadı - ID alınamadı');
        }
        
        console.log('[DEBUG] Successfully extracted inspectionId:', inspectionId);
      } catch (queryError) {
        console.error('[ERROR] Query failed:', queryError);
        throw new Error(`Denetim ID sorgusu hatası: ${queryError instanceof Error ? queryError.message : String(queryError)}`);
      }

      // Genel Değerlendirmeyi kaydet
      if (input.generalEvaluation) {
        try {
          await db.insert(inspectorGeneralEvaluation).values({
            fieldInspectionId: inspectionId,
            generalComments: input.generalEvaluation.comments || null,
          });
        } catch (error) {
          console.error('Genel değerlendirme kaydı hatası:', error);
        }
      }

       // Aksiyon Planını kaydet ve mail gönder
      console.log('[DEBUG] Action plans data from input:', JSON.stringify(input.actionPlans, null, 2));
      if (input.actionPlans && input.actionPlans.length > 0 && inspectionId) {
        console.log('[DEBUG] Processing', input.actionPlans.length, 'action plans');
        for (const plan of input.actionPlans) {
          console.log('[DEBUG] Current plan object:', JSON.stringify(plan, null, 2));
          // Skip plans without questionId
          if (!plan.questionId) {
            console.log('[DEBUG] Skipping plan - no questionId');
            continue;
          }
          
          try {
            const statusMap: Record<string, string> = {
              "pending": "Açık",
              "in_progress": "Devam Ediyor",
              "completed": "Tamamlandı"
            };
            console.log('[DEBUG] Aksiyon planı kaydediliyor:', {
              questionId: plan.questionId,
              action: plan.action || plan.description,
              responsiblePerson: plan.responsiblePerson,
              responsiblePersonEmail: plan.responsiblePersonEmail,
              dueDate: plan.dueDate
            });
            await db.insert(inspectionActions).values({
              inspectionId,
              branchId: input.branchId,
              branchName: input.branchName,
              questionId: plan.questionId || 0,
              questionText: "",
              answerId: 0,
              actionDescription: plan.action || plan.description || "",
              assignedToName: plan.responsiblePerson || null,
              actionDeadline: plan.dueDate ? new Date(plan.dueDate) : null,
              status: (statusMap[plan.status || "pending"] as any) || "Açık",
              approved: plan.approved === "yes" ? 1 : (plan.approved === "no" ? 0 : null),
            });
            
            // TODO: Aksiyon planı mail gönderme şu anda devre dışı (mail limit koruması)
            // Gelecekte Nodemailer'ı düzgün şekilde configure edip aktif hale getirilecek
            if (false && plan.responsiblePersonEmail && plan.responsiblePerson) {
              try {
                const { sendActionPlanEmail } = await import('./action-plan-mailer');
                await sendActionPlanEmail({
                  recipientEmail: plan.responsiblePersonEmail || '',
                  recipientName: plan.responsiblePerson || '',
                  questionText: '',
                  actionDescription: plan.action || plan.description || '',
                  actionDeadline: plan.dueDate,
                  branchName: input.branchName,
                  photoUrls: [],
                });
                console.log(`[createInspection] Aksiyon planı maili gönderildi: ${plan.responsiblePersonEmail}`);
              } catch (error) {
                console.error('[createInspection] Aksiyon planı mail gönderme hatası:', error);
              }
            }
          } catch (error) {
            console.error('Aksiyon planı kaydı hatası:', error);
            throw error;
          }
        }
      }

      // Cevapları kaydet ve fotoğrafları S3'e yükle
      console.log(`[DEBUG] Cevaplar işleniyor, toplam: ${input.answers.length}`);
      for (const answer of input.answers) {
        console.log(`[DEBUG] Cevap işleniyor: questionId=${answer.questionId}, isCritical=${answer.isCritical}, answer=${answer.answer}`);
        let uploadedPhotoUrls: string[] = [];
        if (answer.photoUrls && answer.photoUrls.length > 0) {
          try {
            uploadedPhotoUrls = await uploadInspectionPhotos(
              answer.photoUrls,
              inspectionId,
              answer.questionId
            );
          } catch (error) {
            console.error(`Fotoğraflar S3'e yüklenirken hata (İd: ${answer.questionId}):`, error);
          }
        }

        try {
          console.log(`[DEBUG] Cevap kaydediliyor - inspectionId: ${inspectionId}, questionId: ${answer.questionId}`);
          console.log(`[DEBUG] Cevap değerleri:`, {
            inspectionId,
            questionId: answer.questionId,
            answer: answer.answer,
            earnedPoints: answer.earnedPoints,
            questionPoints: answer.questionPoints,
            penaltyPoints: answer.penaltyPoints || 0,
            isCritical: answer.isCritical,
          });
          const insertResult = await db.insert(fieldInspectionAnswers).values({
            inspectionId,
            questionId: answer.questionId,
            answer: answer.answer,
            earnedPoints: answer.earnedPoints,
            questionPoints: answer.questionPoints,
            penaltyPoints: answer.penaltyPoints || 0,
            explanation: answer.explanation || null,
            isCritical: answer.isCritical,
            photoUrls: uploadedPhotoUrls && uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : null,
          });
          console.log(`[DEBUG] Cevap başarıyla kaydedildi - questionId: ${answer.questionId}, insertResult:`, insertResult);
        } catch (answerError) {
          console.error(`[ERROR] Cevap kaydedilirken hata - questionId: ${answer.questionId}:`, answerError);
          throw answerError;
        }

        // Kritik soru uyarı kontrolü - Hayır cevabı verilmişse
        console.log(`[DEBUG] Soru ${answer.questionId}: isCritical=${answer.isCritical}, answer=${answer.answer}`);
        if (answer.isCritical && answer.answer === 'H') {
          console.log(`[DEBUG] Kritik soru uyarı kontrolü başladı: questionId=${answer.questionId}`);
          try {
            const previousAnswers = await db
              .select({
                answer: fieldInspectionAnswers.answer,
              })
              .from(fieldInspectionAnswers)
              .innerJoin(fieldInspections, eq(fieldInspectionAnswers.inspectionId, fieldInspections.id))
              .where(
                and(
                  eq(fieldInspectionAnswers.questionId, answer.questionId),
                  eq(fieldInspections.branchId, input.branchId),
                  lt(fieldInspections.inspectionDate, localDate)
                )
              )
              .orderBy(desc(fieldInspections.inspectionDate))
              .limit(1);

            // Aynı gün içinde önceki denetim varsa kontrol et
            let hasPreviousNoAnswer = previousAnswers.length > 0 && previousAnswers[0].answer === 'H';
            
            if (!hasPreviousNoAnswer) {
              // Aynı gün içinde önceki denetim ara (inspectionDate eşit ama inspectionId farklı)
              const sameDayAnswers = await db
                .select({
                  answer: fieldInspectionAnswers.answer,
                  inspectionId: fieldInspectionAnswers.inspectionId,
                })
                .from(fieldInspectionAnswers)
                .innerJoin(fieldInspections, eq(fieldInspectionAnswers.inspectionId, fieldInspections.id))
                .where(
                  and(
                    eq(fieldInspectionAnswers.questionId, answer.questionId),
                    eq(fieldInspections.branchId, input.branchId),
                    eq(fieldInspections.inspectionDate, localDate),
                    lt(fieldInspectionAnswers.inspectionId, inspectionId)
                  )
                )
                .orderBy(desc(fieldInspectionAnswers.inspectionId))
                .limit(1);
              
              if (sameDayAnswers.length > 0 && sameDayAnswers[0].answer === 'H') {
                hasPreviousNoAnswer = true;
              }
            }

            if (hasPreviousNoAnswer) {
              const existingWarning = await db
                .select()
                .from(inspectionWarnings)
                .where(
                  and(
                    eq(inspectionWarnings.branchId, input.branchId),
                    eq(inspectionWarnings.questionId, answer.questionId),
                    eq(inspectionWarnings.status, 'active')
                  )
                )
                .limit(1);

              if (existingWarning.length === 0) {
                const question = await db
                  .select({ questionText: criticalQuestions.questionText, category: criticalQuestions.category })
                  .from(criticalQuestions)
                  .where(eq(criticalQuestions.questionId, answer.questionId))
                  .limit(1);

                await db.insert(inspectionWarnings).values({
                  branchId: input.branchId,
                  branchCode: input.branchCode,
                  branchName: input.branchName,
                  questionId: answer.questionId,
                  questionText: question[0]?.questionText || '',
                  categoryId: 0,
                  categoryName: question[0]?.category || '',
                  consecutiveNoCount: 2,
                  lastInspectionId: inspectionId,
                  lastInspectionDate: localDate,
                  inspectorId: ctx.user.id,
                  inspectorEmail: 'abdullah.er@kebanet.com',
                  status: 'active',
                });
                console.log(`[WARNING] Kritik soru uyarısı: Şube ${input.branchCode}, Soru ID: ${answer.questionId}`);
              }
            }
          } catch (error) {
            console.error('Kritik soru uyarı hatası:', error);
          }
        }
      }

      // Frontend'den gelen totalScore'u kullan
      let totalScore = input.totalScore || 0;
      console.log(`[DEBUG] Frontend'den gelen totalScore: ${totalScore}`);
      console.log(`[DEBUG] Frontend'den gelen criticalPenalty: ${input.criticalPenalty}`);
      
      // totalScore'u normalize et (0-100 arasında)
      totalScore = Math.max(0, Math.min(100, totalScore));
      totalScore = parseFloat(totalScore.toFixed(2));
      console.log(`[DEBUG] Normalize edilmiş totalScore: ${totalScore}%`);

      // Denetim kaydını güncelle (totalScore ve status)
      console.log('Denetim kaydı güncelleniyor, totalScore:', totalScore);

      try {
        await db.update(fieldInspections)
          .set({
            status: 'completed',
            totalScore: totalScore.toString(),
            generalAssessment: input.generalEvaluation?.comments || null,
          })
          .where(eq(fieldInspections.id, inspectionId));
        console.log('Denetim kaydı başarıyla güncellendi, totalScore:', totalScore);
      } catch (err) {
        console.error('Denetim kaydı güncelleme hatası:', err);
      }
      const answersWithQuestions = await db
        .select({
          questionId: fieldInspectionAnswers.questionId,
          answer: fieldInspectionAnswers.answer,
          earnedPoints: fieldInspectionAnswers.earnedPoints,
          questionPoints: fieldInspectionAnswers.questionPoints,
          score: fieldInspectionAnswers.earnedPoints,
          explanation: fieldInspectionAnswers.explanation,
          isCritical: sql`true`,
          photoUrls: fieldInspectionAnswers.photoUrls,
          questionText: criticalQuestions.questionText,
          categoryName: criticalQuestions.category,
        })
        .from(fieldInspectionAnswers)
        .innerJoin(
          criticalQuestions,
          eq(fieldInspectionAnswers.questionId, criticalQuestions.questionId)
        )
        .where(eq(fieldInspectionAnswers.inspectionId, inspectionId));

      console.log('[DEBUG] answersWithQuestions count:', answersWithQuestions.length);

      // Önceki denetim verisi getir
      const previousInspections = await db
        .select({
          id: fieldInspections.id,
          inspectionDate: fieldInspections.inspectionDate,
        })
        .from(fieldInspections)
        .where(eq(fieldInspections.branchId, input.branchId))
        .orderBy(desc(fieldInspections.inspectionDate))
        .limit(2);

      let previousScore: number | undefined = undefined;
      if (previousInspections.length > 1) {
        // Önceki denetimin puanını hesapla
        const prevInspectionId = previousInspections[1].id;
        const prevAnswers = await db
          .select()
          .from(fieldInspectionAnswers)
          .where(eq(fieldInspectionAnswers.inspectionId, prevInspectionId));
        
        const prevYes = prevAnswers.filter(a => a.answer === 'yes').length;
        previousScore = prevAnswers.length > 0 ? (prevYes / prevAnswers.length) * 100 : undefined;
      }

      // Puppeteer ile inspection-print sayfasının PDF'sini oluştur
      let pdfBuffer: Buffer | null = null;
      
      // GEÇICI: Puppeteer devre dışı - eski yöntemle PDF oluştur
      console.log('[PDF] Puppeteer devre dışı, eski PDF oluşturma yöntemi kullanılıyor');
      try {
          const pdfBuffer_temp = await generateInspectionPDF({
            id: inspectionId,
            branchName: input.branchName,
            branchCode: input.branchCode,
            restaurantManagerEmail: input.restaurantManagerEmail || '',
            restaurantManagerName: input.restaurantManagerName || '',
            inspectionDate: input.inspectionDate,
            createdAt: new Date().toISOString(),
            inspectorName: (ctx.user.name || input.inspectorName || 'Denetçi') as string,
            answers: answersWithQuestions as any,
            totalScore,
          });
          pdfBuffer = pdfBuffer_temp;
        } catch (fallbackError) {
          console.error("[ERROR] Fallback PDF oluşturma da başarısız:", fallbackError);
        }

      // YENİ: PDF URL'sini yeni endpoint'e ayarla (dinamik oluşturulan PDF)
      const baseUrlForPdf = process.env.VITE_FRONTEND_URL || 'https://kebanfood-6xmnmhsg.manus.space';
      let pdfUrl = `${baseUrlForPdf}/pdf/${inspectionId}`;
      console.log('[PDF] YENİ PDF endpoint kullanılıyor:', pdfUrl);
      
      // Veritabanına PDF URL'sini kaydet
      try {
        await db
          .update(fieldInspections)
          .set({ pdfUrl: pdfUrl })
          .where(eq(fieldInspections.id, inspectionId));
        console.log('[PDF] Veritabanında pdfUrl güncellendir:', pdfUrl);
        console.log('[PDF] Kaydedilen URL:', pdfUrl);
      } catch (error) {
        console.error("[ERROR] PDF URL kayıt hatası:", error);
      }

      // PDF oluşturma ve S3'e yükleme
      // NOT: S3 upload işlemi devre dışı - sadece yeni endpoint'i kullan
      // let pdfUrlFromDb = '';
      // try {
      //   const { generateAndUploadInspectionPDF } = await import("./pdf-upload-service");
      //   const baseUrl = 'https://3000-is0e7fpcn1jwmpkx4r5zm-e77c5f48.sg1.manus.computer';
      //   pdfUrlFromDb = await generateAndUploadInspectionPDF(inspectionId, baseUrl);
      //   console.log(`[createInspection] PDF uploaded successfully: ${pdfUrlFromDb}`);
      //   
      //   // Veritabanına PDF URL'sini kaydet
      //   await db
      //     .update(fieldInspections)
      //     .set({ pdfUrl: pdfUrlFromDb })
      //     .where(eq(fieldInspections.id, inspectionId));
      //   console.log(`[createInspection] PDF URL saved to database`);
      // } catch (pdfError) {
      //   console.error('[createInspection] PDF generation/upload error:', pdfError);
      //   // PDF hatası nedeniyle mutation başarısız olmasın
      // }
      console.log(`[createInspection] Using new PDF endpoint: ${pdfUrl}`);

      // Email gönderimi - Denetçi ve Müdüre
      try {
        const { sendFieldInspectionEmail } = await import("./email-service");
        
        // Yeni PDF endpoint'ini kullan (dinamik oluşturulan PDF)
        // Relative path kullan - mail client'lar bunu otomatik olarak absolute URL'ye çevirir
        const pdfDownloadUrl = `/pdf/${inspectionId}`;
        
        const emailData = {
          branchName: input.branchName,
          inspectionDate: input.inspectionDate,
          totalScore,
  
          inspectorName: ctx.user.name || input.inspectorName || 'Denetçi',
          restaurantManagerEmail: input.restaurantManagerEmail || '',
          inspectorEmail: ctx.user.email || '',
          otherEmail: input.otherEmail || undefined,
          branchEmail: undefined, // TODO: Şube mail adresini veritabanından al
          pdfUrl: pdfDownloadUrl
        };
        
        console.log(`[createInspection] Sending inspection emails...`);
        console.log(`[createInspection] PDF Download URL: ${pdfDownloadUrl}`);
        
        // PDF buffer'ı oluştur ve email'e attachment olarak ekle
        let pdfBuffer: Buffer | undefined;
        try {
          pdfBuffer = await generateSimpleInspectionPDF(inspectionId);
          console.log(`[createInspection] PDF buffer generated: ${pdfBuffer.length} bytes`);
        } catch (pdfError) {
          console.error("[createInspection] PDF generation error:", pdfError);
          // PDF oluşturulamazsa email yine gönderilsin
        }
        
        const result = await sendFieldInspectionEmail(emailData, pdfBuffer);
        console.log(`[createInspection] Email results - Manager: ${result.restaurantManager}, Inspector: ${result.inspector}`);
      } catch (error) {
        console.error("[createInspection] Email sending error:", error);
        // Email hatası nedeniyle mutation başarısız olmasın
      }

      // Genel değerlendirme kaydet
      if (input.generalEvaluation) {
        try {
          await db.insert(inspectorGeneralEvaluation).values({
            fieldInspectionId: inspectionId,
            generalComments: input.generalEvaluation.comments || null,
          });
          console.log('[DEBUG] Genel değerlendirme kaydedildi, inspectionId:', inspectionId);
        } catch (error) {
          console.error('[ERROR] Genel değerlendirme kayıt hatası:', error);
        }
      }

      // Uyarı kontrolü yap - aynı maddeden 3 kere hayır alan şubeler
      try {
        await checkAndCreateWarnings(inspectionId);
      } catch (error) {
        console.error("[ERROR] Warning check failed:", error);
      }

      // Yeni PDF endpoint'ini döndür
      const baseUrlForReturn = process.env.VITE_FRONTEND_URL || 'https://kebanfood-6xmnmhsg.manus.space';
      const pdfDownloadUrl = `${baseUrlForReturn}/pdf/${inspectionId}`;
      return { inspectionId, totalScore, pdfUrl: pdfDownloadUrl, repeatedNoAnswers, inspectorName: ctx.user.name || "", inspectorEmail: ctx.user.email || "" };
    }),

  /**
   * Tüm denetimleri getir (admin ve bölge müdürü için)
   */
   getAllInspections: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    // Sadece admin ve bölge müdürü tüm denetimleri görebilir
    if (ctx.user.role !== "admin" && ctx.user.role !== "region_manager") {
      throw new Error("Bu işlemi yapmaya yetkiniz yoktur");
    }
    try {
      console.log('[getAllInspections] Starting query for user:', ctx.user.name, 'role:', ctx.user.role);
      const rows = await db.select({
        id: fieldInspections.id,
        branchId: fieldInspections.branchId,
        branchCode: fieldInspections.branchCode,
        branchName: fieldInspections.branchName,
        inspectorId: fieldInspections.inspectorId,
        inspectorName: fieldInspections.inspectorName,
        inspectorEmail: fieldInspections.inspectorEmail,
        restaurantManagerEmail: fieldInspections.restaurantManagerEmail,
        inspectionDate: fieldInspections.inspectionDate,
        totalScore: fieldInspections.totalScore,
        status: fieldInspections.status,
        pdfUrl: fieldInspections.pdfUrl,
      }).from(fieldInspections).orderBy((sql as any)`${fieldInspections.inspectionDate} DESC`);
      console.log('[getAllInspections] Query successful, found', rows.length, 'inspections');
      return rows;
    } catch (error: any) {
      console.error('[getAllInspections] Query failed:', error.message);
      console.log('[getAllInspections] Returning empty array due to error');
      return [];
    }
  }),

  /**
   * Şubeye ait denetimleri getir
   */
  getInspectionsByBranch: protectedProcedure
    .input(z.object({ branchId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Şube yöneticisi ise input.branchId yerine ctx.user.branchId kullan
      const effectiveBranchId = ctx.user.role === "admin" || ctx.user.role === "region_manager" 
        ? input.branchId 
        : (ctx.user.branchId || 0);
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Rol kontrolü - admin tüm denetimleri görebilir, diğerleri sadece kendi şubelerini
      let whereCondition = eq(fieldInspections.branchId, effectiveBranchId);
      
      // Şube yöneticisi ise sadece kendi şubesinin denetimlerini görebilir
      if (ctx.user.role !== "admin" && ctx.user.role !== "region_manager") {
        whereCondition = eq(fieldInspections.branchId, ctx.user.branchId || 0);
      }
      
      try {
        const query = db
          .select({
            id: fieldInspections.id,
            branchId: fieldInspections.branchId,
            branchCode: fieldInspections.branchCode,
            branchName: fieldInspections.branchName,
            inspectorId: fieldInspections.inspectorId,
            inspectorName: fieldInspections.inspectorName,
            inspectorEmail: fieldInspections.inspectorEmail,
            restaurantManagerEmail: fieldInspections.restaurantManagerEmail,
            inspectionDate: fieldInspections.inspectionDate,
            totalScore: fieldInspections.totalScore,
            status: fieldInspections.status,
            pdfUrl: fieldInspections.pdfUrl,
          })
          .from(fieldInspections)
          .where(whereCondition);

        const inspections = await query;
        // Sonuçları inspectionDate'e göre sırala (client-side)
        return (inspections || []).sort((a, b) => {
          const dateA = new Date(a.inspectionDate).getTime();
          const dateB = new Date(b.inspectionDate).getTime();
          return dateB - dateA; // Descending order
        });
      } catch (error: any) {
        // Tablo yoksa boş array döndür
        if (error.message.includes('field_inspections') || error.message.includes('Unknown table')) {
          console.log('[getInspectionsByBranch] Table not found, returning empty array');
          return [];
        }
        throw error;
      }
    }),

  /**
   * Denetim detaylarını soruları ve cevapları ile getir
   */
  getInspectionDetails: protectedProcedure
    .input(z.object({ inspectionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Denetim bilgilerini getir
      const inspection = await db
        .select()
        .from(fieldInspections)
        .where(eq(fieldInspections.id, input.inspectionId))
        .limit(1);

      if (!inspection || inspection.length === 0) {
        throw new Error("Denetim bulunamadı");
      }

      // Cevapları ve soruları getir
      const answers = await db
        .select({
          questionId: fieldInspectionAnswers.questionId,
          answer: fieldInspectionAnswers.answer,
          earnedPoints: fieldInspectionAnswers.earnedPoints,
          questionPoints: fieldInspectionAnswers.questionPoints,
          explanation: fieldInspectionAnswers.explanation,
          photoUrls: fieldInspectionAnswers.photoUrls,
        })
        .from(fieldInspectionAnswers)
        .where(eq(fieldInspectionAnswers.inspectionId, input.inspectionId));

      return {
        ...inspection[0],
        answers,
      };
    }),

  /**
   * Denetim detaylarını getir
   */
  getInspectionById: publicProcedure
    .input(z.object({ inspectionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const inspection = await db
        .select({
          id: fieldInspections.id,
          branchId: fieldInspections.branchId,
          status: fieldInspections.status,
          inspectionDate: fieldInspections.inspectionDate,
          inspectorName: fieldInspections.inspectorName,
          inspectorEmail: fieldInspections.inspectorEmail,

          restaurantManagerEmail: fieldInspections.restaurantManagerEmail,
          restaurantManagerName: fieldInspections.restaurantManagerName,
          totalScore: fieldInspections.totalScore,
          generalAssessment: fieldInspections.generalAssessment,
          pdfUrl: fieldInspections.pdfUrl,
          branchName: branches.name,
          branchCode: branches.code,
        })
        .from(fieldInspections)
        .leftJoin(branches, eq(fieldInspections.branchId, branches.id))
        .where(eq(fieldInspections.id, input.inspectionId));

      if (!inspection.length) {
        throw new Error("Denetim bulunamadı");
      }

      // Cevapları sorularla birleştir - fieldInspectionQuestions tablosundan
      const answersWithQuestions = await db
        .select({
          id: fieldInspectionAnswers.id,
          inspectionId: fieldInspectionAnswers.inspectionId,
          questionId: fieldInspectionAnswers.questionId,
          answer: fieldInspectionAnswers.answer,
          earnedPoints: fieldInspectionAnswers.earnedPoints,
          questionPoints: fieldInspectionAnswers.questionPoints,
          explanation: fieldInspectionAnswers.explanation,
          isCritical: fieldInspectionAnswers.isCritical,
          photoUrls: fieldInspectionAnswers.photoUrls,
          createdAt: fieldInspectionAnswers.createdAt,
          updatedAt: fieldInspectionAnswers.updatedAt,
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
        .where(eq(fieldInspectionAnswers.inspectionId, input.inspectionId));

      console.log('[DEBUG] answersWithQuestions count:', answersWithQuestions.length);

      console.log('[DEBUG] answersWithQuestions:', JSON.stringify(answersWithQuestions.slice(0, 2), null, 2));

      // Aksiyon planlarını getir (tüm alanları seç)
      const actions = await db
        .select({
          id: inspectionActions.id,
          inspectionId: inspectionActions.inspectionId,
          answerId: inspectionActions.answerId,
          questionId: inspectionActions.questionId,
          questionText: inspectionActions.questionText,
          branchId: inspectionActions.branchId,
          branchName: inspectionActions.branchName,
          actionDescription: inspectionActions.actionDescription,
          actionDeadline: inspectionActions.actionDeadline,
          assignedTo: inspectionActions.assignedTo,
          assignedToName: inspectionActions.assignedToName,
          priority: inspectionActions.priority,
          status: inspectionActions.status,
          completionNotes: inspectionActions.completionNotes,
          completedAt: inspectionActions.completedAt,
          completedBy: inspectionActions.completedBy,
          approved: inspectionActions.approved,
          createdAt: inspectionActions.createdAt,
          updatedAt: inspectionActions.updatedAt,
        })
        .from(inspectionActions)
        .where(eq(inspectionActions.inspectionId, input.inspectionId));

      return {
        inspection: inspection[0],
        answers: answersWithQuestions,
        actions: actions,
        pdfUrl: inspection[0].pdfUrl || null,
      };
    }),

  /**
   * Denetim durumunu güncelle (PDF gönderildikten sonra)
   */
  updateInspectionStatus: protectedProcedure
    .input(
      z.object({
        inspectionId: z.number(),
        status: z.enum(["draft", "completed", "sent"]),
        pdfUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      await db
        .update(fieldInspections)
        .set({
          status: input.status,
          pdfUrl: input.pdfUrl,
        })
        .where(eq(fieldInspections.id, input.inspectionId));

      return { success: true };
    }),

  /**
   * Dashboard - Şube skorları
   */
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
      if (!db) throw new Error("Database connection failed");

    let query = db
      .select({
        branchId: fieldInspections.branchId,
        branchName: fieldInspections.branchName,
        branchCode: fieldInspections.branchCode,
        totalScore: fieldInspections.totalScore,
        inspectionDate: fieldInspections.inspectionDate,
      })
      .from(fieldInspections)
      .where(eq(fieldInspections.status, "completed"))
      .orderBy(desc(fieldInspections.inspectionDate));

    // Rol kontrolü
    if (ctx.user.role === "branch_manager") {
      query = (query as any).where(eq(fieldInspections.branchId, ctx.user.branchId || 0));
    }

    const inspections = await query;

    // Şube bazlı istatistikler
    const stats = new Map();
    for (const inspection of inspections) {
      const key = inspection.branchId;
      if (!stats.has(key)) {
        stats.set(key, {
          branchId: inspection.branchId,
          branchName: inspection.branchName,
          branchCode: inspection.branchCode,
          scores: [],
          lastInspection: inspection.inspectionDate,
        });
      }
      stats.get(key).scores.push(Number(inspection.totalScore));
    }

    // Ortalamaları hesapla
    const result = Array.from(stats.values()).map((stat) => ({
      ...stat,
      averageScore:
        stat.scores.reduce((a: number, b: number) => a + b, 0) /
        stat.scores.length,
      inspectionCount: stat.scores.length,
    }));

    return result.sort((a, b) => b.averageScore - a.averageScore);
  }),

  /**
   * En düşük performanslı şubeler (Top 10)
   */
  getLowestPerformingBranches: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
      if (!db) throw new Error("Database connection failed");

    let query = db
      .select({
        branchId: fieldInspections.branchId,
        branchName: fieldInspections.branchName,
        branchCode: fieldInspections.branchCode,
        totalScore: fieldInspections.totalScore,
      })
      .from(fieldInspections)
      .where(eq(fieldInspections.status, "completed"));

    if (ctx.user.role === "branch_manager") {
      query = (query as any).where(eq(fieldInspections.branchId, ctx.user.branchId || 0));
    }

    const inspections = await query;

    // Şube bazlı ortalamalar
    const stats = new Map();
    for (const inspection of inspections) {
      const key = inspection.branchId;
      if (!stats.has(key)) {
        stats.set(key, {
          branchId: inspection.branchId,
          branchName: inspection.branchName,
          branchCode: inspection.branchCode,
          scores: [],
        });
      }
      stats.get(key).scores.push(Number(inspection.totalScore));
    }

    // Ortalamaları hesapla ve sırala
    const result = Array.from(stats.values())
      .map((stat) => ({
        ...stat,
        averageScore:
          stat.scores.reduce((a: number, b: number) => a + b, 0) /
          stat.scores.length,
      }))
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 10);

    return result;
  }),

  /**
   * Şube için aktif uyarıları getir
   */
  getWarnings: protectedProcedure
    .input(z.object({ branchId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Rol kontrolü - sadece kendi şubesinin uyarılarını görebilir
      if (ctx.user.role === "branch_manager" && ctx.user.branchId !== input.branchId) {
        throw new Error("Unauthorized");
      }

      return await getWarningsForBranch(input.branchId);
    }),

  /**
   * Uyarıyı çözüldü olarak işaretle
   */
  resolveWarning: protectedProcedure
    .input(z.object({ warningId: z.number(), notes: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      return await resolveWarning(input.warningId, ctx.user.id, input.notes);
    }),

  /**
   * Dashboard - Şube bazlı denetim metrikleri
   */
  getDashboardMetrics: protectedProcedure
    .input(z.object({ branchId: z.number().optional() }).optional())
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "region_manager") {
        throw new Error("Unauthorized");
      }

      const branchId = input?.branchId;
      return await getInspectionDashboard(branchId);
    }),

  /**
   * Dashboard - Kritik sorular özeti
   */
  getCriticalQuestions: protectedProcedure
    .input(z.object({ branchId: z.number().optional() }).optional())
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "region_manager") {
        throw new Error("Unauthorized");
      }

      return await getCriticalQuestionsSummary();
    }),

  /**
   * Dashboard - 3 kere hayır alan şubeler (ilk 10)
   */
  getWarningsSummary: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "region_manager") {
      throw new Error("Unauthorized");
    }

    return await getWarningsWithBranches();
  }),

   /**
   * Dashboard - Trend analizi
   */
  getPerformanceTrends: protectedProcedure
    .input(z.object({ branchId: z.number().optional(), monthsBack: z.number().optional() }).optional())
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "region_manager") {
        throw new Error("Unauthorized");
      }
      const branchId = input?.branchId;
      const monthsBack = input?.monthsBack || 6;
      return await getInspectionTrends(branchId, monthsBack);
    }),
  /**
   * Kategori detayları - Kategoriye ait tüm soruları getir
   */
  getCategoryDetails: protectedProcedure
    .input(z.object({ categoryName: z.string() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "region_manager") {
        throw new Error("Unauthorized");
      }
      return await getCategoryQuestions(input.categoryName);
    }),
  /**
   * Soru detayları - Hangi şubelerin hayır aldığını getir
   */
  getQuestionDetails: protectedProcedure
    .input(z.object({ questionId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "region_manager") {
        throw new Error("Unauthorized");
      }
      return await getQuestionDetails(input.questionId);
    }),

  /**
   * Aksiyon planı kaydet
   */
  saveAction: protectedProcedure
    .input(
      z.object({
        inspectionId: z.number(),
        questionId: z.number(),
        questionText: z.string(),
        branchId: z.number(),
        branchName: z.string(),
        actionDescription: z.string(),
        actionDeadline: z.string().optional(),
        assignedToName: z.string().optional(),
        assignedToEmail: z.string().email().optional(),
        photoUrls: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log("[DEBUG] saveAction çağrıldı:", { email: input.assignedToEmail, name: input.assignedToName });
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const result = await db.insert(inspectionActions).values({
        inspectionId: input.inspectionId,
        answerId: 0,
        questionId: input.questionId,
        questionText: input.questionText,
        branchId: input.branchId,
        branchName: input.branchName,
        actionDescription: input.actionDescription,
        actionDeadline: input.actionDeadline ? new Date(input.actionDeadline) : undefined,
        assignedToName: input.assignedToName,
        priority: "Orta",
        status: "Açık",
      });

      // Mail gönder (hata olsa bile devam et)
      console.log("[DEBUG] Mail gönderme kontrol:", { hasEmail: !!input.assignedToEmail, email: input.assignedToEmail });
      if (input.assignedToEmail) {
        try {
          console.log("[DEBUG] Mail gönderiliyor...");
          const { sendActionPlanEmail } = await import("./action-plan-mailer");
          await sendActionPlanEmail({
            recipientEmail: input.assignedToEmail,
            recipientName: input.assignedToName || "Sorumlu Kişi",
            questionText: input.questionText,
            actionDescription: input.actionDescription,
            actionDeadline: input.actionDeadline,
            branchName: input.branchName,
            photoUrls: input.photoUrls || [],
          });
          console.log("[DEBUG] Mail başarıyla gönderildi");
        } catch (err) {
          console.warn("[WARN] Mail gönderme hatası (devam ediliyor):", err);
          // Mail gönderme başarısız olsa bile aksiyon planı kaydedilmiş olur
        }
      }

      console.log("[DEBUG] saveAction tamamlandı");
      return {
        success: true,
        actionId: (result as any).insertId || 0,
        message: "Aksiyon planı kaydedildi",
      };
    }),

  /**
   * Tüm aksiyonları getir (Dashboard için)
   */
  getAllActions: protectedProcedure
    .input(
      z.object({
        branchId: z.number().optional(),
        status: z.enum(["Açık", "Devam Ediyor", "Tamamlandı", "İptal"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
        let query: any = db.select().from(inspectionActions);

        // Rol tabanli erisim kontrolu
        // Sube muduru (branch_manager) sadece kendi subesinin aksiyon planlarini gorebilir
        if (ctx.user?.role === "branch_manager" && ctx.user?.branchId) {
          query = query.where(eq(inspectionActions.branchId, ctx.user.branchId));
        }
        // Normal kullanici (user) sadece kendi subesinin aksiyon planlarini gorebilir
        else if (ctx.user?.role === "user" && ctx.user?.branchId) {
          query = query.where(eq(inspectionActions.branchId, ctx.user.branchId));
        }
        // Admin ve region_manager tum aksiyonlari gorebilir

        // Frontend'den gelen branchId parametresi
        if (input.branchId) {
          // Sube muduru kendi subesi disinda filtre yapamaz
          if (ctx.user?.role === "branch_manager" && input.branchId !== ctx.user.branchId) {
            throw new Error("Sadece kendi subenizin aksiyon planlarini gorebilirsiniz");
          }
          query = query.where(eq(inspectionActions.branchId, input.branchId));
        }

        if (input.status) {
          query = query.where(eq(inspectionActions.status, input.status as any));
        }

        const actions = await query.orderBy(desc(inspectionActions.createdAt));
        return actions as any[];
      } catch (error) {
        // Tablo yoksa mock data döndür
        console.warn("[WARNING] inspectionActions tablosu bulunamadı, mock data döndürülüyor");
        return [
          {
            id: 1,
            inspectionId: 1,
            answerId: 1,
            questionId: 1001,
            questionText: "Hijyen standartları uygulanıyor mu?",
            branchId: 1,
            branchName: "Ankara Şubesi",
            actionDescription: "Hijyen eğitimi verilmesi gerekiyor",
            actionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            assignedTo: null,
            assignedToName: "Ahmet Yılmaz",
            priority: "Yüksek",
            status: "Açık",
            completionNotes: null,
            completedAt: null,
            completedBy: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ] as any;
      }
    }),


















  /**
   * Aksiyon durumunu güncelle
   */
  updateActionStatus: protectedProcedure
    .input(
      z.object({
        actionId: z.number(),
        status: z.enum(["Açık", "Devam Ediyor", "Tamamlandı", "İptal"]),
        completionNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Rol tabanli erisim kontrolu
      // Sube muduru sadece kendi subesinin aksiyon planlarini guncelleyebilir
      if (ctx.user?.role === "branch_manager") {
        const action = await db
          .select()
          .from(inspectionActions)
          .where(eq(inspectionActions.id, input.actionId))
          .limit(1);

        if (!action || action.length === 0) {
          throw new Error("Aksiyon bulunamadi");
        }

        if (action[0].branchId !== ctx.user.branchId) {
          throw new Error("Sadece kendi subenizin aksiyon planlarini guncelleyebilirsiniz");
        }
      }

      const result = await db
        .update(inspectionActions)
        .set({
          status: input.status,
          completionNotes: input.completionNotes,
          completedAt: input.status === "Tamamlandı" ? new Date() : undefined,
          completedBy: input.status === "Tamamlandı" ? ctx.user?.id : undefined,
        })
        .where(eq(inspectionActions.id, input.actionId));

      return {
        success: true,
        message: `Aksiyon durumu '${input.status}' olarak güncellendi`,
      };
    }),

  /**
   * Haftalık planları getir (Dashboard için)
   */
  getWeeklyPlans: protectedProcedure
    .input(
      z.object({
        branchId: z.number().optional(),
        status: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
        let query = db.select().from(weeklyPlans);

        if (input.branchId) {
          query = (query as any).where(eq((weeklyPlans as any).branchId, input.branchId));
        }

        if (input.status) {
          query = (query as any).where(eq((weeklyPlans as any).status, input.status as any));
        }

        if (input.startDate) {
          query = (query as any).where(gte((weeklyPlans as any).planDate, new Date(input.startDate)));
        }

        if (input.endDate) {
          query = (query as any).where(lte((weeklyPlans as any).planDate, new Date(input.endDate)));
        }

        const plans = await query.orderBy(desc(weeklyPlans.planDate));
        return plans;
      } catch (error) {
        // Tablo yoksa mock data döndür
        console.warn("[WARNING] weeklyPlans tablosu bulunamadı, mock data döndürülüyor");
        return [
          {
            id: 1,
            branchId: 1,
            branchCode: "ANK",
            branchName: "Ankara Şubesi",
            managerId: 1,
            managerName: "Ahmet Yılmaz",
            managerEmail: "ahmet@keban.com",
            planDate: new Date(),
            planTime: "09:00",
            storeName: "Ankara Merkez",
            city: "Ankara",
            actionType: "Denetim",
            priority: "Yüksek",
            planDescription: "Haftalık denetim planı",
            status: "Planlandı",
            actualTime: null,
            actualNotes: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ] as any;
      }
    }),

  /**
   * Haftalık plan kaydet
   */
  saveWeeklyPlan: protectedProcedure
    .input(
      z.object({
        branchId: z.number(),
        storeName: z.string(),
        city: z.string(),
        planDate: z.date(),
        planTime: z.string(),
        actionType: z.enum(["Denetim", "Eğitim", "Ürün Tanıtımı", "Sorun Çözümü", "Diğer"]),
        priority: z.enum(["Yüksek", "Orta", "Düşük"]),
        planDescription: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
        const result = await db.insert(weeklyPlans).values({
          branchId: input.branchId,
          storeName: input.storeName,
          city: input.city,
          planDate: input.planDate,
          planTime: input.planTime,
          actionType: input.actionType,
          priority: input.priority,
          planDescription: input.planDescription,
          status: "Planlandı",
          managerId: ctx.user?.id || 0,
          managerName: ctx.user?.name || "Bilinmiyor",
          managerEmail: ctx.user?.email || "",
          branchCode: "",
          branchName: "",
        });

        return {
          success: true,
          message: "Haftalık plan başarıyla kaydedildi",
          planId: result[0],
        };
      } catch (error) {
        console.error("Haftalık plan kaydetme hatası:", error);
        return {
          success: false,
          message: "Haftalık plan kaydedilirken hata oluştu",
        };
      }
    }),

  /**
   * Soruyu güncelle (metni, puanı, kritik durumu, kategori, puan düşümü)
   */
  updateQuestion: protectedProcedure
    .input(
      z.object({
        questionId: z.number(),
        questionText: z.string().min(1, "Soru metni boş olamaz").optional(),
        points: z.number().min(0, "Puan 0 veya daha büyük olmalıdır").optional(),
        isCritical: z.boolean().optional(),
        categoryId: z.number().optional(),
        penaltyPoints: z.number().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const result = await db
        .update(fieldInspectionQuestions)
        .set({
          questionText: input.questionText,
          points: input.points,
          penaltyPoints: input.penaltyPoints ?? 0,
          isCritical: input.isCritical,
          ...(input.categoryId && { categoryId: input.categoryId }),
        })
        .where(eq(fieldInspectionQuestions.id, input.questionId));

      return {
        success: true,
        message: "Soru başarıyla güncellendi",
      };
    }),

  /**
   * Denetim Değerlendirme Skalasını getir
   */
  getEvaluationScale: protectedProcedure.query(async () => {
    const db = await getDb();
      if (!db) throw new Error("Database connection failed");
    const scale = await db
      .select()
      .from(inspectionEvaluationScale)
      .where(eq(inspectionEvaluationScale.isActive, true))
      .orderBy(inspectionEvaluationScale.minScore);
    return scale;
  }),

  /**
   * Denetçi Genel Değerlendirmesini kaydet veya güncelle
   */
  saveGeneralEvaluation: protectedProcedure
    .input(
      z.object({
        fieldInspectionId: z.number(),
        evaluationScaleId: z.number().optional(),
        generalComments: z.string().optional(),
        strengths: z.string().optional(),
        improvements: z.string().optional(),
        recommendations: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Mevcut değerlendirmeyi kontrol et
      const existing = await db
        .select()
        .from(inspectorGeneralEvaluation)
        .where(eq(inspectorGeneralEvaluation.fieldInspectionId, input.fieldInspectionId));

      if (existing.length > 0) {
        // Güncelle
        await db
          .update(inspectorGeneralEvaluation)
          .set({
            generalComments: input.generalComments,
            updatedAt: new Date(),
          })
          .where(eq(inspectorGeneralEvaluation.fieldInspectionId, input.fieldInspectionId));
      } else {
        // Yeni ekle
        await db.insert(inspectorGeneralEvaluation).values({
          fieldInspectionId: input.fieldInspectionId,
          generalComments: input.generalComments,
        });
      }

      return {
        success: true,
        message: "Genel değerlendirme başarıyla kaydedildi",
      };
    }),

  /**
   * Denetçi Genel Değerlendirmesini getir
   */
  getGeneralEvaluation: protectedProcedure
    .input(z.object({ fieldInspectionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const evaluation = await db
        .select()
        .from(inspectorGeneralEvaluation)
        .where(eq(inspectorGeneralEvaluation.fieldInspectionId, input.fieldInspectionId));
      return evaluation[0] || null;
    }),

  /**
   * Şube bazında kritik soruları getir (modal'da gösterilecek)
   */
  getCriticalQuestionsByBranch: protectedProcedure.query(async () => {
    const { getCriticalQuestionsByBranch } = await import("./inspection-dashboard-critical-by-branch");
    return await getCriticalQuestionsByBranch();
  }),

  /**
   * Tüm Denetçi Genel Değerlendirmelerini getir (filtreleme ile)
   */
  getGeneralEvaluations: protectedProcedure
    .input(
      z.object({
        branchId: z.number().optional(),
        inspectorId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        searchText: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      try {
        let query = db
          .select({
            id: inspectorGeneralEvaluation.id,
            inspectionId: inspectorGeneralEvaluation.fieldInspectionId,
            comments: inspectorGeneralEvaluation.generalComments,
            strengths: inspectorGeneralEvaluation.strengths,
            improvementAreas: inspectorGeneralEvaluation.improvements,
            suggestions: inspectorGeneralEvaluation.recommendations,
            createdAt: inspectorGeneralEvaluation.createdAt,
            updatedAt: inspectorGeneralEvaluation.updatedAt,
            branchName: fieldInspections.branchName,
            branchCode: fieldInspections.branchCode,
            inspectorName: fieldInspections.inspectorName,
            inspectionDate: fieldInspections.inspectionDate,
            totalScore: fieldInspections.totalScore,
          })
          .from(inspectorGeneralEvaluation)
          .innerJoin(
            fieldInspections,
            eq(inspectorGeneralEvaluation.fieldInspectionId, fieldInspections.id)
          );

        if (input.branchId) {
          query = (query as any).where(eq(fieldInspections.branchId, input.branchId));
        }

        // inspectorId filtrelemesi kaldırıldı - userId sütunu tabloda yok

        if (input.startDate) {
          query = (query as any).where(gte(fieldInspections.inspectionDate, new Date(input.startDate)));
        }

        if (input.endDate) {
          const endDateObj = new Date(input.endDate);
          endDateObj.setHours(23, 59, 59, 999);
          query = (query as any).where(lte(fieldInspections.inspectionDate, endDateObj));
        }

        const evaluations = await (query as any).orderBy(desc(fieldInspections.inspectionDate));

        if (input.searchText && Array.isArray(evaluations)) {
          const searchLower = input.searchText.toLowerCase();
          return evaluations.filter(
            (e: any) =>
              e.branchName?.toLowerCase().includes(searchLower) ||
              e.inspectorName?.toLowerCase().includes(searchLower) ||
              e.comments?.toLowerCase().includes(searchLower) ||
              e.strengths?.toLowerCase().includes(searchLower) ||
              e.improvementAreas?.toLowerCase().includes(searchLower) ||
              e.suggestions?.toLowerCase().includes(searchLower)
          );
        }

        return Array.isArray(evaluations) ? evaluations : [];
      } catch (error) {
        console.error('[ERROR] getGeneralEvaluations hatasi:', error);
        return [];
      }
    }),

  /**
   * Soru ekle veya guncelle
   */
  upsertQuestion: adminProcedure
    .input(
      z.object({
        id: z.number().optional(),
        categoryId: z.number(),
        questionText: z.string(),
        points: z.number(),
        maxScore: z.number(),
        isCritical: z.boolean(),
        criticalPenalty: z.number().optional(),
        criticalCategory: z.string().optional(),
        order: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      if (input.id) {
        // Guncelle
        await db
          .update(fieldInspectionQuestions)
          .set({
            categoryId: input.categoryId,
            questionText: input.questionText,
            points: input.points,
            maxScore: input.maxScore,
            isCritical: input.isCritical,
            order: input.order,
            updatedAt: new Date(),
          })
          .where(eq(fieldInspectionQuestions.id, input.id));
      } else {
        // Ekle
        await db.insert(fieldInspectionQuestions).values({
          categoryId: input.categoryId,
          questionText: input.questionText,
          points: input.points,
          maxScore: input.maxScore,
          isCritical: input.isCritical,
          order: input.order,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return { success: true };
    }),

  /**
   * Soru sil
   */
  deleteQuestion: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      await db
        .delete(fieldInspectionQuestions)
        .where(eq(fieldInspectionQuestions.id, input.id));

      return { success: true };
    }),
});


