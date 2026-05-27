import { getDb } from "./db";
import { probationEvaluations } from "../drizzle/schema";
import { eq, and, isNull, gte, lte, sql } from "drizzle-orm";
import { sendProbationReminderEmail } from "./probation-mail-template";

/**
 * Cron job: Her gün çalışacak ve 45. gün, 165. gün ve 180. günde mail gönderilmesi gereken personelleri kontrol edecek
 */
export async function checkAndSendProbationEmails() {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    
    const today = new Date();

    // Tüm değerlendirmeleri al ve gün farkını hesapla
    const allEvaluations = await db
      .select({
        id: probationEvaluations.id,
        employeeName: probationEvaluations.employeeName,
        employeeTCNumber: probationEvaluations.employeeTCNumber,
        branchName: probationEvaluations.branchName,
        hireDate: probationEvaluations.hireDate,
        evaluationPeriod: probationEvaluations.evaluationPeriod,
        createdAt: probationEvaluations.createdAt,
      })
      .from(probationEvaluations);

    for (const evaluation of allEvaluations) {
      if (!evaluation.hireDate) continue;
      
      const hireDateObj = new Date(evaluation.hireDate);
      const daysSinceHire = Math.floor(
        (today.getTime() - hireDateObj.getTime()) / (1000 * 60 * 60 * 24)
      );

      // 45. gün (1,5 ay) maili gönder
      if (daysSinceHire >= 45 && evaluation.evaluationPeriod === "1.5_months") {
        await sendProbationReminderEmail(evaluation as any, "45days");
      }

      // 165. gün (5,5 ay) maili gönder
      if (daysSinceHire >= 165 && evaluation.evaluationPeriod === "5.5_months") {
        await sendProbationReminderEmail(evaluation as any, "165days");
      }

      // 180. gün (deneme süresi sonu) maili gönder
      if (daysSinceHire >= 180) {
        await sendProbationReminderEmail(evaluation as any, "180days");
      }
    }

    console.log(`[Probation Mail] Cron job çalıştırıldı - ${allEvaluations.length} personel kontrol edildi`);
  } catch (error) {
    console.error("[Probation Mail] Hata:", error);
  }
}

/**
 * Hatırlatma: Değerlendirme formu 5 gün içinde gelmemişse hatırlatma maili gönder
 */
export async function checkAndSendReminderEmails() {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    // 45. gün maili gönderilen ama değerlendirme formu gelmemiş personeller
    const day45Reminders = await db
      .select()
      .from(probationEvaluations)
      .where(
        and(
          eq(probationEvaluations.evaluationPeriod, "1.5_months"),
          probationEvaluations.createdAt ? lte(probationEvaluations.createdAt, fiveDaysAgo) : undefined
        )
      );

    // 165. gün maili gönderilen ama değerlendirme formu gelmemiş personeller
    const day165Reminders = await db
      .select()
      .from(probationEvaluations)
      .where(
        and(
          eq(probationEvaluations.evaluationPeriod, "5.5_months"),
          probationEvaluations.createdAt ? lte(probationEvaluations.createdAt, fiveDaysAgo) : undefined
        )
      );

    // Hatırlatma maili gönder
    for (const employee of day45Reminders) {
      if (employee.hireDate) {
        await sendProbationReminderEmail(employee as any, "45days-reminder");
      }
    }

    for (const employee of day165Reminders) {
      if (employee.hireDate) {
        await sendProbationReminderEmail(employee as any, "165days-reminder");
      }
    }

    console.log(
      `[Probation Reminder] Gönderilen hatırlatmalar - 45 gün: ${day45Reminders.length}, 165 gün: ${day165Reminders.length}`
    );
  } catch (error) {
    console.error("[Probation Reminder] Hata:", error);
  }
}
