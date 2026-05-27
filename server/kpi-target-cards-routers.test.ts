import { describe, expect, it } from "vitest";
import { kpiTargetCardsRouter } from "./kpi-target-cards-routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "local",
    role: "admin",
    username: "admin",
    branchId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("kpiTargetCards Router", () => {
  describe("getPeriods", () => {
    it("should return empty array when no data exists", async () => {
      const ctx = createAdminContext();
      const caller = kpiTargetCardsRouter.createCaller(ctx);

      const result = await caller.getPeriods();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getBranchManagers", () => {
    it("should return empty array when no data exists", async () => {
      const ctx = createAdminContext();
      const caller = kpiTargetCardsRouter.createCaller(ctx);

      const result = await caller.getBranchManagers({});

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getDimensions", () => {
    it("should return empty array when no data exists", async () => {
      const ctx = createAdminContext();
      const caller = kpiTargetCardsRouter.createCaller(ctx);

      const result = await caller.getDimensions();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("list", () => {
    it("should return empty array when no data exists", async () => {
      const ctx = createAdminContext();
      const caller = kpiTargetCardsRouter.createCaller(ctx);

      const result = await caller.list({
        period: "2026/3",
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should accept optional filters", async () => {
      const ctx = createAdminContext();
      const caller = kpiTargetCardsRouter.createCaller(ctx);

      const result = await caller.list({
        period: "2026/3",
        branchManager: "BÜLENT AYDOĞAN",
        dimension: "Finans",
        branchName: "İSTANBUL",
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getBranchesByManager", () => {
    it("should return empty array when manager has no branches", async () => {
      const ctx = createAdminContext();
      const caller = kpiTargetCardsRouter.createCaller(ctx);

      const result = await caller.getBranchesByManager({
        branchManager: "NONEXISTENT",
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getBranchTargets", () => {
    it("should return empty array when branch has no targets", async () => {
      const ctx = createAdminContext();
      const caller = kpiTargetCardsRouter.createCaller(ctx);

      const result = await caller.getBranchTargets({
        period: "2026/3",
        branchName: "NONEXISTENT",
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getManagerTargets", () => {
    it("should return empty array when manager has no targets", async () => {
      const ctx = createAdminContext();
      const caller = kpiTargetCardsRouter.createCaller(ctx);

      const result = await caller.getManagerTargets({
        period: "2026/3",
        branchManager: "NONEXISTENT",
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getStatistics", () => {
    it("should return statistics object", async () => {
      const ctx = createAdminContext();
      const caller = kpiTargetCardsRouter.createCaller(ctx);

      const result = await caller.getStatistics({
        period: "2026/3",
      });

      expect(result).toBeDefined();
      expect(result?.totalTargets).toBe(11);
      expect(result?.branchCount).toBeGreaterThan(0);
      expect(result?.dimensionBreakdown).toBeDefined();
      expect(typeof result?.averageWeight).toBe('string');
      expect(typeof result?.totalWeightedScore).toBe('string');
    });

    it("should support optional branchManager filter", async () => {
      const ctx = createAdminContext();
      const caller = kpiTargetCardsRouter.createCaller(ctx);

      const result = await caller.getStatistics({
        period: "2026/3",
        branchManager: "BÜLENT AYDOĞAN",
      });

      expect(result).toBeDefined();
      expect(result?.totalTargets).toBe(11);
    });
  });

  describe("bulkInsert", () => {
    it("should reject non-admin users", async () => {
      const user: AuthenticatedUser = {
        id: 2,
        openId: "user",
        email: "user@example.com",
        name: "Regular User",
        loginMethod: "local",
        role: "user",
        username: "user",
        branchId: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx: TrpcContext = {
        user,
        req: {
          protocol: "https",
          headers: {},
        } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };

      const caller = kpiTargetCardsRouter.createCaller(ctx);

      try {
        await caller.bulkInsert([
          {
            period: "2026/3",
            branchName: "Test Branch",
            branchManager: "Test Manager",
            dimension: "Finans",
            target: "Test Target",
          },
        ]);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("yönetici");
      }
    });
  });

  describe("deleteByPeriodAndBranch", () => {
    it("should reject non-admin users", async () => {
      const user: AuthenticatedUser = {
        id: 2,
        openId: "user",
        email: "user@example.com",
        name: "Regular User",
        loginMethod: "local",
        role: "user",
        username: "user",
        branchId: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx: TrpcContext = {
        user,
        req: {
          protocol: "https",
          headers: {},
        } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };

      const caller = kpiTargetCardsRouter.createCaller(ctx);

      try {
        await caller.deleteByPeriodAndBranch({
          period: "2026/3",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("yönetici");
      }
    });
  });
});
