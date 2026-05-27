import * as fs from "fs";
import * as path from "path";
import ExcelJS from "exceljs";

interface EvaluationData {
  employeeName: string;
  employeePosition: string;
  employeeIdNumber?: string;
  hireDate?: string;
  evaluationDate: string;
  evaluationPeriod: string;
  evaluatedByManager?: string;
  managerOpinion?: string;
  totalScore: number;
  evaluationScale: string;
  categoryScores: {
    "Davranışsal - Görev Bilinci": number;
    "Davranışsal - İletişim Becerisi": number;
    "Davranışsal - Analitik Düşünme": number;
    "Davranışsal - Kalite Odaklılık": number;
    "Davranışsal - Takım Çalışması": number;
    "Davranışsal - Yönetim Becerileri": number;
    "Mesleki Teknik - İş Disiplini": number;
    "Mesleki Teknik - Restoran Yönetimi": number;
  };
}

/**
 * Değerlendirmeyi master Excel dosyasına ekle
 */
export async function addEvaluationToExcel(
  evaluationData: EvaluationData
): Promise<void> {
  try {
    const excelPath = path.join(
      process.cwd(),
      "storage",
      "evaluations_master.xlsx"
    );

    // Excel dosyasını oku
    if (!fs.existsSync(excelPath)) {
      throw new Error(`Excel dosyası bulunamadı: ${excelPath}`);
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelPath);
    const worksheet = workbook.getWorksheet("Değerlendirmeler");

    if (!worksheet) {
      throw new Error("Değerlendirmeler sayfası bulunamadı");
    }

    // Son satırı bul (header satırı hariç)
    let rowNumber = worksheet.rowCount + 1;

    // Yeni satırı ekle
    const newRow = worksheet.insertRow(rowNumber, {
      "Sıra No": rowNumber - 1,
      "Personel Adı": evaluationData.employeeName,
      "Pozisyon": evaluationData.employeePosition,
      "Personel ID": evaluationData.employeeIdNumber || "",
      "İşe Giriş Tarihi": evaluationData.hireDate || "",
      "Değerlendirme Tarihi": evaluationData.evaluationDate,
      "Dönem": evaluationData.evaluationPeriod,
      "Değerlendiren": evaluationData.evaluatedByManager || "",
      "Toplam Puan": evaluationData.totalScore,
      "Skalası": evaluationData.evaluationScale,
      "Yönetici Görüşü": evaluationData.managerOpinion || "",
      "Davranışsal - Görev Bilinci": evaluationData.categoryScores["Davranışsal - Görev Bilinci"],
      "Davranışsal - İletişim Becerisi": evaluationData.categoryScores["Davranışsal - İletişim Becerisi"],
      "Davranışsal - Analitik Düşünme": evaluationData.categoryScores["Davranışsal - Analitik Düşünme"],
      "Davranışsal - Kalite Odaklılık": evaluationData.categoryScores["Davranışsal - Kalite Odaklılık"],
      "Davranışsal - Takım Çalışması": evaluationData.categoryScores["Davranışsal - Takım Çalışması"],
      "Davranışsal - Yönetim Becerileri": evaluationData.categoryScores["Davranışsal - Yönetim Becerileri"],
      "Mesleki Teknik - İş Disiplini": evaluationData.categoryScores["Mesleki Teknik - İş Disiplini"],
      "Mesleki Teknik - Restoran Yönetimi": evaluationData.categoryScores["Mesleki Teknik - Restoran Yönetimi"],
    });

    // Excel dosyasını kaydet
    await workbook.xlsx.writeFile(excelPath);
    console.log("Değerlendirme Excel dosyasına başarıyla eklendi");
  } catch (error: any) {
    console.error("Excel yazma hatası:", error);
    throw new Error(`Excel dosyasına yazma başarısız: ${error?.message}`);
  }
}
