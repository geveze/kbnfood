/**
 * EmailJS utility functions for sending inspection reports and action notifications
 */

export interface InspectionEmailParams {
  to_email: string;
  sube_adi: string;
  tarih: string;
  denetci: string;
  denetci_email: string;
  rapor_no: string;
  toplam_puan: string;
  sonuc: string;
  toplam_soru: number;
  evet_sayisi: number;
  hayir_sayisi: number;
  kritik_sayisi: number;
  hayir_listesi: string;
  rapor_linki: string;
  pdf_linki: string; // PDF indirme linki
  kat1_pct: string;
  kat2_pct: string;
  kat3_pct: string;
  kat4_pct: string;
  kat5_pct: string;
  yonetici_adi?: string; // Restoran Yöneticisi Adı
}

export interface ActionEmailParams {
  to_email: string;
  sorumlu_kisi: string;
  sube_adi: string;
  tarih: string;
  soru_metni: string;
  kategori: string;
  aksiyon_aciklamasi: string;
  tamamlanma_tarihi: string;
  denetci: string;
}

export async function sendInspectionEmail(params: InspectionEmailParams): Promise<boolean> {
  try {
    const emailjs = (window as any).emailjs;
    if (!emailjs) {
      console.error('EmailJS not initialized');
      return false;
    }

    await emailjs.send(
      'service_ccfq8es',
      'template_0p6k2qh',
      params,
      'pk8S-jZ4k0kZ_CH1G'
    );
    return true;
  } catch (error) {
    console.error('Error sending inspection email:', error);
    return false;
  }
}

export async function sendActionEmail(params: ActionEmailParams): Promise<boolean> {
  try {
    const emailjs = (window as any).emailjs;
    if (!emailjs) {
      console.error('EmailJS not initialized');
      return false;
    }

    await emailjs.send(
      'service_ccfq8es',
      'AKSİYON_p2uefyf',
      params,
      'pk8S-jZ4k0kZ_CH1G'
    );
    return true;
  } catch (error) {
    console.error('Error sending action email:', error);
    return false;
  }
}

export async function sendMultipleEmails(
  emailList: string[],
  params: InspectionEmailParams,
  additionalEmail?: string
): Promise<{ successCount: number; failureCount: number }> {
  let successCount = 0;
  let failureCount = 0;

  // Combine email list with additionalEmail if provided
  const allEmails = [...emailList];
  if (additionalEmail && additionalEmail.trim()) {
    allEmails.push(additionalEmail.trim());
  }

  for (const email of allEmails) {
    if (!email || !email.trim()) continue;
    
    const success = await sendInspectionEmail({
      ...params,
      to_email: email,
    });
    
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }

  return { successCount, failureCount };
}

export function generateReportNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DEN-${year}${month}${day}-${random}`;
}

export function formatDateTR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('tr-TR');
}

export function getSuccessLabel(score: number): string {
  if (score >= 91) return 'BAŞARILI';
  if (score >= 86) return 'BEKLENEN';
  if (score >= 80) return 'GELİŞTİRİLEBİLİR';
  return 'BAŞARISIZ';
}
