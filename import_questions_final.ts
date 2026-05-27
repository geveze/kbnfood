import { drizzle } from "drizzle-orm/mysql2";
import { fieldInspectionCategories, fieldInspectionQuestions } from "./drizzle/schema";
import * as fs from "fs";

const db = drizzle(process.env.DATABASE_URL!);

interface QuestionData {
  category: string;
  category_order: number;
  question_text: string;
  points: number;
  is_critical: boolean;
  penalty: number;
  description: string;
  order: number;
}

async function importQuestions() {
  try {
    console.log("[INFO] Soruları yüklemeye başlıyorum...");
    
    // JSON dosyasını oku
    const questionsData = JSON.parse(
      fs.readFileSync("/home/ubuntu/questions_data.json", "utf-8")
    ) as QuestionData[];

    console.log(`[INFO] Toplam ${questionsData.length} soru bulundu`);

    // Kategorileri grupla
    const categoriesMap = new Map<string, QuestionData[]>();
    for (const q of questionsData) {
      if (!categoriesMap.has(q.category)) {
        categoriesMap.set(q.category, []);
      }
      categoriesMap.get(q.category)!.push(q);
    }

    console.log(`[INFO] Toplam ${categoriesMap.size} kategori bulundu`);

    // Kategorileri veritabanına ekle
    const categoryMap = new Map<string, number>();
    let categoryOrder = 1;

    for (const [categoryName, questions] of categoriesMap) {
      const cleanCategoryName = categoryName.trim();
      console.log(`[INFO] Kategori ekleniyor: "${cleanCategoryName}" (${questions.length} soru)`);

      try {
        // Kategoriyi ekle ve sonra ID'sini sor
        await db.insert(fieldInspectionCategories).values({
          name: cleanCategoryName,
          description: "",
          order: categoryOrder,
        });

        // Son eklenen kategoriyi bul
        const categories = await db.select().from(fieldInspectionCategories);
        const lastCategory = categories[categories.length - 1];
        
        if (lastCategory && lastCategory.id) {
          console.log(`[SUCCESS] Kategori eklendi: ID=${lastCategory.id}`);
          categoryMap.set(categoryName, lastCategory.id);
        }
      } catch (error) {
        console.error(`[ERROR] Kategori eklenirken hata: ${cleanCategoryName}`, error);
      }

      categoryOrder++;
    }

    console.log(`[INFO] ${categoryMap.size} kategori veritabanına eklendi`);

    // Soruları veritabanına ekle
    let questionCount = 0;
    for (const question of questionsData) {
      const categoryId = categoryMap.get(question.category);
      if (!categoryId) {
        console.warn(`[WARN] Kategori bulunamadı: "${question.category}"`);
        continue;
      }

      try {
        await db.insert(fieldInspectionQuestions).values({
          categoryId,
          questionText: question.question_text,
          points: question.points,
          maxScore: 5,
          isCritical: question.is_critical,
          order: question.order,
        });

        questionCount++;
        if (questionCount % 10 === 0) {
          console.log(`[INFO] ${questionCount} soru eklendi...`);
        }
      } catch (error) {
        console.error(`[ERROR] Soru eklenirken hata:`, error);
      }
    }

    console.log(`[SUCCESS] Toplam ${questionCount} soru veritabanına eklendi!`);
    console.log("[INFO] İşlem tamamlandı");
    process.exit(0);
  } catch (error) {
    console.error("[ERROR] Hata:", error);
    process.exit(1);
  }
}

importQuestions();
