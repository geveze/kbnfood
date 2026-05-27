import { toast } from "sonner";
import { trpc } from "./trpc";

/**
 * Değerlendirmeyi SharePoint Excel dosyasına senkronize et
 */
export async function syncEvaluationToSharePoint(evaluationData: {
  employeeName: string;
  employeePosition: string;
  evaluationPeriod: string;
  totalScore: number;
  evaluationScale: string;
  evaluationDate: Date;
  evaluatedByManager?: string;
  managerOpinion?: string;
}) {
  try {
    // tRPC client kullanarak doğru şekilde çağır
    const response = await fetch("/api/trpc/sharepoint.syncEvaluationToSharePoint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: {
          employeeName: evaluationData.employeeName,
          employeePosition: evaluationData.employeePosition,
          evaluationPeriod: evaluationData.evaluationPeriod,
          totalScore: evaluationData.totalScore,
          evaluationScale: evaluationData.evaluationScale,
          evaluationDate: evaluationData.evaluationDate.toISOString(),
          evaluatedByManager: evaluationData.evaluatedByManager || "",
          managerOpinion: evaluationData.managerOpinion || "",
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData?.error?.json?.message || errorData?.message || "SharePoint senkronizasyon başarısız";
      throw new Error(errorMessage);
    }

    const result = await response.json();
    if (result?.result?.data?.success) {
      toast.success("Değerlendirme SharePoint Excel dosyasına kaydedildi");
      return true;
    } else {
      throw new Error(result?.result?.data?.message || "SharePoint senkronizasyon başarısız");
    }
  } catch (error) {
    console.error("SharePoint senkronizasyon hatası:", error);
    // Hata gösterme - sessiz başarısız olsun (opsiyonel)
    // toast.error(`SharePoint senkronizasyon hatası: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
    return false;
  }
}

/**
 * Microsoft Graph API bağlantısını test et
 */
export async function testMicrosoftGraphConnection() {
  try {
    const response = await fetch("/api/trpc/sharepoint.testMicrosoftGraphConnection", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Microsoft Graph test başarısız");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Microsoft Graph test hatası:", error);
    return null;
  }
}
