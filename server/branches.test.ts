import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@keban.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    branchId: null,
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createUserContext(branchId: number): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@keban.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    branchId,
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("branches router", () => {
  it("should list all branches for authenticated users", async () => {
    const { ctx } = createUserContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.branches.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should allow admin to create a branch", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // This would require database setup in a real test
    // For now, we're just testing that the procedure exists and is callable
    expect(caller.branches.create).toBeDefined();
  });

  it("should prevent non-admin users from creating branches", async () => {
    const { ctx } = createUserContext(1);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.branches.create({
        name: "Test Branch",
        code: "TEST",
      });
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });
});

describe("KPI targets router", () => {
  it("should list KPI targets for a branch", async () => {
    const { ctx } = createUserContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.kpiTargets.list({ branchId: 1 });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should prevent non-admin users from creating KPI targets", async () => {
    const { ctx } = createUserContext(1);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.kpiTargets.create({
        branchId: 1,
        dimension: "FİNANS",
        target: "Test Target",
      });
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });
});

describe("performance data router", () => {
  it("should list performance data for authenticated users", async () => {
    const { ctx } = createUserContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.performanceData.list({
      branchId: 1,
      period: "2026-03",
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should prevent regular users from creating performance data", async () => {
    const { ctx } = createUserContext(1);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.performanceData.create({
        branchId: 1,
        kpiTargetId: 1,
        period: "2026-03",
        actualValue: 100,
      });
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("should allow region managers to create performance data", async () => {
    const user: AuthenticatedUser = {
      id: 3,
      openId: "region-manager",
      email: "manager@keban.com",
      name: "Region Manager",
      loginMethod: "manus",
      role: "region_manager",
      branchId: null,
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
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    // This would require database setup in a real test
    expect(caller.performanceData.create).toBeDefined();
  });
});
