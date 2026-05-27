import { getDb } from "./db";
import { positionCategories, positionQuestions } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Tüm pozisyonları getir (Raw SQL - column name compatibility)
 */
export async function getPositionsRaw() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.execute(
      sql`SELECT id, name, display_name as displayName, description, is_active as isActive, createdAt, updatedAt FROM positions WHERE is_active = 1`
    );
    console.log('[getPositionsRaw] Raw result type:', typeof result, Array.isArray(result));
    console.log('[getPositionsRaw] Result keys:', Object.keys(result || {}));
    console.log('[getPositionsRaw] Result[0] length:', (result as any)?.[0]?.length);
    console.log('[getPositionsRaw] First row:', JSON.stringify((result as any)?.[0]?.[0]));
    const rows = (result as any)[0] || [];
    return rows;
  } catch (error) {
    console.error("[Database] Error fetching positions:", error);
    return [];
  }
}

/**
 * Belirli bir pozisyonun kategorilerini getir (Drizzle ORM)
 */
export async function getPositionCategoriesRaw(positionId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(positionCategories)
      .where(eq(positionCategories.positionId, positionId))
      .orderBy(positionCategories.id);
    return result || [];
  } catch (error) {
    console.error("[Database] Error fetching categories:", error);
    return [];
  }
}

/**
 * Belirli bir kategorinin sorularını getir (Drizzle ORM)
 */
export async function getPositionQuestionsRaw(categoryId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(positionQuestions)
      .where(eq(positionQuestions.categoryId, categoryId))
      .orderBy(positionQuestions.id);
    return result || [];
  } catch (error) {
    console.error("[Database] Error fetching questions:", error);
    return [];
  }
}

/**
 * Pozisyon ile kategorileri ve soruları getir (Drizzle ORM)
 */
export async function getPositionWithCategoriesAndQuestionsRaw(
  positionId: number
) {
  const db = await getDb();
  if (!db) {
    console.error('[position-helpers] Database connection failed');
    return null;
  }

  try {
    console.log('[position-helpers] Fetching categories for positionId:', positionId);
    // Kategorileri getir
    const categories = await db
      .select()
      .from(positionCategories)
      .where(eq(positionCategories.positionId, positionId))
      .orderBy(positionCategories.id);

    console.log('[position-helpers] Categories found:', categories?.length || 0);
    if (!categories || categories.length === 0) {
      console.log('[position-helpers] No categories found for positionId:', positionId);
      return null;
    }

    // Her kategori için soruları getir
    const categoriesWithQuestions = await Promise.all(
      categories.map(async (category) => {
        const questions = await db
          .select()
          .from(positionQuestions)
          .where(eq(positionQuestions.categoryId, category.id))
          .orderBy(positionQuestions.id);
        return {
          ...category,
          questions,
        };
      })
    );

    return {
      positionId,
      categories: categoriesWithQuestions,
    };
  } catch (error) {
    console.error("[Database] Error fetching position with details:", error);
    return null;
  }
}
