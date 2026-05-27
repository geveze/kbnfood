import { getDb } from "./db";
import { probationEvaluations, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

/**
 * Deneme süresi değerlendirme hatırlatıcı bildirimlerini gönder
 * 45. gün (1.5 ay) ve 165. gün (5.5 ay) için
 */
export async function sendProbationReminders() {
  try {
    console.log("[Probation Notifications] Starting reminder check...");

    const db = await getDb();
    if (!db) {
      console.error("[Probation Notifications] Database connection failed");
      return;
    }

    // Tüm çalışanları getir
    const allUsers = await db.select().from(users);

    for (const employee of allUsers) {
      if (!employee.hireDate) continue;

      const hireDate = typeof employee.hireDate === "string" ? new Date(employee.hireDate) : employee.hireDate;
      const today = new Date();
      const daysSinceHire = Math.floor((today.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24));

      // 45. gün hatırlatıcısı (1.5 ay değerlendirmesi)
      if (daysSinceHire === 45) {
        const existing15 = await db
          .select()
          .from(probationEvaluations)
          .where(
            and(
              eq(probationEvaluations.employeeTCNumber, (employee as any).tcNumber || ""),
              eq(probationEvaluations.evaluationPeriod, "1.5_months")
            )
          )
          .limit(1);

        if (!existing15 || existing15.length === 0) {
          // Değerlendirme yapılmamış, hatırlatıcı gönder
          await notifyOwner({
            title: "Deneme Süresi Değerlendirmesi Gerekli - 1.5 Ay",
            content: `${employee.name} (TC: ${(employee as any).tcNumber}) için 1.5 ay deneme süresi değerlendirmesi yapılması gerekmektedir. İşe giriş tarihi: ${employee.hireDate}. Lütfen değerlendirmeyi tamamlayınız.`,
          });

          console.log(`[Probation Notifications] 45-day reminder sent for ${employee.name}`);
        }
      }

      // 165. gün hatırlatıcısı (5.5 ay değerlendirmesi)
      if (daysSinceHire === 165) {
        const existing55 = await db
          .select()
          .from(probationEvaluations)
          .where(
            and(
              eq(probationEvaluations.employeeTCNumber, (employee as any).tcNumber || ""),
              eq(probationEvaluations.evaluationPeriod, "5.5_months")
            )
          )
          .limit(1);

        if (!existing55 || existing55.length === 0) {
          // Değerlendirme yapılmamış, hatırlatıcı gönder
          await notifyOwner({
            title: "Deneme Süresi Değerlendirmesi Gerekli - 5.5 Ay",
            content: `${employee.name} (TC: ${(employee as any).tcNumber}) için 5.5 ay deneme süresi değerlendirmesi yapılması gerekmektedir. İşe giriş tarihi: ${employee.hireDate}. Lütfen değerlendirmeyi tamamlayınız.`,
          });

          console.log(`[Probation Notifications] 165-day reminder sent for ${employee.name}`);
        }
      }

      // Deneme süresi sonrası (180 gün) ve değerlendirme yapılmamış ise uyarı
      if (daysSinceHire === 180) {
        const existing55 = await db
          .select()
          .from(probationEvaluations)
          .where(
            and(
              eq(probationEvaluations.employeeTCNumber, (employee as any).tcNumber || ""),
              eq(probationEvaluations.evaluationPeriod, "5.5_months")
            )
          )
          .limit(1);

        if (!existing55 || existing55.length === 0) {
          // Deneme süresi bitti ama değerlendirme yapılmamış
          await notifyOwner({
            title: "UYARI: Deneme Süresi Sona Erdi - Değerlendirme Yapılmamış",
            content: `${employee.name} (TC: ${(employee as any).tcNumber}) için deneme süresi (6 ay) sona ermiş ancak 5.5 ay değerlendirmesi yapılmamıştır. Lütfen acil olarak değerlendirmeyi tamamlayınız. İşe giriş tarihi: ${employee.hireDate}`,
          });

          console.log(`[Probation Notifications] URGENT: 180-day warning sent for ${employee.name}`);
        }
      }
    }

    console.log("[Probation Notifications] Reminder check completed");
  } catch (error) {
    console.error("[Probation Notifications] Error:", error);
  }
}

/**
 * Değerlendirme yapılmamış çalışanları kontrol et ve yöneticilere bildir
 */
export async function checkPendingEvaluations() {
  try {
    console.log("[Probation Notifications] Checking pending evaluations...");

    const db = await getDb();
    if (!db) {
      console.error("[Probation Notifications] Database connection failed");
      return;
    }

    // 45-165 gün arasında olan çalışanları bul
    const allUsers = await db.select().from(users);

    for (const employee of allUsers) {
      if (!employee.hireDate) continue;

      const hireDate = typeof employee.hireDate === "string" ? new Date(employee.hireDate) : employee.hireDate;
      const today = new Date();
      const daysSinceHire = Math.floor((today.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24));

      // 45-50 gün arasında ve 1.5 ay değerlendirmesi yapılmamış
      if (daysSinceHire >= 45 && daysSinceHire <= 50) {
        const existing15 = await db
          .select()
          .from(probationEvaluations)
          .where(
            and(
              eq(probationEvaluations.employeeTCNumber, (employee as any).tcNumber || ""),
              eq(probationEvaluations.evaluationPeriod, "1.5_months")
            )
          )
          .limit(1);

        if (!existing15 || existing15.length === 0) {
          console.log(`[Probation Notifications] Pending 1.5-month evaluation for ${employee.name}`);
        }
      }

      // 165-170 gün arasında ve 5.5 ay değerlendirmesi yapılmamış
      if (daysSinceHire >= 165 && daysSinceHire <= 170) {
        const existing55 = await db
          .select()
          .from(probationEvaluations)
          .where(
            and(
              eq(probationEvaluations.employeeTCNumber, (employee as any).tcNumber || ""),
              eq(probationEvaluations.evaluationPeriod, "5.5_months")
            )
          )
          .limit(1);

        if (!existing55 || existing55.length === 0) {
          console.log(`[Probation Notifications] Pending 5.5-month evaluation for ${employee.name}`);
        }
      }
    }

    console.log("[Probation Notifications] Pending evaluations check completed");
  } catch (error) {
    console.error("[Probation Notifications] Error:", error);
  }
}
