import React, { useState, useEffect, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Camera, X, Home } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { sendMultipleEmails, sendActionEmail, generateReportNumber, formatDateTR, getSuccessLabel } from "@/lib/emailUtils";
import { generatePDFFilename } from "@/lib/pdfUtils";
import type { InspectionEmailParams } from "@/lib/emailUtils";

interface Answer {
  questionId: number;
  answer: "E" | "H"; // Evet / Hayır
  earnedPoints: number;
  questionPoints: number;
  penaltyPoints?: number; // Puan düşümü
  explanation: string;
  isCritical: boolean;
  photoUrls: string[];
  questionText?: string; // Soru metni (PDF'de gösterilmesi için)
  categoryName?: string; // Kategori adı
  responsiblePerson?: string; // Sorumlu kişi
  responsiblePersonEmail?: string; // Sorumlu kişi e-posta
  actionDescription?: string; // Aksiyon açıklaması
  dueDate?: string; // Bitiş tarihi
}

interface ActionPlan {
  questionId: number;
  action: string; // Aksiyon açıklaması (zorunlu)
  description: string;
  responsiblePerson: string;
  responsiblePersonEmail: string;
  dueDate: string;
  approved?: "yes" | "no"; // Onay durumu (aksiyon yazılıysa zorunlu)
  status?: "pending" | "in_progress" | "completed";
}

interface FormState {
  selectedBranch: string;
  inspectionDate: string;
  restaurantManagerName: string;
  restaurantManagerEmail: string;
  otherEmail: string;
      answers: Array<{
        questionId: number;
        answer: "E" | "H";
        earnedPoints: number;
        questionPoints: number;
        penaltyPoints?: number;
        explanation: string;
        isCritical: boolean;
        photoUrls: string[];
        questionText?: string;
      }>;
}

const STORAGE_KEY = "field_inspection_draft";
const AUTO_SAVE_INTERVAL = 30000; // 30 saniye

export default function FieldInspection() {
  console.log("[FieldInspection] Component rendered");
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // ===== ALL useState HOOKS FIRST =====
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedBranchData, setSelectedBranchData] = useState<any>(null);
  const [inspectionDate, setInspectionDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [restaurantManagerName, setRestaurantManagerName] = useState("");
  const [restaurantManagerEmail, setRestaurantManagerEmail] = useState("");
  const [otherEmail, setOtherEmail] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [answers, setAnswers] = useState<Map<number, Answer>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingPhotos, setUploadingPhotos] = useState<Map<number, boolean>>(new Map());
  const [autoSaveMessage, setAutoSaveMessage] = useState("");
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedQuestionForAction, setSelectedQuestionForAction] = useState<number | null>(null);
  const [selectedQuestionText, setSelectedQuestionText] = useState<string>("");
  const [actionPlans, setActionPlans] = useState<Map<number, ActionPlan>>(new Map());
  const [actionDescription, setActionDescription] = useState("");
  const [actionResponsiblePerson, setActionResponsiblePerson] = useState("");
  const [actionResponsiblePersonEmail, setActionResponsiblePersonEmail] = useState("");
  const [actionDueDate, setActionDueDate] = useState("");
  const [actionMailSending, setActionMailSending] = useState(false);
  const [actionMailStatus, setActionMailStatus] = useState<string>("");
  const [actionApproved, setActionApproved] = useState<"yes" | "no" | "">("")
  const [editQuestionModalOpen, setEditQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editQuestionPoints, setEditQuestionPoints] = useState(0);
  const [editQuestionIsCritical, setEditQuestionIsCritical] = useState(false);
  const [editQuestionCategory, setEditQuestionCategory] = useState("");
  const [editQuestionPenalty, setEditQuestionPenalty] = useState(0);
  const [editQuestionDescription, setEditQuestionDescription] = useState("");
  const [generalEvaluationComments, setGeneralEvaluationComments] = useState("");
  const [strengthsText, setStrengthsText] = useState("");
  const [improvementAreasText, setImprovementAreasText] = useState("");
  const [suggestionsText, setSuggestionsText] = useState("");

  // ===== ALL useCallback HOOKS =====
  const saveToLocalStorage = useCallback(() => {
    try {
      const formState: FormState = {
        selectedBranch,
        inspectionDate,
        restaurantManagerName,
        restaurantManagerEmail,
        otherEmail,
        answers: Array.from(answers.values()),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formState));
      setAutoSaveMessage("Taslak otomatik kaydedildi");
      setTimeout(() => setAutoSaveMessage(""), 3000);
    } catch (err: any) {
      console.error("localStorage kayıt hatası:", err);
    }
    }, [selectedBranch, inspectionDate, restaurantManagerName, restaurantManagerEmail, otherEmail, answers]);

  // ===== ALL useEffect HOOKS =====
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const formState: FormState = JSON.parse(saved);
        setSelectedBranch(formState.selectedBranch);
        setInspectionDate(formState.inspectionDate);
        setRestaurantManagerName(formState.restaurantManagerName);
        setRestaurantManagerEmail(formState.restaurantManagerEmail);
        const answersMap = new Map(formState.answers.map((a: any) => [a.questionId, a]));
        setAnswers(answersMap);
      }
    } catch (err: any) {
      console.error("localStorage yükleme hatası:", err);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(saveToLocalStorage, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [saveToLocalStorage]);

  // ===== ALL tRPC QUERIES AND MUTATIONS =====
  const utils = (trpc as any).useUtils();
  const positionsQuery = trpc.positions.getAll.useQuery();
  const branchesQuery = (trpc as any).fieldInspection.getBranches.useQuery();
  
  // Stable query input - always pass positionId (can be undefined)
  const positionId = selectedPosition ? parseInt(selectedPosition) : undefined;
  const categoriesQuery = (trpc as any).fieldInspection.getCategoriesWithQuestions.useQuery(
    { positionId },
    { enabled: true }
  );
  
  const updateQuestionMutation = (trpc as any).fieldInspection.updateQuestion.useMutation({
    onSuccess: () => {
      utils.fieldInspection.getCategoriesWithQuestions.invalidate();
    },
  });
  const createInspectionMutation = (trpc as any).fieldInspection.createInspection.useMutation({
    onSuccess: (data: any) => {
      console.log('[DEBUG] Mutation başarılı, data:', data);
      console.log('[DEBUG] inspectionId:', data?.inspectionId);
      
      if (data?.inspectionId) {
        console.log('[DEBUG] Print sayfasına yönlendiriliyor:', data.inspectionId);
        setTimeout(() => {
          navigate(`/inspection-print/${data.inspectionId}`);
        }, 1000);
      }
      
      // PDF otomatik açılması kaldırıldı - kullanıcı inspection-print sayfasından indirebilir
      
      // Invalidate categories query to refresh
      utils.fieldInspection.getCategoriesWithQuestions.invalidate();
      
      // Invalidate dashboard queries to refresh inspection dashboard
      utils.fieldInspection.getDashboardMetrics.invalidate();
      utils.fieldInspection.getCriticalQuestions.invalidate();
      utils.fieldInspection.getWarningsSummary.invalidate();
    },
    onError: (error: any) => {
      console.error('[ERROR] Mutation hatası:', error);
      const errorMessage = error?.message || error?.data?.message || 'Denetim kaydı oluşturulurken bir hata oluştu';
      alert(`HATA: ${errorMessage}`);
    }
  });
  const saveActionMutation = (trpc as any).fieldInspection.saveAction.useMutation({
    onSuccess: () => {
      utils.fieldInspection.getCategoriesWithQuestions.invalidate();
    }
  });

  // ===== EVENT HANDLERS AND FUNCTIONS =====
  const handleBranchChange = (branchId: string) => {
    console.log('[handleBranchChange] branchId:', branchId);
    setSelectedBranch(branchId);
    console.log('[handleBranchChange] selectedBranch state updated to:', branchId)
    const branch = branchesQuery.data?.find((b: any) => b.id.toString() === branchId);
    if (branch) {
      setSelectedBranchData(branch);
      setRestaurantManagerName("");
      // Şube seçildiğinde restoran müdürü e-postasını otomatik doldur
      if ((branch as any).branchEmail) {
        setRestaurantManagerEmail((branch as any).branchEmail);
        console.log('[handleBranchChange] Restoran müdürü e-postası otomatik dolduruldu:', (branch as any).branchEmail);
      } else {
        setRestaurantManagerEmail("");
      }
    }
  };

  const handlePositionChange = (positionIdStr: string) => {
    setSelectedPosition(positionIdStr);
    setAnswers(new Map());
  };

  const handleAnswerChange = (
    questionId: number,
    answer: "E" | "H",
    points: number,
    isCritical: boolean,
    penaltyPoints?: number,
    explanation?: string,
    photoUrls?: string[],
    questionText?: string
  ) => {
    const currentAnswer = answers.get(questionId);
    let earnedPoints = answer === "E" ? points : 0;

    // Kritik soru ise ve "Hayır" cevabı verilmişse puan düşümü uygula
    if (isCritical && answer === "H") {
      // Kritik soru cevabı "Hayır" ise, puan düşümü uygulanır
      // Backend'de bu hesaplanacak, frontend'de sadece gösterilecek
      earnedPoints = 0;
    }

    const newAnswer: Answer = {
      questionId,
      answer,
      earnedPoints,
      questionPoints: points,
      penaltyPoints: penaltyPoints || 0,
      explanation: explanation || "",
      isCritical,
      photoUrls: photoUrls || [],
      questionText,
    };

    const newAnswers = new Map(answers);
    newAnswers.set(questionId, newAnswer);
    setAnswers(newAnswers);
    
    // Save to localStorage immediately
    const answersArray = Array.from(newAnswers.values()).filter(a => a && a.questionId != null);
    localStorage.setItem('fieldInspectionAnswers', JSON.stringify(answersArray));
  };

  const calculateTotalScore = () => {
    let totalFinalScore = 0;
    let totalCriticalPenalty = 0;

    categoriesQuery.data?.forEach((category: any) => {
      const categoryTotalPoints = category.questions.reduce((sum: any, q: any) => sum + (q.points || 0), 0);
      const categoryEarnedPoints = category.questions.reduce((sum: any, q: any) => {
        const answer = answers.get(q.id);
        let points = answer?.answer === "E" ? (q.points || 0) : 0;

        // Kritik soru puan düşümü (kritik sorulara H cevabı verilirse puan düşüyor)
        if (q.isCritical && answer?.answer === "H" && q.penaltyPoints && q.penaltyPoints > 0) {
          // Soru yönetiminde tanımlanan puan düşümünü kullan
          totalCriticalPenalty += q.penaltyPoints;
        }

        return sum + points;
      }, 0);

      const categoryPercentage = categoryTotalPoints > 0 ? (categoryEarnedPoints / categoryTotalPoints) * 100 : 0;
      const categoryWeight = (category.weight as any) || 0;
      const categoryFinalScore = (categoryPercentage / 100) * categoryWeight;
      totalFinalScore += categoryFinalScore;
    });

    // Kritik soru puan düşümünü uygula
    totalFinalScore = Math.max(0, totalFinalScore - totalCriticalPenalty);

    return { totalFinalScore, totalCriticalPenalty };
  };

  const sendInspectionEmails = async (inspectionId: number, inspectionData: any, branchName: string, pdfUrl?: string) => {
    try {
      const reportNo = generateReportNumber();
      const tarih = formatDateTR(inspectionData.inspectionDate);
      const sonuc = getSuccessLabel(inspectionData.totalScore);
      
      const emailList = [
        inspectionData.inspectorEmail,
        otherEmail
      ].filter((e: string) => e && e.trim());
      
      if (emailList.length === 0) return;
      
      const answersArray = Array.from(answers.values());
      const yesCount = answersArray.filter(a => a.answer === 'E').length;
      const noCount = answersArray.filter(a => a.answer === 'H').length;
      const criticalNoCount = answersArray.filter(a => a.answer === 'H' && a.isCritical).length;
      
      const noAnswersList = answersArray
        .filter(a => a.answer === 'H')
        .map(a => `• ${a.questionText || 'Soru'}`)
        .join('\n');
      
      const categoryPercentages: any = {};
      categoriesQuery.data?.forEach((cat: any, idx: number) => {
        const categoryAnswers = answersArray.filter(a => {
          const q = cat.questions.find((q: any) => q.id === a.questionId);
          return q != null;
        });
        const earnedPoints = categoryAnswers.filter(a => a.answer === 'E').reduce((sum: number, a: any) => sum + a.earnedPoints, 0);
        const totalPoints = categoryAnswers.reduce((sum: number, a: any) => sum + a.questionPoints, 0);
        const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
        categoryPercentages[`kat${idx + 1}_pct`] = `%${Math.round(percentage)}`;
      });
      
      // PDF linkini absolute URL'ye çevir
      const absolutePdfUrl = pdfUrl?.startsWith('http') ? pdfUrl : `${window.location.origin}${pdfUrl}`;
      
      const emailParams: InspectionEmailParams = {
        to_email: '',
        sube_adi: branchName,
        tarih,
        denetci: inspectionData.inspectorName,
        denetci_email: inspectionData.inspectorEmail,
        rapor_no: reportNo,
        toplam_puan: `${Math.round(inspectionData.totalScore)}%`,
        sonuc,
        toplam_soru: answersArray.length,
        evet_sayisi: yesCount,
        hayir_sayisi: noCount,
        kritik_sayisi: criticalNoCount,
        hayir_listesi: noAnswersList || 'Yok',
        rapor_linki: `${window.location.origin}/field-inspection-detail/${inspectionId}?view=public`,
        pdf_linki: absolutePdfUrl || '',
        kat1_pct: categoryPercentages.kat1_pct || '%0',
        kat2_pct: categoryPercentages.kat2_pct || '%0',
        kat3_pct: categoryPercentages.kat3_pct || '%0',
        kat4_pct: categoryPercentages.kat4_pct || '%0',
        kat5_pct: categoryPercentages.kat5_pct || '%0',
        yonetici_adi: inspectionData.restaurantManagerName || '',
      };
      
      const result = await sendMultipleEmails(emailList, emailParams, otherEmail);
      if (result.successCount > 0) {
        setSuccess(`✅ Denetim kaydedildi! ${result.successCount} kişiye denetim raporu gönderildi.`);
      }
      
      // Aksiyon Emaillerini gönder - "Hayır" cevapları için
      const noAnswers = answersArray.filter(a => a.answer === 'H');
      
      for (const noAnswer of noAnswers) {
        if (!noAnswer.responsiblePersonEmail) continue;
        
        const actionParams = {
          to_email: noAnswer.responsiblePersonEmail,
          sorumlu_kisi: noAnswer.responsiblePerson || 'Sorumlu',
          sube_adi: branchName,
          tarih: tarih,
          soru_metni: noAnswer.questionText || 'Soru',
          kategori: noAnswer.categoryName || 'Kategori',
          aksiyon_aciklamasi: noAnswer.actionDescription || 'Aksiyon gerekli',
          tamamlanma_tarihi: noAnswer.dueDate || '',
          denetci: inspectionData.inspectorName,
        };
        
        try {
          await sendActionEmail(actionParams);
          console.log('[sendInspectionEmails] Aksiyon maili gönderildi:', noAnswer.responsiblePersonEmail);
        } catch (err) {
          console.error('[sendInspectionEmails] Aksiyon maili hatası:', err);
        }
      }
    } catch (err: any) {
      console.error('[sendInspectionEmails] Hata:', err);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    // Double submit'i engelle
    if (loading || createInspectionMutation.isPending) {
      console.log('[handleSave] Mutation zaten çalışıyor, çift submit engellendi');
      return;
    }
    
    console.log('[handleSave] *** BUTTON CLICKED - FUNCTION CALLED **');
    try {
      console.log('[handleSave] Başladı, selectedBranch:', selectedBranch);
      console.log('[handleSave] restaurantManagerName:', restaurantManagerName);
      console.log('[handleSave] restaurantManagerEmail:', restaurantManagerEmail);
      console.log('[handleSave] answers.size:', answers.size);
      
      if (!selectedBranch || !restaurantManagerName || !restaurantManagerEmail) {
        console.log('[handleSave] Validation hatası - eksik alanlar');
        setError("Lütfen tüm gerekli alanları doldurunuz");
        return;
      }

      if (answers.size === 0) {
        console.log('[handleSave] Validation hatası - cevap yok');
        setError("Lütfen en az bir soruya cevap veriniz");
        return;
      }

      console.log('[handleSave] Validation başarılı, mutation çağrılıyor...');
      setLoading(true);
      setError("");
      setSuccess("");

    } catch (outerErr: any) {
      console.error('[handleSave] Outer error:', outerErr);
      setError(outerErr?.message || 'Beklenmeyen hata oluştu');
      setLoading(false);
      return;
    }

    try {
      // Tüm soruların isCritical değerini kontrol et
      console.log('[handleSave] answersArray oluşturuluyor...');
      const answersArray = Array.from(answers.values())
        .filter(a => a.questionId != null)
        .map((a: any) => {
          const question = categoriesQuery.data
            ?.flatMap((cat: any) => cat.questions)
            .find((q: any) => q.id === a.questionId);
          return {
            questionId: a.questionId!,
            answer: a.answer,
            earnedPoints: a.earnedPoints ?? 0,
            questionPoints: a.questionPoints ?? 0,
            penaltyPoints: question?.penaltyPoints ?? 0,
            explanation: a.explanation ?? "",
            isCritical: question?.isCritical ?? false,
            photoUrls: a.photoUrls ?? [],
            questionText: a.questionText
          };
        });
      console.log('[handleSave] answersArray hazır, count:', answersArray.length);

      console.log('[handleSave] totalScore hesaplanıyor...');
      const { totalFinalScore, totalCriticalPenalty } = calculateTotalScore();
      console.log('[handleSave] totalScore:', totalFinalScore, 'criticalPenalty:', totalCriticalPenalty);

      // Şube bilgisini query'den doğrudan al (state timing sorununu önlemek için)
      const selectedBranchFromQuery = branchesQuery.data?.find((b: any) => b.id.toString() === selectedBranch);
      const branchCode = selectedBranchFromQuery?.code || selectedBranchData?.code || "";
      const branchName = selectedBranchFromQuery?.name || selectedBranchData?.name || "";
      console.log('[handleSave] Branch info - ID:', selectedBranch, 'Name:', branchName, 'Code:', branchCode);
      console.log('[DEBUG] actionPlans Map size:', actionPlans.size);
      console.log('[DEBUG] actionPlans Map content:', Array.from(actionPlans.entries()));
      const actionPlansArray = Array.from(actionPlans.values());
      console.log('[DEBUG] actionPlans Array:', JSON.stringify(actionPlansArray, null, 2));
      const payload = {
        branchId: parseInt(selectedBranch),
        branchCode: selectedBranchData?.branchCode || "",
        branchName: selectedBranchData?.branchName || "",
        inspectionDate,
        restaurantManagerName,
        restaurantManagerEmail,
        inspectorName: user?.name || "",
        inspectorEmail: user?.email || "",
        answers: answersArray,
        actionPlans: actionPlansArray,
        totalScore: totalFinalScore,
        criticalPenalty: totalCriticalPenalty,
        generalEvaluation: {
          comments: generalEvaluationComments,
          strengths: strengthsText,
          improvementAreas: improvementAreasText,
          suggestions: suggestionsText,
        },
      };
       console.log('[DEBUG] Final payload actionPlans:', JSON.stringify(payload.actionPlans, null, 2));
      console.log('[handleSave] inspectionData hazır, mutation çağılıyor...');
      console.log('[handleSave] inspectionData.totalScore:', payload.totalScore);
      console.log('[handleSave] inspectionData.generalEvaluation:', payload.generalEvaluation);

      const result = await createInspectionMutation.mutateAsync(payload);
      console.log('[handleSave] Mutation başarılı, result:', result);
      console.log('[handleSave] Mutation result:', result);
      console.log('[handleSave] result.inspectionId:', result?.inspectionId);

      setSuccess("Denetim başarıyla kaydedildi! Mailleriniz gönderiliyor...");
      localStorage.removeItem(STORAGE_KEY);
      
      // Email gönderme işlemini başlat (arka planda)
      if (result && result.inspectionId) {
        sendInspectionEmails(result.inspectionId, payload, branchName, result.pdfUrl);
      }
      
      // Form alanlarını temizle
      setTimeout(() => {
        setSelectedBranch("");
        setAnswers(new Map());
        setActionPlans(new Map());
        setGeneralEvaluationComments("");
        setStrengthsText("");
        setImprovementAreasText("");
        setSuggestionsText("");
        
        // Print sayfasına yönlendir
        if (result && result.inspectionId) {
          console.log('[handleSave] Print sayfasına yönlendiriliyor:', result.inspectionId);
          navigate(`/inspection-print/${result.inspectionId}`);
        } else {
          console.log('[handleSave] inspectionId boş, dashboard a yönlendiriliyor');
          navigate("/inspection-dashboard");
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Denetim kaydedilirken hata oluştu");
      console.error("Denetim kayıt hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Giriş yapmanız gerekiyor</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
    <form onSubmit={handleSave} onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') e.preventDefault(); }} className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Başlık */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Saha Denetimi</h1>
            <p className="text-gray-600 mt-2">Şube denetimini gerçekleştirin ve soruları cevaplayın</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            <Home className="w-4 h-4 mr-2" />
            Ana Sayfa
          </Button>
        </div>

        {/* Hata ve Başarı Mesajları */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800">{success}</span>
            </CardContent>
          </Card>
        )}

        {autoSaveMessage && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800">{autoSaveMessage}</span>
            </CardContent>
          </Card>
        )}

        {/* Ziyaret Bilgileri */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Ziyaret Bilgileri</CardTitle>
            <CardDescription>Denetim için gerekli bilgileri doldurunuz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Şube Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şube Adı <span className="text-red-600">*</span>
                </label>
                <Select value={selectedBranch} onValueChange={handleBranchChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Şube seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {branchesQuery.data?.map((branch: any) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name} ({branch.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Denetim Tarihi - Read-only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Denetim Tarihi <span className="text-red-600">*</span>
                </label>
                <Input type="date" value={inspectionDate} disabled className="bg-gray-100 cursor-not-allowed" />
              </div>

              {/* Denetçi Adı - Readonly */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Denetçi Adı <span className="text-red-600">*</span>
                </label>
                <Input
                  value={user?.name || ""}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>

              {/* Denetçi E-posta - Readonly */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Denetçi E-posta <span className="text-red-600">*</span>
                </label>
                <Input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>

              {/* Restoran Yöneticisi Adı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restoran Yöneticisi Adı <span className="text-red-600">*</span>
                </label>
                <Input
                  placeholder="Adı soyadı"
                  value={restaurantManagerName}
                  onChange={(e: any) => setRestaurantManagerName(e.target.value)}
                />
              </div>

              {/* Restoran Yöneticisi E-posta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restoran Yöneticisi E-posta
                </label>
                <Input
                  type="email"
                  placeholder="E-posta adresi"
                  value={restaurantManagerEmail}
                  onChange={(e) => setRestaurantManagerEmail(e.target.value)}
                  className=""
                  title="Şube seçildiğinde otomatik doldurulur, gerekirse düzenleyebilirsiniz"
                />
              </div>

              {/* Diğer E-posta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diğer E-posta
                </label>
                <Input
                  type="email"
                  placeholder="Opsiyonel e-posta adresi"
                  value={otherEmail}
                  onChange={(e: any) => setOtherEmail(e.target.value)}
                />
              </div>


            </div>
          </CardContent>
        </Card>

        {/* Admin Soru Yönetim Alanı */}
        {user?.role === "admin" && selectedBranch && (
          <Card className="mb-8 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-purple-900">Admin - Soru Yönetimi</CardTitle>
              <CardDescription>Sorulara kritik işareti ekleyin ve puan düşümü tanımlayın</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoriesQuery.data?.map((category: any) =>
                  category.questions.map((question: any) => (
                    <div key={question.id} className="flex items-center justify-between p-3 bg-white rounded border border-purple-200">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{question.questionText}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {question.isCritical && <span className="text-red-600 font-semibold">KRİTİK • </span>}
                          {question.points} Puan
                          {question.isCritical && (
                            <span className="text-red-600"> • 5 Puan Düşümü</span>
                          )}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingQuestion(question);
                          setEditQuestionText(question.questionText);
                          setEditQuestionPoints(question.points || 0);
                          setEditQuestionIsCritical(question.isCritical || false);
                          setEditQuestionCategory(question.categoryId?.toString() || "");
                          setEditQuestionPenalty(0);
                          setEditQuestionDescription("");
                          setEditQuestionModalOpen(true);
                        }}
                      >
                        Düzenle
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Denetim Soruları */}
        {selectedBranch && (
          <div className="space-y-8">
            {categoriesQuery.isLoading && (
              <div className="text-center py-8">
                <p className="text-gray-500">Sorular yükleniyor...</p>
              </div>
            )}
            {categoriesQuery.data && categoriesQuery.data.length > 0 && categoriesQuery.data.map((category: any) => (
              <Card key={category.id} className="border-gray-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription>{category.questions.length} soru</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-600">Etki Oranı</p>
                      <p className="text-lg font-bold text-purple-600">{parseFloat(category.weight || 0).toFixed(1)}%</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {category.questions.map((question: any, idx: any) => (
                    <div key={question.id} className="border-b pb-6 last:border-b-0">
                      <div className="flex items-start gap-2 mb-3">
                        <span className="text-sm font-semibold text-gray-600">{idx + 1}.</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{question.questionText}</p>
                          <div className="flex gap-2 mt-2">
                            {question.isCritical && (
                              <span className="inline-block px-2 py-1 text-xs font-semibold text-red-600 bg-red-100 rounded">
                                KRİTİK
                              </span>
                            )}
                            <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded">
                              {question.points} Puan
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Evet/Hayır Butonları ve Aksiyon */}
                      <div className="ml-6 flex gap-3 mb-4 items-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleAnswerChange(
                              question.id,
                              "E",
                              question.points || 0,
                              question.isCritical || false,
                              question.penaltyPoints,
                              answers.get(question.id)?.explanation,
                              answers.get(question.id)?.photoUrls,
                              question.questionText
                            )
                          }
                          className={`px-4 py-2 rounded font-semibold transition-colors ${
                            answers.get(question.id)?.answer === "E"
                              ? "bg-green-600 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          ✓ Evet
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleAnswerChange(
                              question.id,
                              "H",
                              question.points || 0,
                              question.isCritical || false,
                              question.penaltyPoints,
                              answers.get(question.id)?.explanation,
                              answers.get(question.id)?.photoUrls,
                              question.questionText
                            )
                          }
                          className={`px-4 py-2 rounded font-semibold transition-colors ${
                            answers.get(question.id)?.answer === "H"
                              ? "bg-red-600 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          ✗ Hayır
                        </button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-orange-300 text-orange-600 hover:bg-orange-50"
                          onClick={() => {
                            setSelectedQuestionForAction(question.id);
                            setSelectedQuestionText(question.questionText || "");
                            const existingAction = actionPlans.get(question.id);
                            if (existingAction) {
                              setActionDescription(existingAction.description);
                              setActionResponsiblePerson(existingAction.responsiblePerson);
                              setActionDueDate(existingAction.dueDate);
                            } else {
                              setActionDescription("");
                              setActionResponsiblePerson("");
                              setActionDueDate("");
                            }
                            setActionModalOpen(true);
                          }}
                        >
                          📋 Aksiyon Planı
                        </Button>
                      </div>

                      {/* Açıklama */}
                      <div className="ml-6 mb-3">
                        <label className="block text-xs font-medium text-gray-600 mb-2">
                          Açıklama (opsiyonel)
                        </label>
                        <Textarea
                          placeholder="Gerekirse açıklama yazınız..."
                          value={answers.get(question.id)?.explanation || ""}
                          onChange={(e: any) => {
                            const current = answers.get(question.id);
                            handleAnswerChange(
                              question.id,
                              current?.answer || "E",
                              question.points,
                              question.isCritical,
                              question.penaltyPoints,
                              e.target.value,
                              current?.photoUrls,
                              question.questionText
                            );
                          }}
                          rows={2}
                          className="text-sm"
                        />
                      </div>

                      {/* Fotoğraf Ekleme */}
                      <div className="ml-6 mb-3">
                        <label className="block text-xs font-medium text-gray-600 mb-2">
                          Fotoğraf Ekle (opsiyonel)
                        </label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={async (e: any) => {
                              const files = Array.from(e.target.files || []) as File[];
                              const currentPhotos = answers.get(question.id)?.photoUrls || [];
                              
                              // Maksimum 3 fotoğraf kontrolü
                              const remainingSlots = 3 - currentPhotos.length;
                              if (remainingSlots <= 0) {
                                setError(`Bu soruya maksimum 3 fotoğraf eklenebilir. Zaten ${currentPhotos.length} fotoğraf var.`);
                                return;
                              }
                              
                              // Seçilen dosyaları sınırla
                              const filesToUpload = files.slice(0, remainingSlots);
                              
                              if (filesToUpload.length > 0) {
                                setUploadingPhotos(new Map(uploadingPhotos).set(question.id, true));
                                setError("");
                                
                                try {
                                  const newPhotoUrls: string[] = [];
                                  
                                  for (const file of filesToUpload) {
                                    // Fotoğrafı Base64'e çevir
                                    const reader = new FileReader();
                                    const base64 = await new Promise<string>((resolve) => {
                                      reader.onload = () => resolve(reader.result as string);
                                      reader.readAsDataURL(file);
                                    });
                                    
                                    newPhotoUrls.push(base64);
                                  }
                                  
                                  // Mevcut fotoğraflarla birleştir
                                  const allPhotos = [...currentPhotos, ...newPhotoUrls];
                                  
                                  // Cevabı güncelle
                                  const current = answers.get(question.id);
                                  if (current) {
                                    handleAnswerChange(
                                      question.id,
                                      current.answer,
                                      current.questionPoints,
                                      current.isCritical,
                                      current.penaltyPoints,
                                      current.explanation,
                                      allPhotos,
                                      question.questionText
                                    );
                                  }
                                } catch (err) {
                                  setError("Fotoğraf yükleme sırasında hata oluştu");
                                  console.error("Photo upload error:", err);
                                } finally {
                                  setUploadingPhotos(new Map(uploadingPhotos).set(question.id, false));
                                  // Input'u temizle
                                  e.target.value = "";
                                }
                              }
                            }}
                            className="text-sm"
                            disabled={uploadingPhotos.get(question.id) || (answers.get(question.id)?.photoUrls?.length || 0) >= 3}
                          />
                          {uploadingPhotos.get(question.id) && (
                            <span className="text-xs text-blue-600">Yükleniyor...</span>
                          )}
                          {(answers.get(question.id)?.photoUrls?.length || 0) > 0 && (
                            <span className="text-xs text-gray-600">({answers.get(question.id)!.photoUrls.length}/3)</span>
                          )}
                        </div>
                        {answers.get(question.id)?.photoUrls && answers.get(question.id)!.photoUrls.length > 0 && (
                          <div className="mt-2 flex gap-2 flex-wrap">
                            {answers.get(question.id)!.photoUrls.map((url: string, idx: number) => (
                              <div key={idx} className="relative">
                                <img src={url} alt={`Fotoğraf ${idx + 1}`} className="h-16 w-16 object-cover rounded" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = answers.get(question.id);
                                    if (current) {
                                      const newUrls = current.photoUrls.filter((_, i) => i !== idx);
                                      handleAnswerChange(
                                        question.id,
                                        current.answer,
                                        current.questionPoints,
                                        current.isCritical,
                                        current.penaltyPoints,
                                        current.explanation,
                                        newUrls,
                                        question.questionText
                                      );
                                    }
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Kategori Puan Özeti */}
                  {(() => {
                    const categoryQuestions = category.questions || [];
                    const categoryTotalMaxPoints = categoryQuestions.reduce((sum: number, q: any) => sum + (q.points || 0), 0);
                    const categoryEarnedPoints = categoryQuestions.reduce((sum: number, q: any) => {
                      const answer = answers.get(q.id);
                      if (!answer) return sum;
                      return sum + (answer.answer === "E" ? (answer.earnedPoints || 0) : 0);
                    }, 0);
                    const categoryWeight = category.weight ? parseFloat(String(category.weight)) : 0;
                    const weightedScore = categoryTotalMaxPoints > 0 ? (categoryEarnedPoints / categoryTotalMaxPoints) * categoryWeight : 0;
                    
                    return (
                      <div className="mt-6 pt-4 border-t-2 border-gray-300 bg-gray-50 p-4 rounded">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <p className="text-xs font-medium text-gray-600 mb-1">Kategori Puanı</p>
                            <p className="text-lg font-bold text-blue-600">{categoryEarnedPoints} / {categoryTotalMaxPoints}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-medium text-gray-600 mb-1">Etki Oranı</p>
                            <p className="text-lg font-bold text-purple-600">{categoryWeight}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-medium text-gray-600 mb-1">Ağırlıklı Puan</p>
                            <p className="text-lg font-bold text-green-600">{weightedScore.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            ))}

            {/* Genel Toplam Puan */}
            {answers.size > 0 && (() => {
              const { totalFinalScore, totalCriticalPenalty } = calculateTotalScore();
              return (
                <Card className="border-2 border-green-500 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-xl text-green-700">Genel Toplam Puan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 mb-2">Nihai Puan (Etki Oranları ile)</p>
                        <p className="text-4xl font-bold text-green-600">
                          {totalFinalScore.toFixed(2)}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 mb-2">Başarı Oranı</p>
                        <p className="text-4xl font-bold text-purple-600">
                          {totalFinalScore.toFixed(1)}%
                        </p>
                      </div>

                      {totalCriticalPenalty > 0 && (
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-600 mb-2">Kritik Soru Puan Düşümü</p>
                          <p className="text-4xl font-bold text-red-600">
                            -{totalCriticalPenalty.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Denetim Değerlendirme Skalası */}
            {selectedBranch && (() => {
              const { totalFinalScore } = calculateTotalScore();
              return (
                <Card className="mt-8 border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="text-yellow-900">Denetim Değerlendirme Skalası</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div
                        className={`p-3 rounded border-2 transition-all ${
                          totalFinalScore <= 79
                            ? "bg-red-200 border-red-500 text-red-900 ring-2 ring-red-400"
                            : "bg-red-100 border-red-300 text-red-900"
                        }`}
                      >
                        <p className="font-semibold">79 ve altı başarısız</p>
                      </div>
                      <div
                        className={`p-3 rounded border-2 transition-all ${
                          totalFinalScore >= 80 && totalFinalScore <= 85
                            ? "bg-yellow-200 border-yellow-500 text-yellow-900 ring-2 ring-yellow-400"
                            : "bg-yellow-100 border-yellow-300 text-yellow-900"
                        }`}
                      >
                        <p className="font-semibold">80-85 Geliştirilebilir</p>
                      </div>
                      <div
                        className={`p-3 rounded border-2 transition-all ${
                          totalFinalScore >= 86 && totalFinalScore <= 90
                            ? "bg-green-200 border-green-500 text-green-900 ring-2 ring-green-400"
                            : "bg-green-100 border-green-300 text-green-900"
                        }`}
                      >
                        <p className="font-semibold">86-90 Beklenen</p>
                      </div>
                      <div
                        className={`p-3 rounded border-2 transition-all ${
                          totalFinalScore >= 91
                            ? "bg-blue-200 border-blue-500 text-blue-900 ring-2 ring-blue-400"
                            : "bg-blue-100 border-blue-300 text-blue-900"
                        }`}
                      >
                        <p className="font-semibold">91 ve üstü başarılı</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Denetçi Genel Değerlendirmesi */}
            {selectedBranch && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Denetim Genel Değerlendirmesi</CardTitle>
                  <CardDescription>Denetim hakkında genel açıklamalarınızı yazınız</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Genel Açıklamalar</label>
                    <Textarea
                      placeholder="Denetim hakkında genel açıklamalarınızı yazınız..."
                      rows={4}
                      className="mt-2"
                      value={generalEvaluationComments}
                      onChange={(e: any) => setGeneralEvaluationComments(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Butonlar */}
            <div className="flex gap-4 justify-end mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedBranch("");
                  setAnswers(new Map());
                  setError("");
                }}
              >
                Temizle
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? "Kaydediliyor..." : "Kaydet ve Gönder"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </form>

    {/* Aksiyon Modal */}
    <>
        <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Aksiyon Planı</DialogTitle>
              <DialogDescription>
                Soru: {selectedQuestionText}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aksiyon Açıklaması
                </label>
                <Textarea
                  placeholder="Aksiyon planını açıklayınız..."
                  value={actionDescription}
                  onChange={(e: any) => setActionDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sorumlu Kişi
                </label>
                <Input
                  placeholder="Sorumlu kişinin adı"
                  value={actionResponsiblePerson}
                  onChange={(e: any) => setActionResponsiblePerson(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sorumlu Kişi E-posta
                </label>
                <Input
                  type="email"
                  placeholder="E-posta adresi"
                  value={actionResponsiblePersonEmail}
                  onChange={(e: any) => setActionResponsiblePersonEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamamlanma Tarihi
                </label>
                <Input
                  type="date"
                  value={actionDueDate}
                  onChange={(e: any) => setActionDueDate(e.target.value)}
                />
              </div>
              {actionDescription.trim() && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aksiyon Onayı <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="actionApproved"
                        value="yes"
                        checked={actionApproved === "yes"}
                        onChange={() => setActionApproved("yes")}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Evet</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="actionApproved"
                        value="no"
                        checked={actionApproved === "no"}
                        onChange={() => setActionApproved("no")}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Hayır</span>
                    </label>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setActionModalOpen(false)}>
                  İptal
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    console.log("[DEBUG] Aksiyon modalı Kaydet butonu tıklandı", { selectedQuestionForAction, actionDescription, actionResponsiblePersonEmail });
                    if (selectedQuestionForAction !== null) {
                      // Aksiyon yazılıysa onay durumu zorunlu
                      if (actionDescription.trim() && !actionApproved) {
                        setError("Aksiyon yazılıysa Evet/Hayır seçimi zorunludur!");
                        setTimeout(() => setError(""), 3000);
                        return;
                      }
                      
                      // Backend'e aksiyon planını kaydet
                      const branchObj = branchesQuery.data?.find((b: any) => b.name === selectedBranch);
                      saveActionMutation.mutate({
                        inspectionId: 0, // Denetim kaydedildikten sonra güncellenecek
                        questionId: selectedQuestionForAction,
                        questionText: selectedQuestionText,
                        branchId: branchObj?.id || 0,
                        branchName: selectedBranch || "",
                        actionDescription: actionDescription,
                        actionDeadline: actionDueDate,
                        assignedToName: actionResponsiblePerson,
                        assignedToEmail: actionResponsiblePersonEmail,
                      }, {
                        onSuccess: () => {
                          const newAction: ActionPlan = {
                            questionId: selectedQuestionForAction,
                            action: actionDescription,
                            description: actionDescription,
                            responsiblePerson: actionResponsiblePerson,
                            responsiblePersonEmail: actionResponsiblePersonEmail,
                            dueDate: actionDueDate,
                            approved: actionApproved as "yes" | "no" | undefined,
                          };
                          const newActionPlans = new Map(actionPlans);
                          newActionPlans.set(selectedQuestionForAction, newAction);
                          setActionPlans(newActionPlans);
                          setActionModalOpen(false);
                          setSuccess("Aksiyon planı başarıyla kaydedildi!");
                          setTimeout(() => setSuccess(""), 2000);
                        },
                        onError: (error: any) => {
                          setError(`Aksiyon kaydedilirken hata: ${error.message}`);
                          setTimeout(() => setError(""), 3000);
                        },
                      });
                    }
                  }}
                >
                  Kaydet
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Soru Düzenleme Modal */}
        <Dialog open={editQuestionModalOpen} onOpenChange={setEditQuestionModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Soruyu Düzenle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Soru Metni</label>
                <Textarea
                  value={editQuestionText}
                  onChange={(e: any) => setEditQuestionText(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Puan</label>
                  <Input
                    type="number"
                    value={editQuestionPoints}
                    onChange={(e: any) => setEditQuestionPoints(parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Puan Düşümü</label>
                  <Input
                    type="number"
                    value={editQuestionPenalty}
                    onChange={(e: any) => setEditQuestionPenalty(parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editQuestionIsCritical}
                    onChange={(e: any) => setEditQuestionIsCritical(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">Kritik Soru</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                <Textarea
                  value={editQuestionDescription}
                  onChange={(e: any) => setEditQuestionDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditQuestionModalOpen(false)}>
                  İptal
                </Button>
                <Button
                  onClick={() => {
                    if (editingQuestion) {
                      updateQuestionMutation.mutate(
                        {
                          questionId: editingQuestion.id,
                          questionText: editQuestionText,
                          points: editQuestionPoints,
                          isCritical: editQuestionIsCritical,
                          penaltyPoints: editQuestionPenalty,
                          description: editQuestionDescription,
                        },
                        {
                          onSuccess: () => {
                            // Modal'ı kapat ve state'i sıfırla
                            setEditQuestionModalOpen(false);
                            setEditingQuestion(null);
                            setEditQuestionText("");
                            setEditQuestionPoints(0);
                            setEditQuestionPenalty(0);
                            setEditQuestionIsCritical(false);
                            setEditQuestionDescription("");
                            setSuccess("Soru başarıyla güncellendi!");
                            setTimeout(() => setSuccess(""), 2000);
                          },
                          onError: (error: any) => {
                            setError(`Hata: ${error.message}`);
                            setTimeout(() => setError(""), 3000);
                          },
                        }
                      );
                    }
                  }}
                >
                  Kaydet
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    </>
  );
}
