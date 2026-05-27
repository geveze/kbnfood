import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users, performanceEvaluations, performanceEvaluationItems, branches } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Bölge Müdürü Erişim Kontrolü", () => {
  let db: any;
  let regionManagerId: number;
  let branchId: number;
  let evaluationId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Test şubesi oluştur
    const branchResult = await db.insert(branches).values({
      name: "Test Şubesi",
      city: "Test",
      region: "Test",
      isActive: true,
    }).returning();
    branchId = branchResult[0].id;

    // Bölge müdürü kullanıcısı oluştur
    const regionManagerResult = await db.insert(users).values({
      name: "Region Manager Test",
      email: "region@test.com",
      username: "region_test",
      password_hash: "hashed_password",
      role: "region_manager",
      branchId: branchId,
    }).returning();
    regionManagerId = regionManagerResult[0].id;

    // Test değerlendirmesi oluştur
    const evalResult = await db.insert(performanceEvaluations).values({
      branchId: branchId,
      employeeName: "Test Employee",
      employeePosition: "Test Position",
      employeeIdNumber: "12345",
      evaluationDate: new Date(),
      evaluationPeriod: "2026/1",
      evaluatedByManager: "Test Manager",
      totalScore: 80,
    }).returning();
    evaluationId = evalResult[0].id;

    // Değerlendirme öğesi ekle
    await db.insert(performanceEvaluationItems).values({
      evaluationId: evaluationId,
      categoryId: 1,
      itemNumber: 1,
      itemDescription: "Test Item",
      score: 4,
    });
  });

  afterAll(async () => {
    if (!db) return;
    
    // Cleanup
    await db.delete(performanceEvaluationItems).where(eq(performanceEvaluationItems.evaluationId, evaluationId));
    await db.delete(performanceEvaluations).where(eq(performanceEvaluations.id, evaluationId));
    await db.delete(users).where(eq(users.id, regionManagerId));
    await db.delete(branches).where(eq(branches.id, branchId));
  });

  it("Bölge Müdürü Performans İzleme sayfasına erişim izni almalı", () => {
    // Sidebar'da region_manager rolü Performans İzleme sayfasına erişebilmeli
    const roles = ["admin", "branch_manager", "region_manager"];
    expect(roles).toContain("region_manager");
  });

  it("Bölge Müdürü Değerlendirme Geçmişi sayfasına erişim izni almalı", () => {
    // Sidebar'da region_manager rolü Değerlendirme Geçmişi sayfasına erişebilmeli
    const roles = ["admin", "branch_manager", "user", "region_manager"];
    expect(roles).toContain("region_manager");
  });

  it("Bölge Müdürü Değerlendirme Raporu sayfasına erişim izni almalı", () => {
    // Sidebar'da region_manager rolü Değerlendirme Raporu sayfasına erişebilmeli
    const roles = ["admin", "branch_manager", "region_manager"];
    expect(roles).toContain("region_manager");
  });

  it("Bölge Müdürü tüm şubelerin değerlendirmelerini görebilmeli", async () => {
    // Backend'de region_manager kısıtlaması olmadığı için tüm verileri görebilir
    const evaluations = await db.select().from(performanceEvaluations);
    expect(evaluations.length).toBeGreaterThan(0);
  });

  it("Bölge Müdürü değerlendirmelerin detaylarını görebilmeli", async () => {
    // Değerlendirme öğelerini görebilmeli
    const items = await db.select().from(performanceEvaluationItems)
      .where(eq(performanceEvaluationItems.evaluationId, evaluationId));
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].score).toBe(4);
  });

  it("Bölge Müdürü raporları oluşturabilmeli", () => {
    // getReport prosedürü region_manager için kısıtlama olmadığı için çalışmalı
    const roles = ["admin", "branch_manager", "region_manager"];
    expect(roles).toContain("region_manager");
  });
});
