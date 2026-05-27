import { weeklyPlans } from '../drizzle/schema';
import { eq, gte, lte, and } from 'drizzle-orm';
import { getDb } from './db';

/**
 * Haftalık planları ICS (iCalendar) formatına dönüştür
 * Outlook 365'e doğrudan yüklenebilecek format
 */
export async function generateICSFromWeeklyPlans(
  startDate: Date,
  endDate: Date,
  managerId?: string
): Promise<string> {
  // Veritabanından planları al
  const database = await getDb();
  if (!database) {
    return 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR\n';
  }
  
  let query = database
    .select()
    .from(weeklyPlans)
    .where(
      and(
        gte(weeklyPlans.planDate, startDate),
        lte(weeklyPlans.planDate, endDate)
      )
    );

  if (managerId) {
    const managerIdNum = typeof managerId === 'string' ? parseInt(managerId) : managerId;
    if (!isNaN(managerIdNum)) {
      query = (query as any).where(eq((weeklyPlans as any).managerId, managerIdNum));
    }
  }

  const plans = await query.execute();

  // ICS başlığı
  let ics = 'BEGIN:VCALENDAR\n';
  ics += 'VERSION:2.0\n';
  ics += 'PRODID:-//Keban Food//Weekly Planning//EN\n';
  ics += 'CALSCALE:GREGORIAN\n';
  ics += 'METHOD:PUBLISH\n';
  ics += 'X-WR-CALNAME:Haftalik Saha Plani\n';
  ics += 'X-WR-TIMEZONE:Europe/Istanbul\n';
  ics += `DTSTAMP:${formatDateTimeForICS(new Date())}\n`;

  // Her plan için event oluştur
  if (!Array.isArray(plans)) {
    return 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR\n';
  }
  plans.forEach((plan: any) => {
    // planDate timestamp veya Date olabilir, Date'e dönüştür
    const planDateObj = plan.planDate instanceof Date ? plan.planDate : new Date(plan.planDate);
    const eventStart = createEventDateTime(planDateObj, plan.planTime);
    // DTEND'i DTSTART'tan 1 saat sonra ayarla (Outlook uyumluluğu için)
    const eventEnd = addHoursToDateTime(eventStart, 1);

    ics += 'BEGIN:VEVENT\n';
    ics += `UID:${plan.id}-${Date.now()}@kebanfood.com\n`;
    ics += `DTSTAMP:${formatDateTimeForICS(new Date())}\n`;
    ics += `DTSTART:${eventStart}\n`;
    ics += `DTEND:${eventEnd}\n`;
    ics += `SUMMARY:${escapeICSText(plan.storeName || 'Plan')} - ${escapeICSText(plan.planDescription || 'Saha Ziyareti')}\n`;
    ics += `DESCRIPTION:${escapeICSText(`Sube: ${plan.branchName}\\nMagaza: ${plan.storeName}\\nPlan: ${plan.planDescription}\\nDurum: ${plan.status}`)}\n`;
    ics += `LOCATION:${escapeICSText(plan.storeName || 'Belirsiz')}\n`;
    ics += `CATEGORIES:Saha Plani\n`;
    ics += `STATUS:${getICSStatus(plan.status)}\n`;
    ics += `PRIORITY:5\n`;
    ics += 'END:VEVENT\n';
  });

  ics += 'END:VCALENDAR\n';

  return ics;
}

/**
 * Tarihi ICS formatına dönüştür (YYYYMMDDTHHMMSSZ)
 */
function formatDateTimeForICS(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Tarih ve saati birleştir (HH:MM formatında saat)
 */
function createEventDateTime(date: Date, timeStr: string): string {
  // Türkiye saatinde tarihi ve saati al (yerel saat)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  let hours = 9;
  let minutes = 0;

  if (timeStr && timeStr.includes(':')) {
    const [h, m] = timeStr.split(':');
    hours = parseInt(h) || 9;
    minutes = parseInt(m) || 0;
  }

  // Türkiye saatini UTC'ye dönüştür (UTC+3 → UTC)
  // Date.UTC kullanarak doğru hesaplama yap
  const turkeyDate = new Date(year, parseInt(month) - 1, parseInt(day), hours, minutes, 0);
  
  // UTC formatında string oluştur
  const utcYear = turkeyDate.getUTCFullYear();
  const utcMonth = String(turkeyDate.getUTCMonth() + 1).padStart(2, '0');
  const utcDay = String(turkeyDate.getUTCDate()).padStart(2, '0');
  const utcHour = String(turkeyDate.getUTCHours()).padStart(2, '0');
  const utcMinute = String(turkeyDate.getUTCMinutes()).padStart(2, '0');

  return `${utcYear}${utcMonth}${utcDay}T${utcHour}${utcMinute}00Z`;
}

/**
 * Saate 1 saat ekle (UTC formatında)
 */
function addHoursToDateTime(dateTimeStr: string, hours: number): string {
  // YYYYMMDDTHHMMSSZ formatından parse et
  const year = parseInt(dateTimeStr.substring(0, 4));
  const month = parseInt(dateTimeStr.substring(4, 6)) - 1;
  const day = parseInt(dateTimeStr.substring(6, 8));
  const hour = parseInt(dateTimeStr.substring(9, 11));
  const minute = parseInt(dateTimeStr.substring(11, 13));

  // UTC saatine saat ekle (gün değişimi kontrol et)
  let newHour = hour + hours;
  let newDay = day;
  
  if (newHour >= 24) {
    newHour -= 24;
    newDay += 1;
  } else if (newHour < 0) {
    newHour += 24;
    newDay -= 1;
  }

  // UTC tarihini al (Date.UTC kullanarak yerel saat sorununu önle)
  const date = new Date(Date.UTC(year, month, newDay, newHour, minute, 0));

  // UTC formatında string oluştur
  const resultYear = date.getUTCFullYear();
  const resultMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
  const resultDay = String(date.getUTCDate()).padStart(2, '0');
  const resultHour = String(date.getUTCHours()).padStart(2, '0');
  const resultMinute = String(date.getUTCMinutes()).padStart(2, '0');
  const resultSecond = String(date.getUTCSeconds()).padStart(2, '0');

  return `${resultYear}${resultMonth}${resultDay}T${resultHour}${resultMinute}${resultSecond}Z`;
}

/**
 * ICS metni escape et (özel karakterleri düzelt)
 */
function escapeICSText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .substring(0, 255); // Maksimum 255 karakter
}

/**
 * Durum bilgisini ICS formatına dönüştür
 */
function getICSStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'Tamamlandı': 'COMPLETED',
    'Kısmen': 'IN-PROCESS',
    'Tamamlanmadı': 'NEEDS-ACTION',
    'Planlandı': 'TENTATIVE',
    'Ertelendi': 'CANCELLED',
  };

  return statusMap[status] || 'TENTATIVE';
}
