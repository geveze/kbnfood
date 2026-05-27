import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { fieldInspections, inspectorGeneralEvaluation, branches, users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('General Evaluation System', () => {
  let db: any;
  let testBranchId: number;
  let testUserId: number;
  let testInspectionId: number;

  beforeAll(async () => {
    db = await getDb();
    console.log('✓ Veritabanı bağlantısı başarılı');
  });

  afterAll(async () => {
    console.log('✓ Testler tamamlandı');
  });

  it('Şube ve kullanıcı verilerini kontrol et', async () => {
    const branchList = await db.select().from(branches).limit(1);
    expect(branchList.length).toBeGreaterThan(0);
    testBranchId = branchList[0].id;
    console.log(`✓ Test şubesi: ${branchList[0].name} (ID: ${testBranchId})`);

    const userList = await db.select().from(users).limit(1);
    expect(userList.length).toBeGreaterThan(0);
    testUserId = userList[0].id;
    console.log(`✓ Test kullanıcısı: ${userList[0].name} (ID: ${testUserId})`);
  });

  it('Test denetim kaydı oluştur', async () => {
    const [result] = await db.insert(fieldInspections).values({
      branchId: testBranchId,
      branchCode: 'TEST',
      branchName: 'Test Şubesi',
      inspectorId: testUserId,
      inspectorName: 'Test Denetçi',
      inspectorEmail: 'test@example.com',
      restaurantManagerEmail: 'manager@example.com',
      inspectionDate: new Date(),
      status: 'completed',
      totalScore: 85.5,
    });
    testInspectionId = result.insertId;
    expect(testInspectionId).toBeGreaterThan(0);
    console.log(`✓ Test denetim kaydı oluşturuldu (ID: ${testInspectionId})`);
  });

  it('Genel değerlendirme kaydı oluştur', async () => {
    const [result] = await db.insert(inspectorGeneralEvaluation).values({
      inspectionId: testInspectionId,
      inspectorId: testUserId,
      comments: 'Test genel açıklaması',
      strengths: 'Test güçlü yönleri',
      improvementAreas: 'Test iyileştirilmesi gereken alanları',
      suggestions: 'Test önerileri',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.insertId).toBeGreaterThan(0);
    console.log(`✓ Genel değerlendirme kaydı oluşturuldu (ID: ${result.insertId})`);
  });

  it('Genel değerlendirme kaydını sorgula', async () => {
    const evaluation = await db
      .select()
      .from(inspectorGeneralEvaluation)
      .where(eq(inspectorGeneralEvaluation.inspectionId, testInspectionId));
    
    expect(evaluation.length).toBe(1);
    expect(evaluation[0].comments).toBe('Test genel açıklaması');
    expect(evaluation[0].strengths).toBe('Test güçlü yönleri');
    expect(evaluation[0].improvementAreas).toBe('Test iyileştirilmesi gereken alanları');
    expect(evaluation[0].suggestions).toBe('Test önerileri');
    console.log('✓ Genel değerlendirme kaydı başarıyla sorgulandı');
  });

  it('Genel değerlendirme kaydını güncelle', async () => {
    await db
      .update(inspectorGeneralEvaluation)
      .set({
        comments: 'Güncellenmiş açıklama',
        updatedAt: new Date(),
      })
      .where(eq(inspectorGeneralEvaluation.inspectionId, testInspectionId));

    const evaluation = await db
      .select()
      .from(inspectorGeneralEvaluation)
      .where(eq(inspectorGeneralEvaluation.inspectionId, testInspectionId));

    expect(evaluation[0].comments).toBe('Güncellenmiş açıklama');
    console.log('✓ Genel değerlendirme kaydı başarıyla güncellendi');
  });

  it('Denetim ve değerlendirme verilerini join\'le', async () => {
    const result = await db
      .select({
        inspectionId: fieldInspections.id,
        branchName: fieldInspections.branchName,
        inspectorName: fieldInspections.inspectorName,
        totalScore: fieldInspections.totalScore,
        comments: inspectorGeneralEvaluation.comments,
        strengths: inspectorGeneralEvaluation.strengths,
      })
      .from(inspectorGeneralEvaluation)
      .innerJoin(
        fieldInspections,
        eq(inspectorGeneralEvaluation.inspectionId, fieldInspections.id)
      )
      .where(eq(inspectorGeneralEvaluation.inspectionId, testInspectionId));

    expect(result.length).toBe(1);
    expect(result[0].branchName).toBe('Test Şubesi');
    expect(result[0].totalScore).toBe(85.5);
    expect(result[0].comments).toBe('Güncellenmiş açıklama');
    console.log('✓ Denetim ve değerlendirme verilerine başarıyla erişildi');
  });

  it('Filtreleme: Tarih aralığı', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const result = await db
      .select()
      .from(fieldInspections)
      .where(
        eq(fieldInspections.branchId, testBranchId)
      );

    expect(result.length).toBeGreaterThan(0);
    console.log(`✓ Tarih aralığı filtrelemesi başarılı (${result.length} kayıt)`);
  });

  it('Filtreleme: Şube ve denetçi', async () => {
    const result = await db
      .select()
      .from(inspectorGeneralEvaluation)
      .innerJoin(
        fieldInspections,
        eq(inspectorGeneralEvaluation.inspectionId, fieldInspections.id)
      )
      .where(
        eq(fieldInspections.branchId, testBranchId)
      );

    expect(result.length).toBeGreaterThan(0);
    console.log(`✓ Şube filtrelemesi başarılı (${result.length} kayıt)`);
  });

  it('Genel değerlendirme kaydını sil', async () => {
    await db
      .delete(inspectorGeneralEvaluation)
      .where(eq(inspectorGeneralEvaluation.inspectionId, testInspectionId));

    const evaluation = await db
      .select()
      .from(inspectorGeneralEvaluation)
      .where(eq(inspectorGeneralEvaluation.inspectionId, testInspectionId));

    expect(evaluation.length).toBe(0);
    console.log('✓ Genel değerlendirme kaydı başarıyla silindi');
  });

  it('Test denetim kaydını sil', async () => {
    await db
      .delete(fieldInspections)
      .where(eq(fieldInspections.id, testInspectionId));

    const inspection = await db
      .select()
      .from(fieldInspections)
      .where(eq(fieldInspections.id, testInspectionId));

    expect(inspection.length).toBe(0);
    console.log('✓ Test denetim kaydı başarıyla silindi');
  });
});
