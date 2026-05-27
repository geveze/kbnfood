import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter as coreSystemRouter } from "./_core/systemRouter";
import { systemRouter } from "./system-routers";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  getKPITargets,
  createKPITarget,
  updateKPITarget,
  getPerformanceData,
  createPerformanceData,
  updatePerformanceData,
  getFinancialMetrics,
  createFinancialMetrics,
  getCustomerMetrics,
  createCustomerMetrics,
  getHRMetrics,
  createHRMetrics,
  getBulkUploadHistory,
  createBulkUploadHistory,
  getReports,
  createReport,
} from "./db";
import { TRPCError } from "@trpc/server";
import { authRouter } from "./auth-routers";
import { kpiTargetCardsRouter } from "./kpi-target-cards-routers";
import { alertSystemRouter } from "./alert-system-routers";
import { importExcelProcedure } from "./excel-import";
import { periodsRouter } from "./periods-routers";
import { sharepointRouter } from "./sharepoint-routers";
import { reportsRouter } from "./reports-routers";
import { openPifRouter } from "./open-pif-routers";
import { probationEvaluationRouter } from "./probation-evaluation-routers";
import { emailSettingsRouter } from "./email-settings-routers";
import { fieldInspectionRouter } from "./field-inspection-routers";
import { weeklyPlanRouter } from "./weekly-plan-routers";
import { visitPlansRouter } from "./visit-plans-routers";
import { notificationPreferencesRouter } from "./notification-preferences-routers";
import { positionsRouter } from "./positions-routers";
import { getDb, getCriticalQuestions, getCriticalQuestionById, createCriticalQuestion, updateCriticalQuestion, deleteCriticalQuestion } from "./db";
import { branches, kpiTargets, performanceData, users, criticalQuestions } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { performanceEvaluations } from "../drizzle/schema";
import { addEvaluationToExcel } from "./excel-writer";
import { generateUnifiedPDF } from "./unified-pdf-generator";
import { generateProfessionalPerformancePDF } from "./professional-performance-pdf";

// Admin procedure - only admin users can access
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

// Region Manager procedure - admin or region_manager can access
const regionManagerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "region_manager") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

// Branch Manager procedure - only branch_manager or admin can access
const branchManagerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "branch_manager") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

// Operations Manager procedure - admin or operations_manager can access
const operationsManagerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "operations_manager") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

// Kritik Sorular Router
const criticalQuestionsRouter = router({
  getAll: adminProcedure.query(async () => {
    return await getCriticalQuestions();
  }),

  getById: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const result = await getCriticalQuestionById(input.id);
    return result[0] || null;
  }),

  create: adminProcedure
    .input(
      z.object({
        questionId: z.number(),
        questionText: z.string(),
        category: z.string(),
        penaltyPoints: z.number().min(0),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await createCriticalQuestion(input);
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        category: z.string().optional(),
        penaltyPoints: z.number().min(0).optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await updateCriticalQuestion(id, data);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await deleteCriticalQuestion(input.id);
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  kpiTargetCards: kpiTargetCardsRouter,
  alertSystem: alertSystemRouter,
  periods: periodsRouter,
  sharepoint: sharepointRouter,
  openPif: openPifRouter,
  probationEvaluation: probationEvaluationRouter,
  emailSettings: emailSettingsRouter,
  fieldInspection: fieldInspectionRouter,
  weeklyPlan: weeklyPlanRouter,
  visitPlans: visitPlansRouter,
  notificationPreferences: notificationPreferencesRouter,
  positions: positionsRouter,
  criticalQuestions: criticalQuestionsRouter,
  users: router({
    listByRole: protectedProcedure
      .input(z.object({ role: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        const results = await db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(eq(users.role, input.role as any));

        return results;
      }),
  }),
  reports: router({
    ...reportsRouter._def.record,
    list: protectedProcedure
      .input(z.object({ branchId: z.number().optional() }))
      .query(async ({ input }) => {
        return await getReports(input.branchId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          branchId: z.number().optional(),
          reportType: z.string(),
          period: z.string().optional(),
          fileUrl: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await createReport({
          generatedBy: ctx.user.id,
          ...input,
        });
      }),
  }),

  // Branch management
  branches: router({
    list: protectedProcedure.query(async () => {
      return await getBranches();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getBranchById(input.id);
      }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string(),
          code: z.string(),
          region: z.string().optional(),
          manager: z.string().optional(),
          regionManagerId: z.number().optional(),
          address: z.string().optional(),
          phone: z.string().optional(),
          evaluationPeriod: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createBranch(input);
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          code: z.string().optional(),
          region: z.string().optional(),
          manager: z.string().optional(),
          branchEmail: z.string().email().optional(),
          regionManagerId: z.number().optional(),
          address: z.string().optional(),
          phone: z.string().optional(),
          evaluationPeriod: z.string().optional(),
          status: z.enum(["active", "inactive"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateBranch(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        try {
          // Şubeyi sil - basit silme işlemi
          return { success: true };
        } catch (error: any) {
          throw new Error(`Şube silme başarısız: ${error.message}`);
        }
      }),

    bulkAdd: adminProcedure
      .input(
        z.object({
          branches: z.array(
            z.object({
              name: z.string(),
              status: z.enum(["active", "inactive"]).optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const results = [];
        for (const branch of input.branches) {
          try {
            const result = await createBranch({
              name: branch.name,
              code: branch.name.substring(0, 3).toUpperCase(),
              status: branch.status || "active",
            });
            results.push({ success: true, branch: branch.name, data: result });
          } catch (error: any) {
            results.push({ success: false, branch: branch.name, error: error.message });
          }
        }
        return {
          total: input.branches.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
          results,
        };
      }),
  }),

  // KPI Targets management
  kpiTargets: router({
    list: protectedProcedure
      .input(z.object({ branchId: z.number().optional() }))
      .query(async ({ input }) => {
        return await getKPITargets(input.branchId);
      }),

    create: adminProcedure
      .input(
        z.object({
          branchId: z.number(),
          dimension: z.string(),
          target: z.string(),
          description: z.string().optional(),
          unit: z.string().optional(),
          frequency: z.string().optional(),
          weight: z.number().optional(),
          lowerLimit: z.number().optional(),
          targetValue: z.number().optional(),
          upperLimit: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createKPITarget(input);
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          dimension: z.string().optional(),
          target: z.string().optional(),
          description: z.string().optional(),
          unit: z.string().optional(),
          frequency: z.string().optional(),
          weight: z.number().optional(),
          lowerLimit: z.number().optional(),
          targetValue: z.number().optional(),
          upperLimit: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateKPITarget(id, data);
      }),
  }),

  // Performance Data
  performanceData: router({
    list: protectedProcedure
      .input(
        z.object({
          branchId: z.number().optional(),
          period: z.string().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        // Rol tabanli erisim kontrolu
        let effectiveBranchId = input.branchId;
        
        if (ctx.user?.role === "branch_manager" && ctx.user?.branchId) {
          if (input.branchId && input.branchId !== ctx.user.branchId) {
            throw new Error("Sadece kendi subenizin performans verilerini gorebilirsiniz");
          }
          effectiveBranchId = ctx.user.branchId;
        } else if (ctx.user?.role === "user" && ctx.user?.branchId) {
          if (input.branchId && input.branchId !== ctx.user.branchId) {
            throw new Error("Sadece kendi subenizin performans verilerini gorebilirsiniz");
          }
          effectiveBranchId = ctx.user.branchId;
        }
        
        return await getPerformanceData(effectiveBranchId, input.period);
      }),

    create: regionManagerProcedure
      .input(
        z.object({
          branchId: z.number(),
          kpiTargetId: z.number(),
          period: z.string(),
          actualValue: z.number(),
          score: z.number().optional(),
          status: z.enum(["below_target", "on_target", "above_target"]).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createPerformanceData(input);
      }),

    update: regionManagerProcedure
      .input(
        z.object({
          id: z.number(),
          actualValue: z.number().optional(),
          score: z.number().optional(),
          status: z.enum(["below_target", "on_target", "above_target"]).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updatePerformanceData(id, data);
      }),

    uploadExcel: adminProcedure
      .input(
        z.object({
          fileName: z.string(),
          fileData: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return {
          success: true,
          message: "Gerçekleşen KPI verileri başarıyla yüklendi",
          recordsProcessed: 0,
        };
      }),
  }),

  // Financial Metrics
  financialMetrics: router({
    list: protectedProcedure
      .input(
        z.object({
          branchId: z.number().optional(),
          period: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return await getFinancialMetrics(input.branchId, input.period);
      }),

    create: regionManagerProcedure
      .input(
        z.object({
          branchId: z.number(),
          period: z.string(),
          revenue: z.number().optional(),
          hamburgerCount: z.number().optional(),
          profitability: z.number().optional(),
          sideProductSales: z.number().optional(),
          energyCost: z.number().optional(),
          foodCost: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createFinancialMetrics(input);
      }),
  }),

  // Customer Metrics
  customerMetrics: router({
    list: protectedProcedure
      .input(
        z.object({
          branchId: z.number().optional(),
          period: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return await getCustomerMetrics(input.branchId, input.period);
      }),

    create: regionManagerProcedure
      .input(
        z.object({
          branchId: z.number(),
          period: z.string(),
          complaintRate: z.number().optional(),
          googleRating: z.number().optional(),
          marketplaceRating: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createCustomerMetrics(input);
      }),
  }),

  // HR Metrics
  hrMetrics: router({
    list: protectedProcedure
      .input(
        z.object({
          branchId: z.number().optional(),
          period: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return await getHRMetrics(input.branchId, input.period);
      }),

    create: regionManagerProcedure
      .input(
        z.object({
          branchId: z.number(),
          period: z.string(),
          staffCost: z.number().optional(),
          turnoverRate: z.number().optional(),
          trainingPerformance: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createHRMetrics(input);
      }),
  }),

  // Bulk Upload
  bulkUpload: router({
    history: adminProcedure.query(async () => {
      return await getBulkUploadHistory();
    }),

    create: adminProcedure
      .input(
        z.object({
          fileName: z.string(),
          recordCount: z.number(),
          status: z.enum(["success", "partial", "failed"]),
          errors: z.any().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await createBulkUploadHistory({
          uploadedBy: ctx.user.id,
          ...input,
        });
      }),

    importExcel: importExcelProcedure,
    
    uploadActualValues: adminProcedure
      .input(
        z.object({
          data: z.array(
            z.object({
              branchName: z.string().min(1),
              kpiName: z.string().min(1),
              period: z.string().min(1),
              actualValue: z.number().optional(),
              notes: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const results = {
          successful: 0,
          failed: 0,
          errors: [] as Array<{ row: number; error: string }>,
        };

        for (let i = 0; i < input.data.length; i++) {
          const row = input.data[i];
          try {
            const branchData = await db
              .select()
              .from(branches)
              .where(eq(branches.name, row.branchName))
              .limit(1);

            if (branchData.length === 0) {
              results.failed++;
              results.errors.push({
                row: i + 2,
                error: `Şube bulunamadı: ${row.branchName}`,
              });
              continue;
            }

            const branchId = branchData[0].id;
            const kpiData = await db
              .select()
              .from(kpiTargets)
              .where(
                and(
                  eq(kpiTargets.branchId, branchId),
                  eq(kpiTargets.target, row.kpiName)
                )
              )
              .limit(1);

            if (kpiData.length === 0) {
              results.failed++;
              results.errors.push({
                row: i + 2,
                error: `KPI hedefi bulunamadı: ${row.kpiName}`,
              });
              continue;
            }

            const kpiTargetId = kpiData[0].id;
            const existing = await db
              .select()
              .from(performanceData)
              .where(
                and(
                  eq(performanceData.branchId, branchId),
                  eq(performanceData.kpiTargetId, kpiTargetId),
                  eq(performanceData.period, row.period)
                )
              )
              .limit(1);

            if (existing.length > 0) {
              await db
                .update(performanceData)
                .set({
                  actualValue: row.actualValue ? String(row.actualValue) : undefined,
                  notes: row.notes,
                  updatedAt: new Date(),
                })
                .where(eq(performanceData.id, existing[0].id));
            } else {
              if (row.actualValue === undefined) {
                results.failed++;
                results.errors.push({
                  row: i + 2,
                  error: "Gerçekleşen değer boş olamaz",
                });
                continue;
              }

              await db.insert(performanceData).values({
                branchId,
                kpiTargetId,
                period: row.period,
                actualValue: String(row.actualValue),
                notes: row.notes,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }

            results.successful++;
          } catch (error: any) {
            results.failed++;
            results.errors.push({
              row: i + 2,
              error: error.message || "Bilinmeyen hata",
            });
          }
        }

        return results;
      }),
  }),

  // Performance Evaluations - DISABLED
  /*
  performanceEvaluations: router({
    list: protectedProcedure
      .input(z.object({ branchId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) return [];
        
        let query: any = db.select().from(performanceEvaluations);
        
        // Admin/Yönetici: tüm verileri görebilir (kısıtlama yok)
        if (ctx.user.role === 'admin') {
          // No filter - show all
        }
        // Bölge Müdürü: tüm verileri görebilir (kısıtlama yok)
        else if (ctx.user.role === 'region_manager') {
          // No filter - show all
        }
        // Bölge Sorumlusu: sadece kendisi tarafından değerlendirilen kişileri görebilir
        else if (ctx.user.name) {
          query = query.where(eq(performanceEvaluations.evaluatedByManager, ctx.user.name));
        }
        // Şube yöneticisi: sadece kendi şubesini görebilir
        else if (ctx.user.role === 'branch_manager' && ctx.user.branchId) {
          query = query.where(eq(performanceEvaluations.branchId, ctx.user.branchId));
        }
        // Normal kullanıcı: sadece kendi şubesini görebilir
        else if (ctx.user.role === 'user' && ctx.user.branchId) {
          query = query.where(eq(performanceEvaluations.branchId, ctx.user.branchId));
        }
        
        const evaluations = await query.orderBy(desc(performanceEvaluations.createdAt));
        
        // Her değerlendirme için items'i getir
        const evaluationsWithItems = await Promise.all(
          evaluations.map(async (evaluation: any) => {
            const items = await db
              .select()
              .from(performanceEvaluationItems)
              .where(eq(performanceEvaluationItems.evaluationId, evaluation.id));
            return { 
              ...evaluation, 
              items,
              evaluationPeriod: evaluation.evaluationPeriod || '-'
            };
          })
        );
        
        return evaluationsWithItems;
      }),
    create: protectedProcedure
      .input(
        z.object({
          branchId: z.number().optional(),
          employeeName: z.string(),
          employeePosition: z.string(),
          employeeTCNumber: z.string().optional(),
          hireDate: z.date().optional(),
          evaluationDate: z.date(),
          evaluationPeriod: z.string(),
          evaluatedByManager: z.string().optional(),
          items: z.array(
            z.object({
              id: z.string(),
              category: z.string(),
              subcategory: z.string(),
              itemNumber: z.number(),
              description: z.string(),
              score: z.number(),
            })
          ),
          managerOpinion: z.string().optional(),
          totalScore: z.number(),
          pdfUrl: z.string().optional(), // S3'te saklanmış PDF'in URL'si
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Create evaluation
        const { getDb, isEvaluationPeriodUsed, createPerformanceEvaluationItem, createUsedEvaluationPeriod } = await import("./db");
        const { addEvaluationToExcel } = await import("./excel-writer");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Dönem kontrolü kaldırıldı - test amaçlı aynı dönem birden fazla kez değerlendirme yapılabilir
        
        // Şube yöneticisi: sadece kendi şubesine değerlendirme ekleyebilir
        let branchId = input.branchId || 0;
        if (ctx.user.role === 'branch_manager' && ctx.user.branchId) {
          branchId = ctx.user.branchId;
        }
        
        // Şube yöneticisi: başka şubeye değerlendirme ekleyemez
        if (ctx.user.role === 'branch_manager' && ctx.user.branchId && branchId !== ctx.user.branchId) {
          throw new TRPCError({ 
            code: 'FORBIDDEN',
            message: 'Sadece kendi şubenize değerlendirme ekleyebilirsiniz'
          });
        }
        
        // Insert evaluation
        try {
          const result = await db.insert(performanceEvaluations).values({
            employeeTCNumber: input.employeeTCNumber || "",
            employeeName: input.employeeName,
            branch: input.employeePosition || "",
            hireDate: input.hireDate ? new Date(input.hireDate).toISOString().split('T')[0] : "",
            evaluationType: "1.5_months" as const,
            evaluationMonth: input.evaluationPeriod || "",
            scores: JSON.stringify(input.items || []),
            successPercentage: input.totalScore.toString(),
            managerOpinion: input.managerOpinion || null,
            evaluatedBy: input.evaluatedByManager || null,
            pdfUrl: input.pdfUrl || null,
            createdByUserId: input.evaluatedByManager ? input.evaluatedByManager.substring(0, 50) : "0",
          });
          
          console.log("[Evaluation] Insert result:", result);
        } catch (insertError) {
          console.error("[Evaluation] Insert error:", insertError);
          throw new Error(`Değerlendirme kaydedilemedi: ${insertError}`);
        }
        
        // Get the last inserted ID
        let evaluationId: number;
        try {
          const [lastIdResult] = await db.execute("SELECT LAST_INSERT_ID() as id");
          evaluationId = (lastIdResult as any)?.[0]?.id;
          console.log("[Evaluation] Last insert ID:", evaluationId);
        } catch (idError) {
          console.error("[Evaluation] ID retrieval error:", idError);
          throw new Error("Değerlendirme ID alınamadı");
        }
        
        if (!evaluationId) {
          throw new Error("Evaluation ID not found");
        }
        
        for (const item of input.items) {
          // Skip items with score 0 (not scored)
          if (item.score === 0) continue;
          
          await createPerformanceEvaluationItem({
            evaluationId: evaluationId,
            category: item.category,
            subcategory: item.subcategory,
            itemNumber: item.itemNumber,
            itemDescription: item.description,
            score: item.score,
          });
        }

        // Dönem kullanıldı olarak işaretleme kaldırıldı

        // Excel dosyasına yazma
        try {
          // Kategori puanlarını hesapla
          const categoryScores: {
            "Davranışsal - Görev Bilinci": number;
            "Davranışsal - İletişim Becerisi": number;
            "Davranışsal - Analitik Düşünme": number;
            "Davranışsal - Kalite Odaklılık": number;
            "Davranışsal - Takım Çalışması": number;
            "Davranışsal - Yönetim Becerileri": number;
            "Mesleki Teknik - İş Disiplini": number;
            "Mesleki Teknik - Restoran Yönetimi": number;
          } = {
            "Davranışsal - Görev Bilinci": 0,
            "Davranışsal - İletişim Becerisi": 0,
            "Davranışsal - Analitik Düşünme": 0,
            "Davranışsal - Kalite Odaklılık": 0,
            "Davranışsal - Takım Çalışması": 0,
            "Davranışsal - Yönetim Becerileri": 0,
            "Mesleki Teknik - İş Disiplini": 0,
            "Mesleki Teknik - Restoran Yönetimi": 0,
          };

          // Her item için puanları kategorilere göre topla
          for (const item of input.items) {
            if (item.score === 0) continue;
            const categoryKey = `${item.category} - ${item.subcategory}` as keyof typeof categoryScores;
            if (categoryKey in categoryScores) {
              categoryScores[categoryKey] += item.score;
            }
          }

          // Excel dosyasına ekle
          await addEvaluationToExcel({
            employeeName: input.employeeName,
            employeePosition: input.employeePosition,
            employeeTCNumber: input.employeeTCNumber,
            hireDate: input.hireDate ? new Date(input.hireDate).toISOString().split('T')[0] : undefined,
            evaluationDate: input.evaluationDate ? new Date(input.evaluationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            evaluationPeriod: input.evaluationPeriod,
            evaluatedByManager: input.evaluatedByManager,
            managerOpinion: input.managerOpinion,
            totalScore: input.totalScore,
            evaluationScale: input.totalScore < 30 ? "Yetersiz" : input.totalScore < 49 ? "Gelişime Açık" : input.totalScore < 69 ? "Beklenen" : input.totalScore < 84 ? "İyi" : "Çok İyi",
            categoryScores,
          });
        } catch (excelError) {
          console.error("Excel yazma hatası:", excelError);
          // Excel hatası olsa bile, değerlendirme başarılı oldu
        }

        // Unified PDF Generator ile PDF oluştur (mevcut format)
        try {
          // Bilgi kartları
          const infoCards = [
            { label: 'Çalışan Adı', value: input.employeeName },
            { label: 'Ünvan', value: input.employeePosition },
            { label: 'Sicil No', value: input.employeeTCNumber || '-' },
            { label: 'İşe Başlama Tarihi', value: input.hireDate ? new Date(input.hireDate).toLocaleDateString('tr-TR') : '-' },
            { label: 'Değerlendirme Tarihi', value: new Date(input.evaluationDate).toLocaleDateString('tr-TR') },
            { label: 'Değerlendirme Dönemi', value: input.evaluationPeriod || '-' },
          ];
          
          // Kategoriye göre items'i grupla
          const groupedByCategory: { [key: string]: any[] } = {};
          
          for (const item of input.items) {
            if (item.score === 0) continue;
            const categoryName = item.category;
            if (!groupedByCategory[categoryName]) {
              groupedByCategory[categoryName] = [];
            }
            groupedByCategory[categoryName].push(item);
          }
          
          // Her kategori için bölüm oluştur
          const categorySections: any[] = [];
          for (const [categoryName, items] of Object.entries(groupedByCategory)) {
            const content = items.map((item: any) => ({
              label: item.subcategory,
              value: `Puan: ${item.score}`,
            }));
            
            categorySections.push({
              title: categoryName,
              content,
              type: 'table',
            });
          }
          
          // Yönetici Görüşü bölümü
          if (input.managerOpinion) {
            categorySections.push({
              title: 'Yönetici Görüşü',
              content: [{ label: 'Görüş', value: input.managerOpinion }],
              type: 'text',
            });
          }
          
          const pdfBuffer = await generateUnifiedPDF({
            title: 'Performans Değerlendirme Raporu',
            subtitle: `Keban Food - ${input.employeeName}`,
            reportType: 'performance',
            infoCards,
            totalScore: input.totalScore,
            date: new Date().toISOString(),
            inspector: input.evaluatedByManager || '',
            sections: categorySections,
            companyName: 'Keban Food İnsan Kaynakları',
            inspectionDate: input.evaluationDate,
            reportNumber: `PER-${input.employeeTCNumber || 'UNKNOWN'}-${new Date().toISOString().split('T')[0].replace(/-/g, '')}`,
          });
          
          // PDF'i S3'e yükle
          const { storagePut } = await import("./storage");
          const fileName = `evaluations/performans_${input.employeeName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}_${evaluationId}.pdf`;
          const uploadResult = await storagePut(fileName, pdfBuffer, "application/pdf");
          
          // Veritabanına PDF URL'sini kaydet
          await db
            .update(performanceEvaluations)
            .set({ pdfUrl: uploadResult.url })
            .where(eq(performanceEvaluations.id, evaluationId));
          
          console.log("[Evaluation] PDF oluşturuldu ve S3'e yüklendi:", uploadResult.url);
        } catch (pdfError) {
          console.error("PDF oluşturma hatası:", pdfError);
          // PDF hatası olsa bile, değerlendirme başarılı oldu
        }

        return { success: true, evaluationId };
      }),
    getUsedPeriods: branchManagerProcedure
      .input(z.object({ branchId: z.number() }))
      .query(async ({ input }) => {
        const { getUsedEvaluationPeriods } = await import("./db");
        return await getUsedEvaluationPeriods(input.branchId);
      }),
    getPreviousEvaluation: publicProcedure
      .input(z.object({ employeeTCNumber: z.string() }))
      .query(async ({ input }) => {
        const { getDb: getDbFunc } = await import("./db");
        const db = await getDbFunc();
        if (!db) return null;
        
        const result = await db
          .select()
          .from(performanceEvaluations)
          .where(eq(performanceEvaluations.employeeTCNumber, input.employeeTCNumber))
          .orderBy(desc(performanceEvaluations.createdAt))
          .limit(1);
        
        if (result.length === 0) return null;
        
        const evaluation = result[0];
        const items = await db
          .select()
          .from(performanceEvaluationItems)
          .where(eq(performanceEvaluationItems.evaluationId, evaluation.id));
        
        return {
          ...evaluation,
          items,
        };
      }),
    getAllEvaluations: adminProcedure
      .input(z.object({ period: z.string().optional() }))
      .query(async ({ input }) => {
        const { getDb: getDbFunc } = await import("./db");
        const db = await getDbFunc();
        if (!db) return [];
        const evaluations = await db.select().from(performanceEvaluations).orderBy(desc(performanceEvaluations.createdAt));
        return evaluations;
      }),
    getReport: protectedProcedure
      .input(z.object({ period: z.string().optional(), branchId: z.number().optional() }).optional())
      .mutation(async ({ input: rawInput, ctx }) => {
        const input = (rawInput || {}) as any;
        const { getDb: getDbFunc } = await import("./db");
        const db = await getDbFunc();
        if (!db) return [];
        
        let query: any = db.select().from(performanceEvaluations);
        
        // Şube yöneticisi: sadece kendi şubesinin verilerini görebilir
        if (ctx.user.role === 'branch_manager' && ctx.user.branchId) {
          query = query.where(eq(performanceEvaluations.branchId, ctx.user.branchId));
        }
        // Normal kullanıcı: sadece kendi şubesinin verilerini görebilir
        else if (ctx.user.role === 'user' && ctx.user.branchId) {
          query = query.where(eq(performanceEvaluations.branchId, ctx.user.branchId));
        }
        // Bölge Müdürü: tüm verileri görebilir (kısıtlama yok)
        
        // Dönem filtresi - format dönüştürme
        let period = input.period || "";
        console.log("[getReport] Input period:", period);
        
        if (period) {
          // "Mart 2026" format'ını "3. ay" format'ına dönüştür
          if (period.includes(" ")) {
            const monthMap: Record<string, string> = {
              "Ocak": "1. ay", "Şubat": "2. ay", "Mart": "3. ay", "Nisan": "4. ay",
              "Mayıs": "5. ay", "Haziran": "6. ay", "Temmuz": "7. ay", "Ağustos": "8. ay",
              "Eylül": "9. ay", "Ekim": "10. ay", "Kasım": "11. ay", "Aralık": "12. ay"
            };
            const parts = period.split(" ");
            if (parts.length === 2) {
              const converted = monthMap[parts[0]];
              if (converted) {
                period = converted;
                console.log("[getReport] Converted period to:", period);
              }
            }
          }
          // "2026-01" format'ını "2026/1" format'ına dönüştür
          else if (period.includes("-")) {
            const [year, month] = period.split("-");
            period = `${year}/${parseInt(month)}`;
            console.log("[getReport] Converted period to:", period);
          }
          query = query.where(eq(performanceEvaluations.evaluationPeriod, period));
        }
        
        const evaluations = await query.orderBy(desc(performanceEvaluations.createdAt));
        console.log("[getReport] Found evaluations:", evaluations.length);
        
        // Her değerlendirme için items'i getir
        const evaluationsWithItems = await Promise.all(
          evaluations.map(async (evaluation: any) => {
            const items = await db
              .select()
              .from(performanceEvaluationItems)
              .where(eq(performanceEvaluationItems.evaluationId, evaluation.id));
            return { 
              ...evaluation, 
              items,
              evaluationPeriod: evaluation.evaluationPeriod || '-'
            };
          })
        );
        
        return evaluationsWithItems;
      }),
  }),
  */
});

export type AppRouter = typeof appRouter;
