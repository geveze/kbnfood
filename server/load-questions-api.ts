import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import * as XLSX from "xlsx";
import * as fs from "fs";
import { z } from "zod";
import { fieldInspectionCategories, fieldInspectionQuestions } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

export const loadQuestionsRouter = router({
  loadFromExcel: protectedProcedure.mutation(async ({ ctx }: { ctx: any }) => {
    // Only allow admin users
    if (ctx.user?.role !== "admin") {
      throw new Error("Only admins can load questions");
    }

    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Read Excel file
    const excelPath = "/home/ubuntu/upload/Sorulistesi.xlsx";
    if (!fs.existsSync(excelPath)) {
      throw new Error("Excel file not found at " + excelPath);
    }

    const workbook = XLSX.readFile(excelPath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log(`[loadFromExcel] Total rows in Excel: ${data.length}`);

    // Skip header row
    const questions = data.slice(1);

    // Get all categories from field_inspection_categories
    const categories = await db
      .select()
      .from(fieldInspectionCategories);

    console.log(`[loadFromExcel] Found ${categories.length} categories`);

    // Create a map of category names to IDs
    const categoryMap: Record<string, number> = {};
    categories.forEach((cat) => {
      const normalizedName = cat.name.trim().toUpperCase();
      categoryMap[normalizedName] = cat.id;
    });

    console.log("[loadFromExcel] Category mapping:", categoryMap);

    let insertedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < questions.length; i++) {
      const row = questions[i] as any[];
      const [categoryName, points, questionText, answer, formula, description, criticalPenalty] = row;

      if (!categoryName || !questionText) {
        skippedCount++;
        continue;
      }

      // Normalize category name
      const normalizedCategoryName = categoryName.trim().toUpperCase();
      const categoryId = categoryMap[normalizedCategoryName];

      if (!categoryId) {
        errors.push(`Row ${i + 2}: Category not found "${categoryName}"`);
        skippedCount++;
        continue;
      }

      const cleanPoints = parseInt(points) || 0;
      const isCritical = criticalPenalty ? 1 : 0;
      const cleanQuestionText = questionText.trim();

      try {
        await db.insert(fieldInspectionQuestions).values({
          categoryId,
          questionText: cleanQuestionText,
          points: cleanPoints,
          maxScore: 5,
          isCritical: isCritical === 1,
          order: i + 1,
        });
        insertedCount++;
      } catch (err: any) {
        errors.push(`Row ${i + 2}: ${err.message}`);
        skippedCount++;
      }
    }

    // Verify insertion - get question counts per category
    const result = await db
      .select({
        name: fieldInspectionCategories.name,
        question_count: sql`COUNT(${fieldInspectionQuestions.id})`,
      })
      .from(fieldInspectionCategories)
      .leftJoin(
        fieldInspectionQuestions,
        eq(fieldInspectionCategories.id, fieldInspectionQuestions.categoryId)
      )
      .groupBy(fieldInspectionCategories.id, fieldInspectionCategories.name)
      .orderBy(fieldInspectionCategories.id);

    return {
      success: true,
      insertedCount,
      skippedCount,
      errors: errors.slice(0, 10), // Return first 10 errors
      verification: result,
    };
  }),
});
