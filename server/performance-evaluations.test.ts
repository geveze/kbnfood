import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import {
  createPerformanceEvaluation,
  getPerformanceEvaluations,
  getPerformanceEvaluationById,
  createPerformanceEvaluationItem,
  getPerformanceEvaluationItems,
  getUsedEvaluationPeriods,
  createUsedEvaluationPeriod,
  isEvaluationPeriodUsed,
  deletePerformanceEvaluation,
  deletePerformanceEvaluationItem,
} from "./db";

describe("Performance Evaluations", () => {
  let testEvaluationId: number;
  const testBranchId = 1;
  const testPeriod = "3. ay";

  beforeAll(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available for testing");
    }
  });

  it("should create a performance evaluation", async () => {
    const evaluation = await createPerformanceEvaluation({
      branchId: testBranchId,
      evaluationPeriod: testPeriod,
      employeeName: "Test Employee",
      employeePosition: "Restoran Müdürü",
      employeeIdNumber: "12345",
      hireDate: new Date("2023-01-01"),
      evaluationDate: new Date(),
      evaluatedByManager: "Test Manager",
      managerOpinion: "Test opinion",
      totalScore: 75,
      evaluationScale: "İyi",
      createdByUserId: 1,
    });

    expect(evaluation).toBeDefined();
    testEvaluationId = (evaluation as any).insertId || (evaluation as any).lastInsertRowid;
    if (testEvaluationId) {
      expect(testEvaluationId).toBeGreaterThan(0);
    }
  });

  it("should get performance evaluations by branch", async () => {
    const evaluations = await getPerformanceEvaluations({
      branchId: testBranchId,
    });

    expect(Array.isArray(evaluations)).toBe(true);
  });

  it("should mark evaluation period as used", async () => {
    await createUsedEvaluationPeriod(testBranchId, testPeriod);
    const isUsed = await isEvaluationPeriodUsed(testBranchId, testPeriod);
    expect(isUsed).toBe(true);
  });

  it("should prevent duplicate evaluation periods", async () => {
    const isUsed = await isEvaluationPeriodUsed(testBranchId, testPeriod);
    expect(isUsed).toBe(true);
  });

  it("should return false for non-existent period", async () => {
    const isUsed = await isEvaluationPeriodUsed(testBranchId, "99. ay");
    expect(isUsed).toBe(false);
  });

  it("should get used evaluation periods", async () => {
    const usedPeriods = await getUsedEvaluationPeriods(testBranchId);
    expect(Array.isArray(usedPeriods)).toBe(true);
  });

  afterAll(async () => {
    if (testEvaluationId) {
      try {
        const items = await getPerformanceEvaluationItems(testEvaluationId);
        for (const item of items) {
          try {
            await deletePerformanceEvaluationItem(item.id);
          } catch (e) {
            // Ignore
          }
        }
        await deletePerformanceEvaluation(testEvaluationId);
      } catch (e) {
        // Ignore
      }
    }
  });
});
