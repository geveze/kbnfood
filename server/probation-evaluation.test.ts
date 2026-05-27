import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { createCallerFactory } from "./_core/trpc";

const createCaller = createCallerFactory(appRouter);

describe("Probation Evaluation Router - New System", () => {
  describe("save", () => {
    it("should save a new probation evaluation", async () => {
      const caller = createCaller({
        user: {
          id: 1,
          name: "Test Admin",
          role: "admin",
          branchName: "İstanbul Şubesi",
        },
      } as any);

      const result = await caller.probationEvaluation.save({
        employeeTCNumber: "12345678901",
        employeeName: "Test Personel",
        employeeRegistrationNumber: "SIC001",
        branch: "İstanbul Şubesi",
        department: "Mutfak",
        hireDate: "2026-01-01",
        evaluationType: "1.5_months",
        evaluationMonth: "2026/3",
        scores: {
          "Teknik ve mesleki bilgi": 5,
          "Yöneticileriyle iletişim": 4,
        },
        successPercentage: 75,
        continueEmployment: true,
        overallComments: "İyi performans göstermiştir",
        evaluatedBy: "Müdür Adı",
      });

      expect(result).toBeDefined();
      expect((result as any).success).toBe(true);
      expect((result as any).canContinue).toBe(true);
    });

    it("should reject non-authorized users from saving evaluations", async () => {
      const caller = createCaller({
        user: {
          id: 2,
          name: "Regular User",
          role: "user",
          branchName: "İstanbul Şubesi",
        },
      } as any);

      try {
        await caller.probationEvaluation.save({
          employeeTCNumber: "98765432109",
          employeeName: "Jane Doe",
          branch: "İstanbul Şubesi",
          evaluationType: "5.5_months",
          evaluationMonth: "2026/8",
          scores: {},
          successPercentage: 60,
          continueEmployment: true,
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as any).message).toContain("Unauthorized");
      }
    });

    it("should calculate success percentage correctly", async () => {
      const caller = createCaller({
        user: {
          id: 1,
          name: "Test Admin",
          role: "admin",
          branchName: "Ankara Şubesi",
        },
      } as any);

      // Low score - should not continue
      const lowScoreResult = await caller.probationEvaluation.save({
        employeeTCNumber: "11111111111",
        employeeName: "Low Score Test",
        branch: "Ankara Şubesi",
        evaluationType: "1.5_months",
        evaluationMonth: "2026/3",
        scores: {
          "Kriter 1": 1,
          "Kriter 2": 2,
        },
        successPercentage: 30,
        continueEmployment: false,
      });

      expect((lowScoreResult as any).canContinue).toBe(false);

      // High score - should continue
      const highScoreResult = await caller.probationEvaluation.save({
        employeeTCNumber: "22222222222",
        employeeName: "High Score Test",
        branch: "Ankara Şubesi",
        evaluationType: "1.5_months",
        evaluationMonth: "2026/3",
        scores: {
          "Kriter 1": 5,
          "Kriter 2": 5,
        },
        successPercentage: 90,
        continueEmployment: true,
      });

      expect((highScoreResult as any).canContinue).toBe(true);
    });

    it("should handle evaluation types correctly", async () => {
      const caller = createCaller({
        user: {
          id: 1,
          name: "Test Admin",
          role: "admin",
          branchName: "İzmir Şubesi",
        },
      } as any);

      // 1.5 months evaluation
      const result1 = await caller.probationEvaluation.save({
        employeeTCNumber: "33333333333",
        employeeName: "1.5 Month Test",
        branch: "İzmir Şubesi",
        evaluationType: "1.5_months",
        evaluationMonth: "2026/3",
        scores: {},
        successPercentage: 70,
        continueEmployment: true,
      });

      expect((result1 as any).success).toBe(true);

      // 5.5 months evaluation
      const result2 = await caller.probationEvaluation.save({
        employeeTCNumber: "44444444444",
        employeeName: "5.5 Month Test",
        branch: "İzmir Şubesi",
        evaluationType: "5.5_months",
        evaluationMonth: "2026/8",
        scores: {},
        successPercentage: 75,
        continueEmployment: true,
      });

      expect((result2 as any).success).toBe(true);
    });
  });

  describe("getByTCNumber", () => {
    it("should retrieve an evaluation by TC number", async () => {
      const caller = createCaller({
        user: {
          id: 1,
          name: "Test Admin",
          role: "admin",
          branchName: "Bursa Şubesi",
        },
      } as any);

      // First save an evaluation
      await caller.probationEvaluation.save({
        employeeTCNumber: "55555555555",
        employeeName: "Retrieve Test",
        branch: "Bursa Şubesi",
        evaluationType: "1.5_months",
        evaluationMonth: "2026/3",
        scores: { "Test Kriter": 4 },
        successPercentage: 80,
        continueEmployment: true,
      });

      // Then retrieve it
      const result = await caller.probationEvaluation.getByTCNumber({
        tcNumber: "55555555555",
      });

      expect(result).toBeDefined();
      expect((result as any).employeeName).toBe("Retrieve Test");
      expect((result as any).branch).toBe("Bursa Şubesi");
    });

    it("should return null for non-existent TC number", async () => {
      const caller = createCaller({
        user: {
          id: 1,
          name: "Test Admin",
          role: "admin",
          branchName: "Test Şubesi",
        },
      } as any);

      const result = await caller.probationEvaluation.getByTCNumber({
        tcNumber: "99999999999",
      });

      expect(result).toBeNull();
    });
  });

  describe("listByBranch", () => {
    it("should list evaluations for a branch", async () => {
      const caller = createCaller({
        user: {
          id: 1,
          name: "Test Admin",
          role: "admin",
          branchName: "Admin Test Şubesi",
        },
      } as any);

      const result = await caller.probationEvaluation.listByBranch({
        branch: "Admin Test Şubesi",
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("branch_manager should only see their own branch evaluations", async () => {
      const caller = createCaller({
        user: {
          id: 2,
          name: "Branch Manager",
          role: "branch_manager",
          branchName: "Manager Test Şubesi",
        },
      } as any);

      const result = await caller.probationEvaluation.listByBranch({});

      expect(Array.isArray(result)).toBe(true);
      // All results should be for the manager's branch
      result.forEach((evaluation: any) => {
        expect(evaluation.branch).toBe("Manager Test Şubesi");
      });
    });

    it("should filter by evaluation type", async () => {
      const caller = createCaller({
        user: {
          id: 1,
          name: "Test Admin",
          role: "admin",
          branchName: "Filter Test Şubesi",
        },
      } as any);

      // Save evaluations with different types
      await caller.probationEvaluation.save({
        employeeTCNumber: "66666666666",
        employeeName: "Type 1 Test",
        branch: "Filter Test Şubesi",
        evaluationType: "1.5_months",
        evaluationMonth: "2026/3",
        scores: {},
        successPercentage: 70,
        continueEmployment: true,
      });

      await caller.probationEvaluation.save({
        employeeTCNumber: "77777777777",
        employeeName: "Type 2 Test",
        branch: "Filter Test Şubesi",
        evaluationType: "5.5_months",
        evaluationMonth: "2026/8",
        scores: {},
        successPercentage: 75,
        continueEmployment: true,
      });

      // List by evaluation type
      const result = await caller.probationEvaluation.listByBranch({
        branch: "Filter Test Şubesi",
        evaluationType: "1.5_months",
      });

      expect(Array.isArray(result)).toBe(true);
      result.forEach((evaluation: any) => {
        expect(evaluation.evaluationType).toBe("1.5_months");
      });
    });
  });

  describe("delete", () => {
    it("should delete an evaluation (admin only)", async () => {
      const caller = createCaller({
        user: {
          id: 1,
          name: "Test Admin",
          role: "admin",
          branchName: "Delete Test Şubesi",
        },
      } as any);

      // First save an evaluation
      await caller.probationEvaluation.save({
        employeeTCNumber: "88888888888",
        employeeName: "Delete Test",
        branch: "Delete Test Şubesi",
        evaluationType: "1.5_months",
        evaluationMonth: "2026/3",
        scores: {},
        successPercentage: 70,
        continueEmployment: true,
      });

      // Delete it
      const result = await caller.probationEvaluation.delete({
        tcNumber: "88888888888",
      });

      expect((result as any).success).toBe(true);

      // Verify it's deleted
      const retrieved = await caller.probationEvaluation.getByTCNumber({
        tcNumber: "88888888888",
      });

      expect(retrieved).toBeNull();
    });

    it("should reject non-admin users from deleting", async () => {
      const caller = createCaller({
        user: {
          id: 2,
          name: "Regular User",
          role: "user",
          branchName: "Test Şubesi",
        },
      } as any);

      try {
        await caller.probationEvaluation.delete({
          tcNumber: "12345678901",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as any).message).toContain("Unauthorized");
      }
    });
  });
});
