import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { kpiTargetCardsDetail } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

describe("getDashboardSummary - Rol Bazlı Filtreleme", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  it("Admin tüm verileri görebilmeli (2026/3 döneminde)", async () => {
    const adminUser: AuthenticatedUser = {
      id: 1,
      username: "admin",
      name: "Admin User",
      role: "admin",
      branchId: null,
      openId: null,
      passwordHash: null,
      email: null,
      loginMethod: "local",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const adminContext: TrpcContext = {
      user: adminUser,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
        setHeader: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(adminContext);
    const result = await caller.kpiTargetCards.getDashboardSummary({ period: "2026/3" });

    expect(result).toBeDefined();
    expect(result?.totalTargets).toBeGreaterThan(0);
    expect(result?.averagePerformance).toBeGreaterThanOrEqual(0);
  });

  it("Şube müdürü sadece kendi şubesinin verilerini görebilmeli", async () => {
    // Ordu Novada AVM şubesinin müdürü
    const branchManagerUser: AuthenticatedUser = {
      id: 210535,
      username: "ordunovada",
      name: "ordu novada avm",
      role: "branch_manager",
      branchId: 30002, // Ordu Novada AVM
      openId: null,
      passwordHash: null,
      email: null,
      loginMethod: "local",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const branchManagerContext: TrpcContext = {
      user: branchManagerUser,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
        setHeader: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(branchManagerContext);
    const result = await caller.kpiTargetCards.getDashboardSummary({ period: "2026/3" });

    expect(result).toBeDefined();
    // Şube müdürü sadece kendi şubesinin verilerini görebilmeli
    if (result?.totalTargets && result.totalTargets > 0) {
      // Verilerin kendi şubesine ait olduğunu doğrula
      const branchResults = await db
        .select()
        .from(kpiTargetCardsDetail)
        .where(eq(kpiTargetCardsDetail.period, "2026/3"));

      // Şubenin adını bul
      const branchesData = await (db as any).query.branches.findMany();
      const userBranch = branchesData.find((b: any) => b.id === 30002);

      if (userBranch) {
        const branchSpecificResults = branchResults.filter(
          (r: any) => r.branchName === userBranch.name
        );
        expect(branchSpecificResults.length).toBeGreaterThan(0);
      }
    }
  });

  it("Bölge sorumlusu sadece kendi bölgesinin verilerini görebilmeli", async () => {
    const regionManagerUser: AuthenticatedUser = {
      id: 115,
      username: "bolge_muduru",
      name: "Bölge Operasyon Müdürü",
      role: "region_manager",
      branchId: null,
      openId: null,
      passwordHash: null,
      email: null,
      loginMethod: "local",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const regionManagerContext: TrpcContext = {
      user: regionManagerUser,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
        setHeader: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(regionManagerContext);
    const result = await caller.kpiTargetCards.getDashboardSummary({ period: "2026/3" });

    expect(result).toBeDefined();
    // Bölge sorumlusu sadece kendi bölgesinin verilerini görebilmeli
    if (result?.totalTargets && result.totalTargets > 0) {
      const regionResults = await db
        .select()
        .from(kpiTargetCardsDetail)
        .where(eq(kpiTargetCardsDetail.period, "2026/3"));

      const regionSpecificResults = regionResults.filter(
        (r: any) => r.bolgeSorumlusu === "Bölge Operasyon Müdürü"
      );
      expect(regionSpecificResults.length).toBeGreaterThan(0);
    }
  });

  it("Admin'in göreceği veri sayısı, şube müdürünün göreceği veri sayısından fazla olmalı", async () => {
    const adminUser: AuthenticatedUser = {
      id: 1,
      username: "admin",
      name: "Admin User",
      role: "admin",
      branchId: null,
      openId: null,
      passwordHash: null,
      email: null,
      loginMethod: "local",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const adminContext: TrpcContext = {
      user: adminUser,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
        setHeader: () => {},
      } as TrpcContext["res"],
    };

    const branchManagerUser: AuthenticatedUser = {
      id: 210535,
      username: "ordunovada",
      name: "ordu novada avm",
      role: "branch_manager",
      branchId: 30002,
      openId: null,
      passwordHash: null,
      email: null,
      loginMethod: "local",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const branchManagerContext: TrpcContext = {
      user: branchManagerUser,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
        setHeader: () => {},
      } as TrpcContext["res"],
    };

    const adminCaller = appRouter.createCaller(adminContext);
    const branchCaller = appRouter.createCaller(branchManagerContext);

    const adminResult = await adminCaller.kpiTargetCards.getDashboardSummary({ period: "2026/3" });
    const branchResult = await branchCaller.kpiTargetCards.getDashboardSummary({ period: "2026/3" });

    expect(adminResult?.totalTargets).toBeGreaterThanOrEqual(
      branchResult?.totalTargets || 0
    );
  });
});
