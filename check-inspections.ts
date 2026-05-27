import { getDb } from "./server/db";
import { fieldInspections, fieldInspectionAnswers, inspectionActions } from "./drizzle/schema";
import { desc } from "drizzle-orm";

async function checkInspections() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("❌ Veritabanı bağlantısı başarısız");
      process.exit(1);
    }

    // Check field_inspections count
    const allInspections = await db.select().from(fieldInspections);
    
    // Check field_inspection_answers count
    const allAnswers = await db.select().from(fieldInspectionAnswers);
    
    // Check inspection_actions count
    const allActions = await db.select().from(inspectionActions);
    
    // Get recent inspections
    const recentInspections = await db
      .select()
      .from(fieldInspections)
      .orderBy(desc(fieldInspections.inspectionDate))
      .limit(5);

    console.log('=== Saha Denetim Verileri ===');
    console.log(`✅ Toplam Denetim: ${allInspections.length}`);
    console.log(`✅ Toplam Cevap: ${allAnswers.length}`);
    console.log(`✅ Toplam Aksiyon Planı: ${allActions.length}`);
    console.log('\n=== Son 5 Denetim ===');
    recentInspections.forEach((inspection, index) => {
      console.log(`${index + 1}. ID: ${inspection.id}, Şube: ${inspection.branchName}, Tarih: ${inspection.inspectionDate}, Puan: ${inspection.totalScore}, Durum: ${inspection.status}`);
    });

    if (allInspections.length > 0) {
      console.log('\n✅ Saha denetim verileri başarıyla veritabanına kaydedilmiştir!');
    } else {
      console.log('\n⚠️  Henüz saha denetimi kaydı bulunmamaktadır.');
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Hata:", error);
    process.exit(1);
  }
}

checkInspections();
