import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { 
  fieldInspections, 
  fieldInspectionAnswers, 
  fieldInspectionCategories, 
  fieldInspectionQuestions,
  branches,
  inspectionActions,
  users,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Inspection Dashboard - Aksiyon Planları", () => {
  let db: any;
  let testBranchId: number;
  let testUserId: number;
  let testInspectionId: number;
  let testActionId: number;

  beforeAll(async () => {
    db = await getDb();

    // Test şubesi oluştur
    const branchResult = await db
      .insert(branches)
      .values({
        name: "Test Şubesi",
        code: "TEST001",
        region: "Test Bölge",
        status: "active",
      });
    testBranchId = branchResult[0];

    // Test kullanıcısı oluştur
    const userResult = await db
      .insert(users)
      .values({
        username: "testuser",
        passwordHash: "hash",
        name: "Test User",
        email: "test@example.com",
        role: "admin",
        branchId: testBranchId,
        loginMethod: "local",
      });
    testUserId = userResult[0];

    // Test kategorisi oluştur
    const categoryResult = await db
      .insert(fieldInspectionCategories)
      .values({
        name: "Test Kategorisi",
        weight: 1,
        order: 1,
      });
    const categoryId = categoryResult[0];

    // Test sorusu oluştur
    const questionResult = await db
      .insert(fieldInspectionQuestions)
      .values({
        categoryId: categoryId,
        questionText: "Test Sorusu",
        points: 10,
        maxScore: 10,
        isCritical: false,
        order: 1,
      });
    const questionId = questionResult[0];

    // Test denetimi oluştur
    const inspectionResult = await db
      .insert(fieldInspections)
      .values({
        branchId: testBranchId,
        inspectorId: testUserId,
        inspectionDate: new Date(),
        totalScore: 80,
        status: "completed",
      });
    testInspectionId = inspectionResult[0];

    // Test cevabı oluştur
    const answerResult = await db
      .insert(fieldInspectionAnswers)
      .values({
        inspectionId: testInspectionId,
        questionId: questionId,
        answer: "E",
        earnedPoints: 10,
        isCritical: false,
      });
    const answerId = answerResult[0];

    // Test aksiyonu oluştur
    const actionResult = await db
      .insert(inspectionActions)
      .values({
        inspectionId: testInspectionId,
        answerId: answerId,
        questionId: questionId,
        questionText: "Test Sorusu",
        branchId: testBranchId,
        branchName: "Test Şubesi",
        actionDescription: "Test Aksiyon Açıklaması",
        actionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 gün sonra
        assignedToName: "Test Sorumlu",
        priority: "Orta",
        status: "Açık",
      });
    testActionId = actionResult[0];
  });

  afterAll(async () => {
    // Temizle
    await db.delete(inspectionActions).where(eq(inspectionActions.id, testActionId));
    await db.delete(fieldInspectionAnswers).where(eq(fieldInspectionAnswers.inspectionId, testInspectionId));
    await db.delete(fieldInspections).where(eq(fieldInspections.id, testInspectionId));
    await db.delete(fieldInspectionQuestions);
    await db.delete(fieldInspectionCategories);
    await db.delete(users).where(eq(users.id, testUserId));
    await db.delete(branches).where(eq(branches.id, testBranchId));
  });

  it("Tüm aksiyonları getir", async () => {
    const actions = await db
      .select()
      .from(inspectionActions)
      .where(eq(inspectionActions.branchId, testBranchId));

    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0].actionDescription).toBe("Test Aksiyon Açıklaması");
  });

  it("Aksiyonları durum filtresine göre getir", async () => {
    const openActions = await db
      .select()
      .from(inspectionActions)
      .where(eq(inspectionActions.status, "Açık"));

    expect(openActions.length).toBeGreaterThan(0);
    expect(openActions[0].status).toBe("Açık");
  });

  it("Aksiyonu güncelle - Durum değiştir", async () => {
    await db
      .update(inspectionActions)
      .set({ status: "Devam Ediyor" })
      .where(eq(inspectionActions.id, testActionId));

    const updatedAction = await db
      .select()
      .from(inspectionActions)
      .where(eq(inspectionActions.id, testActionId));

    expect(updatedAction[0].status).toBe("Devam Ediyor");
  });

  it("Aksiyonu tamamla - completedAt ve completedBy ayarla", async () => {
    const now = new Date();
    await db
      .update(inspectionActions)
      .set({
        status: "Tamamlandı",
        completedAt: now,
        completedBy: testUserId,
      })
      .where(eq(inspectionActions.id, testActionId));

    const completedAction = await db
      .select()
      .from(inspectionActions)
      .where(eq(inspectionActions.id, testActionId));

    expect(completedAction[0].status).toBe("Tamamlandı");
    expect(completedAction[0].completedBy).toBe(testUserId);
  });

  it("Aksiyonları son tarih sırasına göre sırala", async () => {
    const sortedActions = await db
      .select()
      .from(inspectionActions)
      .where(eq(inspectionActions.branchId, testBranchId))
      .orderBy(inspectionActions.actionDeadline);

    expect(sortedActions.length).toBeGreaterThan(0);
    // İlk aksiyon en yakın son tarihli olmalı
    if (sortedActions.length > 1) {
      const firstDeadline = new Date(sortedActions[0].actionDeadline).getTime();
      const secondDeadline = new Date(sortedActions[1].actionDeadline).getTime();
      expect(firstDeadline).toBeLessThanOrEqual(secondDeadline);
    }
  });

  it("Aksiyon istatistiklerini hesapla", async () => {
    const actions = await db
      .select()
      .from(inspectionActions)
      .where(eq(inspectionActions.branchId, testBranchId));

    const stats = {
      total: actions.length,
      open: actions.filter((a: any) => a.status === "Açık").length,
      inProgress: actions.filter((a: any) => a.status === "Devam Ediyor").length,
      completed: actions.filter((a: any) => a.status === "Tamamlandı").length,
    };

    expect(stats.total).toBeGreaterThan(0);
    expect(stats.open + stats.inProgress + stats.completed).toBeLessThanOrEqual(stats.total);
  });

  it("Aksiyonları arama kriterine göre filtrele", async () => {
    const searchText = "Test";
    const actions = await db
      .select()
      .from(inspectionActions)
      .where(eq(inspectionActions.branchId, testBranchId));

    const filtered = actions.filter(
      (action: any) =>
        action.questionText.toLowerCase().includes(searchText.toLowerCase()) ||
        action.actionDescription.toLowerCase().includes(searchText.toLowerCase())
    );

    expect(filtered.length).toBeGreaterThan(0);
  });
});
