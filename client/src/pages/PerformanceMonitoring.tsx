import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Download, Plus, Trash2, FileJson, ArrowLeft } from "lucide-react";
import { exportToPDF } from "@/lib/evaluation-export";
import { syncEvaluationToSharePoint } from "@/lib/sharepoint-sync";

// Excel dosyasından alınan 50 soru
const EVALUATION_ITEMS = {
  DAVRANIŞSAL: {
    "Görev Bilinci": [
      "Yaptığı işi en iyi şekilde yapar. İş disiplini ve görev bilinci yüksektir.",
      "Sorumluluğundaki işleri, şirket kural ve prosedürlerine uygun bir biçimde gerçekleştirir.",
      "İşine, kuruma ve kendisine sunulan kaynaklara zarar verecek hiçbir davranış sergilemez.",
      "Ahlaki ve etik değerlere uygun davranır. Davranışlarının sorumluluğunu üstlenir.",
    ],
    "İletişim Becerisi": [
      "Karşındakini dinler ve verilmek istenen mesajı doğru bir şekilde anlar.",
      "Söylemek istediklerini, açık, kısa ve net bir biçimde karşı tarafa aktarır.",
      "İşle ilgili konularla ilgili bilgiyi zamanında aktarır ve paylaşır.",
      "Her türlü iletişimde empati kurmaya özen gösterir. Gerektiğinde iletişim tarzını değiştirebilir.",
    ],
    "Analitik Düşünme ve Problem Çözme": [
      "Gelişmekte olan problemleri görür, önleyici davranış geliştirir.",
      "Durum ve problem karşısında alacağı hareketin sonucunu bilir.",
      "Mevcut sorunu gidermek için alternatif çözüm yolları geliştirir.",
      "Benzer sorunlar arasında ilişki kurar; geçmişteki deneyimlerden faydalanır.",
    ],
    "Kalite Odaklılık": [
      "Mevcut düzen ve iş yapma yöntemine uygun çalışır.",
      "Kaliteyi belirlenen standartlara göre uyarlar.",
      "İş yapma yöntemini sürekli geliştirmeye, verimlilik ve etkililiği artırmaya odaklı çalışır.",
      "İş yapma yöntemine ilişkin akış ve prosedürlerdeki yeniliklere adapte olur.",
    ],
    "Takım Çalışması ve İşbirliği": [
      "Çalışma ortamında iyi ilişkiler kurar ve korur.",
      "Takım arkadaşlarının yardıma ihtiyacı olduğunda gerekli destekte bulunur.",
      "Takım arkadaşlarını, ortak başarı için heveslendirir, onları motive eder.",
      "Takımdaki farklı görüşlere karşı toleranslıdır ve destekleyicidir.",
    ],
    "Yönetim Becerileri": [
      "Doğru insanları belirleyerek ihtiyaçlar doğrultusunda görev dağılımını yapar.",
      "Ekibine mentorluk yapar, yapıcı geri bildirimlerde bulunur ve yönlendirme sağlar.",
      "Ekibini motive eder, olumsuzluk yaratacak durumların önüne geçmek için proaktif davranır.",
      "Ekip içindeki anlaşmazlıkları kişiselleştirmeden şirket yararını gözetir.",
      "İnsanların yeteneklerini keşfeder ve doğru şekilde değerlendirir.",
      "Görevlerin yerine getirilebilmesi için gerekli olan kaynakları belirler.",
      "Aldığı kararların arkasındadır ve bu kararların sorumluluğunu üstlenir.",
      "Zor durumlarda ve baskı altında en etkili kararı verir.",
      "Çalışanların gelişimi için öğrenme ortamı yaratır. Ekibini ve kendini sürekli geliştirir.",
      "Davranışları ile ekibe örnek olur. Söyledikleri ile yaptıkları tutarlıdır.",
    ],
  },
  MESLEKI_TEKNIK: {
    "İş Disiplini ve Tutum": [
      "Dış görünüşüne dikkat eder. Kurumu ve markayı başarıyla temsil eder.",
      "Şirketin eğitimlerine aktif olarak katılır, çalışanların katılımını sağlar.",
      "Restoranın KPI'larını bilir, bu hedefleri gerçekleştirmek için gerekli aksiyonları alır.",
      "Mazeret bildirmeden işe gelmemezlik yapmaz.",
    ],
    "Restoran Yönetimi": [
      "Ekibine ve müşterilere karşı güleryüzlü ve naziktir.",
      "İnsan Kaynakları ve operasyonel prosedür ve talimatları bilir, uygulanmasını sağlar.",
      "Vardiya planlamalarını verimli bir şekilde yapar.",
      "Restoranın nakit ve avans yönetimini hatasız bir şekilde yapar. Prosedürlere uygun hareket eder.",
      "Restoranın stok ve sipariş yönetimini etkin bir şekilde yapar. Fire ve israfı minimize eder.",
      "Müşteri şikayetlerini prosedürler çerçevesinde müşteri kaybına yol açmadan çözer.",
      "Menü fiyatları, promosyon ve kampanyalarla ilgili bilgilidir. Gerektiğinde bilgi verir.",
      "Ürünlerle ve içerikleri ile ilgili bilgilidir.",
      "Çalışma süresince Gıda Güvenliği ve İSG kurallarına uygun hareket edilmesini sağlar.",
      "Tüm şube ekipmanlarının özenli ve titiz kullanılmasını sağlar. Temizlik ve bakımını yapar.",
      "Restoran düzenini sağlar, dağınık ve kirli bir görüntü verilmesine izin vermez.",
      "Zor müşteriler ile iletişim kurabilir, gerekli aksiyonu alır.",
      "Fire ve israfı önler, gerekli önlemleri alır.",
      "Tüm çalışma alanlarının (servis, ızgara, kasa, depo) temizliğini ve hijyenini sağlar.",
      "Bulunduğu şubeye özel satışı arttıracak alternatif öneriler sunar. Müşteri memnuniyetini ön planda tutar.",
      "Pazarlama departmanından gelen görsel ve kampanyaları doğru ve eksiksizsiz bir şekilde uygulanmasını sağlar.",
    ],
  },
};

const EVALUATION_PERIODS = ["3. ay", "6. ay", "9. ay", "12. ay"];

interface EvaluationItem {
  id: string;
  category: string;
  subcategory: string;
  itemNumber: number;
  description: string;
  score: number;
}

interface EvaluationForm {
  branchId: number | null;
  employeeName: string;
  employeePosition: string;
  employeePositionId: number | null;
  employeeIdNumber: string;
  hireDate: string;
  evaluationDate: string;
  evaluationPeriod: string;
  evaluatedByManager: string;
  items: EvaluationItem[];
  scoreExplanations: Record<string, string>;
  managerOpinion: string;
}

export default function PerformanceMonitoring() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const [usedPeriods, setUsedPeriods] = useState<string[]>([]);
  const [form, setForm] = useState<EvaluationForm>({
    branchId: user?.branchId || null,
    employeeName: "",
    employeePosition: "",
    employeePositionId: null as any,
    employeeIdNumber: "",
    hireDate: "",
    evaluationDate: new Date().toISOString().split("T")[0],
    evaluationPeriod: "",
    evaluatedByManager: "",
    items: [],
    scoreExplanations: {},
    managerOpinion: "",
  });

  // Kullanıcının şubesini otomatik olarak ayarla
  useEffect(() => {
    if (user && user.branchId) {
      setForm((prev: any) => ({
        ...prev,
        branchId: user.branchId,
      }));
    }
  }, [user]);

  // Şubeleri getir
  const { data: branches } = (trpc as any).branches.list.useQuery();

  // Pozisyonları getir
  const { data: positions } = (trpc as any).openPif.getPositions.useQuery();

  // Seçilen pozisyonun sorularını getir
  const { data: positionWithQuestions, isLoading: isLoadingQuestions } = (trpc as any).openPif.getPositionWithQuestions.useQuery(
    { positionId: form.employeePositionId ?? 0 },
    { enabled: form.employeePositionId !== null && form.employeePositionId !== 0 }
  );

  // Kullanılan dönemleri al (login gerekli değil)
  const { data: usedPeriodsData } = (trpc as any).system.getUsedPeriods.useQuery(
    { branchId: 0 },
    { enabled: false }
  );

  // Önceki değerlendirmeyi getir - Sicil No (T.C.) ile eşleştir
  const { data: previousEvaluation } = (trpc as any).system.getPreviousEvaluation.useQuery(
    { employeeTCNumber: form.employeeIdNumber },
    { enabled: !!form.employeeIdNumber }
  );

  // Değerlendirme oluştur
  const createEvaluation = (trpc as any).openPif.create.useMutation({
    onSuccess: () => {
      toast.success("Değerlendirme başarıyla kaydedildi");
      // Formu sıfırla
      setForm({
        branchId: null as any,
        employeeName: "",
        employeePosition: "",
        employeePositionId: null as any,
        employeeIdNumber: "",
        hireDate: "",
        evaluationDate: new Date().toISOString().split("T")[0],
        evaluationPeriod: "",
        evaluatedByManager: "",
        items: [],
        managerOpinion: "",
        scoreExplanations: {},
      });
    },
    onError: (error: any) => {
      toast.error("Hata: " + error.message);
    },
  });



  useEffect(() => {
    if (usedPeriodsData) {
      setUsedPeriods(usedPeriodsData.map((p: any) => p.evaluationPeriod));
    }
  }, [usedPeriodsData]);

  // Değerlendirme maddelerini başlat - pozisyon seçildiğinde dinamik sorular yükle
  useEffect(() => {
    console.log('[PIF Debug] positionWithQuestions:', positionWithQuestions);
    console.log('[PIF Debug] isLoadingQuestions:', isLoadingQuestions);
    
    if (positionWithQuestions && positionWithQuestions.categories && positionWithQuestions.categories.length > 0) {
      const items: EvaluationItem[] = [];
      let itemNumber = 1;

      positionWithQuestions.categories.forEach((category: any) => {
        console.log('[PIF Debug] Category:', category.name, 'Questions:', category.questions?.length);
        if (category.questions && Array.isArray(category.questions) && category.questions.length > 0) {
          category.questions.forEach((question: any) => {
            items.push({
              id: `q-${question.id}`,
              category: category.name,
              subcategory: category.name,
              itemNumber,
              description: question.questionText,
              score: 0,
            });
            itemNumber++;
          });
        }
      });

      console.log('[PIF Debug] Total items loaded:', items.length);
      if (items.length > 0) {
        setForm((prev: any) => ({ ...prev, items }));
      }
    } else {
      console.log('[PIF Debug] No categories or empty categories');
    }
  }, [positionWithQuestions]);

  const handleInputChange = (field: string, value: string | number | null) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleItemScoreChange = (itemId: string, score: number) => {
    setForm((prev: any) => ({
      ...prev,
      items: prev.items.map((item: any) =>
        item.id === itemId ? { ...item, score } : item
      ),
    }));
  };

  const calculateTotalScore = () => {
    if (form.items.length === 0) return 0;

    const totalPoints = form.items.reduce((sum: any, item: any) => {
      const scoreValue = item.score || 0;
      // Puan: 1=0, 2=0.5, 3=1, 4=1.5, 5=2
      const points = scoreValue === 1 ? 0 : scoreValue === 2 ? 0.5 : scoreValue === 3 ? 1 : scoreValue === 4 ? 1.5 : scoreValue === 5 ? 2 : 0;
      return sum + points;
    }, 0);

    return Math.round((totalPoints / (form.items.length * 2)) * 100);
  };

  const getEvaluationScale = (score: number) => {
    if (score < 30) return "Yetersiz";
    if (score < 49) return "Gelişime Açık";
    if (score < 69) return "Beklenen";
    if (score < 84) return "İyi";
    return "Çok İyi";
  };

  const handleSave = async () => {
    // Temel alanlar kontrolü
    if (!form.employeeName || !form.employeePosition || !form.evaluationPeriod || !form.employeePositionId || !form.employeeIdNumber) {
      toast.error("Lütfen zorunlu alanları doldurunuz (Sicil No zorunludur)");
      return;
    }

    // Yönetici Görüşü zorunluluğu kontrolü
    if (!form.managerOpinion || form.managerOpinion.trim() === "") {
      toast.error("Yönetici Görüşü yazılması zorunludur");
      return;
    }

    // TÜM SORULARIN CEVAPLANMASI ZORUNLU
    const unansweredQuestions: number[] = [];
    form.items.forEach((item: any) => {
      if (!item.score || item.score === 0) {
        unansweredQuestions.push(item.itemNumber);
      }
    });

    if (unansweredQuestions.length > 0) {
      const questionList = unansweredQuestions.slice(0, 10).join(", ") + (unansweredQuestions.length > 10 ? "..." : "");
      toast.error(`Zorunlu alanları doldurunuz. Cevaplanmayan sorular: ${questionList}`, { duration: 8000 });
      return;
    }

    // 1 veya 5 puan açıklama zorunluluğu kontrolü
    const missingExplanations: string[] = [];
    form.items.forEach((item: any) => {
      if ((item.score === 1 || item.score === 5) && !form.scoreExplanations?.[item.id]) {
        missingExplanations.push(`Soru ${item.itemNumber}: ${item.score === 1 ? "1 puan" : "5 puan"} seçildi ancak açıklama yazılmadı`);
      }
    });

    if (missingExplanations.length > 0) {
      toast.error(`1 veya 5 puan seçildiğinde açıklama yazılması zorunludur:\n${missingExplanations.join("\n")}`, { duration: 8000 });
      return;
    }

    const totalScore = calculateTotalScore();

    // Önceki değerlendirme ile karşılaştır ve uyarı göster
    if (previousEvaluation && previousEvaluation.totalScore) {
      const prevScore = typeof previousEvaluation.totalScore === 'string' ? parseInt(previousEvaluation.totalScore) : previousEvaluation.totalScore;
      const scoreDifference = Math.abs(totalScore - prevScore);
      if (scoreDifference >= 10) {
        const direction = totalScore > prevScore ? "YÜKSELİŞ" : "DÜŞÜŞ";
        const message = `Önceki değerlendirmede ${prevScore} puan vermmiştiniz, şimdi ${totalScore} puan veriyorsunuz (${direction}: ${scoreDifference} puan)`;
        toast.warning(message, { duration: 5000 });
      }
    }
    
    // PDF oluştur ve URL'yi al
    let pdfUrl = "";
    try {
      const evaluationData = {
        id: Date.now(),
        employeeName: form.employeeName,
        employeePosition: form.employeePosition,
        employeeIdNumber: form.employeeIdNumber,
        hireDate: form.hireDate ? new Date(form.hireDate) : undefined,
        evaluationDate: new Date(form.evaluationDate),
        evaluationPeriod: form.evaluationPeriod,
        evaluatedByManager: form.evaluatedByManager,
        totalScore,
        evaluationScale: getEvaluationScale(totalScore),
        managerOpinion: form.managerOpinion,
        items: form.items,
        scoreExplanations: form.scoreExplanations,
      };
      
      // PDF blob oluştur
      const { pdfBlob } = await exportToPDF(evaluationData);
      
      // PDF'i S3'e yükle
      const formData = new FormData();
      formData.append('file', pdfBlob, `Degerlendirme_${form.employeeName}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      // S3 upload endpoint'ine gönder (arka planda)
      // Şimdilik pdfUrl boş bırakıyoruz, sonradan S3 integration eklenecek
      pdfUrl = URL.createObjectURL(pdfBlob);
    } catch (error: any) {
      console.error('PDF oluşturma hatası:', error);
    }
    
    await createEvaluation.mutateAsync({
      branchId: form.branchId || undefined,
      employeeName: form.employeeName,
      employeePosition: form.employeePosition,
      employeeIdNumber: form.employeeIdNumber,
      hireDate: form.hireDate ? form.hireDate : undefined,
      evaluationDate: form.evaluationDate,
      evaluationPeriod: form.evaluationPeriod,
      evaluatedByManager: form.evaluatedByManager,
      items: form.items,
      scoreExplanations: form.scoreExplanations,
      managerOpinion: form.managerOpinion,
      totalScore,
      pdf: pdfUrl || undefined,
    });

    // SharePoint Excel dosyasına senkronize et
    const evaluationScale = getEvaluationScale(totalScore);
    // SharePoint senkronizasyonu kaldırıldı - sadece Excel'e yazılıyor
    // await syncEvaluationToSharePoint(...) - kaldırıldı

    // PDF otomatik indir
    const evaluationData = {
      id: Date.now(),
      employeeName: form.employeeName,
      employeePosition: form.employeePosition,
      employeeIdNumber: form.employeeIdNumber,
      hireDate: form.hireDate ? new Date(form.hireDate) : undefined,
      evaluationDate: new Date(form.evaluationDate),
      evaluationPeriod: form.evaluationPeriod,
      evaluatedByManager: form.evaluatedByManager,
      totalScore,
      evaluationScale: getEvaluationScale(totalScore),
      managerOpinion: form.managerOpinion,
      items: form.items,
    };
    
    // Formu sıfırla
    setForm({
      branchId: null as any,
      employeeName: "",
      employeePosition: "",
      employeePositionId: null as any,
      employeeIdNumber: "",
      hireDate: "",
      evaluationDate: new Date().toISOString().split("T")[0],
      evaluationPeriod: "",
      evaluatedByManager: "",
      managerOpinion: "",
      items: [],
      scoreExplanations: {},
    });
    
    toast.success("PDF başarıyla oluşturuldu");
    
    // Tarayıcı print dialogunu aç (PDF indirme için)
    setTimeout(() => {
      exportToPDF(evaluationData);
    }, 500);
  };

  const handlePdfExport = async () => {
    const totalScore = calculateTotalScore();
    const evaluationScale = getEvaluationScale(totalScore);
    
    exportToPDF({
      id: 0,
      employeeName: form.employeeName,
      employeePosition: form.employeePosition,
      employeeIdNumber: form.employeeIdNumber,
      hireDate: form.hireDate ? new Date(form.hireDate) : undefined,
      evaluationDate: new Date(form.evaluationDate),
      evaluationPeriod: form.evaluationPeriod,
      evaluatedByManager: form.evaluatedByManager,
      totalScore,
      evaluationScale,
      managerOpinion: form.managerOpinion,
      items: form.items,
    });
  };

  const handleExport = () => {
    try {
      // XLSX kütüphanesi kullanarak Excel dosyası oluştur
      const data = [
        ["İK PERFORMANS İZLEME FORMU (PİF)"],
        [],
        ["BAŞLIK BİLGİLERİ"],
        ["Personel Adı Soyadı", form.employeeName],
        ["Görevi/Ünvan", form.employeePosition],
        ["Sicil No", form.employeeIdNumber],
        ["İşe Giriş Tarihi", form.hireDate],
        ["Değerlendirme Tarihi", form.evaluationDate],
        ["Değerlendirme Dönemi", form.evaluationPeriod],
        ["Değerlendiren Yönetici", form.evaluatedByManager],
        [],
        ["DEĞERLENDİRME MADDELERİ"],
        ["Kategori", "Alt Kategori", "Madde No", "Açıklama", "Puan"],
        ...form.items.map((item: any) => [
          item.category,
          item.subcategory,
          item.itemNumber,
          item.description,
          item.score,
        ]),
        [],
        ["YÖNETİCİ GÖRÜŞÜ"],
        [form.managerOpinion],
        [],
        ["DEĞERLENDİRME SONUÇLARI"],
        ["Toplam Puan", calculateTotalScore()],
        ["Değerlendirme Skalası", getEvaluationScale(calculateTotalScore())],
        ["Puan Aralıkları"],
        ["0-30", "Yetersiz"],
        ["30-49", "Gelişime Açık"],
        ["50-69", "Beklenen"],
        ["70-84", "İyi"],
        ["85-100", "Çok İyi"],
      ];

      // CSV formatında oluştur
      const csv = data
        .map((row: any) =>
          row
            .map((cell: any) => {
              const cellStr = String(cell || "");
              // Virgül içeren hücreleri tırnak içine al
              return cellStr.includes(",") ? `"${cellStr}"` : cellStr;
            })
            .join(",")
        )
        .join("\n");

      // Blob oluştur ve indir
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `PIF_${form.employeeName}_${form.evaluationPeriod}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Excel dosyası indirildi");
    } catch (error: any) {
      toast.error("Excel dosyası oluşturulurken hata oluştu");
      console.error(error);
    }
  };

  const totalScore = calculateTotalScore();
  const evaluationScale = getEvaluationScale(totalScore);



  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="dashboard-header">
        <div className="container">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Performans İzleme Formu (PİF)
              </h1>
              <p className="text-muted-foreground">
                Personel performans değerlendirmesi yapın
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => location.href = "/"}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content container max-w-6xl">
        {/* Başlık Bilgileri */}
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle>Başlık Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Şube *
                </label>
                {user?.branchId ? (
                  <div className="px-3 py-2 border border-border rounded-md bg-muted text-foreground">
                    {branches?.find((b: any) => b.id === user.branchId)?.name || "Şube Yükleniyor..."}
                  </div>
                ) : (
                  <select
                    value={form.branchId || ""}
                    onChange={(e: any) => {
                      console.log('[PIF Debug] Şube seçildi:', e.target.value);
                      handleInputChange("branchId", e.target.value ? parseInt(e.target.value) : null);
                    }}
                    className="filter-input"
                  >
                    <option value="">Şube Seçiniz</option>
                    {branches?.map((branch: any) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Personel Adı Soyadı *
                </label>
                <Input
                  value={form.employeeName}
                  onChange={(e: any) => handleInputChange("employeeName", e.target.value)}
                  placeholder="Adı Soyadı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Görevi/Ünvan *
                </label>
                <select
                  value={form.employeePositionId ? String(form.employeePositionId) : ""}
                  onChange={(e: any) => {
                    const value = e.target.value;
                    const posId = value ? parseInt(value) : null;
                    console.log('[PIF Debug] Ünvan seçildi:', posId, 'Value:', value);
                    const pos = positions?.find((p: any) => p.id === posId);
                    console.log('[PIF Debug] Pozisyon bulundu:', pos?.name);
                    handleInputChange("employeePositionId", posId);
                    handleInputChange("employeePosition", pos?.displayName || pos?.name || "");
                  }}
                  className="filter-input"
                >
                  <option value="">Ünvan Seçiniz</option>
                  {positions?.map((position: any) => (
                    <option key={position.id} value={position.id}>
                      {position.displayName || position.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Sicil No (T.C.) *
                </label>
                <Input
                  value={form.employeeIdNumber}
                  onChange={(e: any) => handleInputChange("employeeIdNumber", e.target.value)}
                  placeholder="Sicil Numarası"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  İşe Giriş Tarihi
                </label>
                <Input
                  type="date"
                  value={form.hireDate}
                  onChange={(e: any) => handleInputChange("hireDate", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Değerlendirme Tarihi
                </label>
                <Input
                  type="date"
                  value={form.evaluationDate}
                  onChange={(e: any) => handleInputChange("evaluationDate", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Değerlendirme Dönemi *
                </label>
                <select
                  value={form.evaluationPeriod}
                  onChange={(e: any) => handleInputChange("evaluationPeriod", e.target.value)}
                  className="filter-input"
                >
                  <option value="">Seçiniz</option>
                  {EVALUATION_PERIODS.map((period: any) => (
                    <option
                      key={period}
                      value={period}
                    >
                      {period}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Değerlendiren Yönetici
                </label>
                <Input
                  value={form.evaluatedByManager}
                  onChange={(e: any) => handleInputChange("evaluatedByManager", e.target.value)}
                  placeholder="Yönetici Adı"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Değerlendirme Maddeleri */}
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle>Değerlendirme Maddeleri {isLoadingQuestions && "(Yükleniyor...)"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {form.items.length > 0 ? (
                form.items.map((item, index) => (
                  <div key={item.id} className="border border-border rounded p-4 bg-card">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {item.itemNumber}. {item.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mb-3">
                      {[1, 2, 3, 4, 5].map((score: any) => (
                        <button
                          key={score}
                          onClick={() => handleItemScoreChange(item.id, score)}
                          className={`px-3 py-2 rounded border text-sm font-medium transition-colors ${
                            item.score === score
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-foreground hover:border-primary"
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    {(item.score === 1 || item.score === 5) && (
                      <div className="mt-3 p-3 bg-muted rounded border border-border">
                        <label className="block text-sm font-medium text-foreground mb-2">
                          {item.score === 1 ? "Neden 1 puan verildi?" : "Neden 5 puan verildi?"} *
                        </label>
                        <Textarea
                          value={form.scoreExplanations[item.id] || ""}
                          onChange={(e: any) => {
                            setForm(prev => ({
                              ...prev,
                              scoreExplanations: {
                                ...prev.scoreExplanations,
                                [item.id]: e.target.value
                              }
                            }));
                          }}
                          placeholder="Açıklama yazınız..."
                          rows={2}
                          className="text-sm"
                        />
                        {!form.scoreExplanations[item.id] && (
                          <p className="text-xs text-red-600 mt-1">Bu alan zorunludur</p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">Henüz soru yüklenmedi. Lütfen ünvan seçiniz.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Yönetici Görüşü */}
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle>Yönetici Görüşü</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={form.managerOpinion}
              onChange={(e: any) => handleInputChange("managerOpinion", e.target.value)}
              placeholder="Yönetici görüşü ve önerileri..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Sonuçlar */}
        <Card className="border-border mb-6 bg-card">
          <CardHeader>
            <CardTitle>Değerlendirme Sonuçları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-background p-4 rounded border border-border">
                <p className="text-sm text-muted-foreground mb-1">Toplam Puan</p>
                <p className="text-3xl font-bold text-primary">{totalScore}%</p>
              </div>
              <div className="bg-background p-4 rounded border border-border">
                <p className="text-sm text-muted-foreground mb-1">Değerlendirme Skalası</p>
                <p className="text-3xl font-bold text-primary">{evaluationScale}</p>
              </div>
              <div className="bg-background p-4 rounded border border-border">
                <p className="text-sm text-muted-foreground mb-1">Toplam Madde</p>
                <p className="text-3xl font-bold text-primary">{form.items.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Değerlendirme Skalası Tablosu */}
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle>Değerlendirme Skalası</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-2 text-left font-semibold">Puan</th>
                    <th className="border border-border px-4 py-2 text-left font-semibold">Toplam Puan</th>
                    <th className="border border-border px-4 py-2 text-left font-semibold">Skala</th>
                    <th className="border border-border px-4 py-2 text-left font-semibold">Tanım</th>
                    <th className="border border-border px-4 py-2 text-left font-semibold">Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-4 py-2">1</td>
                    <td className="border border-border px-4 py-2">0-30</td>
                    <td className="border border-border px-4 py-2"><span className="px-2 py-1 bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100 rounded">Yetersiz</span></td>
                    <td className="border border-border px-4 py-2">Beklenen davranışı göstermiyorum.</td>
                    <td className="border border-border px-4 py-2 text-sm">Yetkinlik göstergelerini gözlemlenmiyor veya nadiren görülüyor. Gelişim ihtiyacı belirgin.</td>
                  </tr>
                  <tr className="bg-muted/50">
                    <td className="border border-border px-4 py-2">2</td>
                    <td className="border border-border px-4 py-2">30-49</td>
                    <td className="border border-border px-4 py-2"><span className="px-2 py-1 bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-100 rounded">Gelişime Açık</span></td>
                    <td className="border border-border px-4 py-2">Zaman zaman gösteriyor.</td>
                    <td className="border border-border px-4 py-2 text-sm">Yetkinlik bazı durumlarda gözlemeniyor ama tutarlı değil. Destek ve yönlendirme gerekiyor.</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">3</td>
                    <td className="border border-border px-4 py-2">50-69</td>
                    <td className="border border-border px-4 py-2"><span className="px-2 py-1 bg-yellow-100 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100 rounded">Beklenen</span></td>
                    <td className="border border-border px-4 py-2">Beklenen düzeyde davranış sergiliyor.</td>
                    <td className="border border-border px-4 py-2 text-sm">Yetkinlik göstergelerini tutarlı şekilde gözlemeniyor. Görevi başarıyla yerine getiriyor.</td>
                  </tr>
                  <tr className="bg-muted/50">
                    <td className="border border-border px-4 py-2">4</td>
                    <td className="border border-border px-4 py-2">70-84</td>
                    <td className="border border-border px-4 py-2"><span className="px-2 py-1 bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100 rounded">İyi</span></td>
                    <td className="border border-border px-4 py-2">Beklenin üzerinde davranış sergiliyor.</td>
                    <td className="border border-border px-4 py-2 text-sm">Yetkinlik göstergelerini çoğunlukla yüksek düzeyde ve örnek teşkil ediyor.</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">5</td>
                    <td className="border border-border px-4 py-2">85-100</td>
                    <td className="border border-border px-4 py-2"><span className="px-2 py-1 bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-100 rounded">Çok İyi</span></td>
                    <td className="border border-border px-4 py-2">Üst düzeyde ve sürekli olarak sergiliyor.</td>
                    <td className="border border-border px-4 py-2 text-sm">Yetkinlikte uzman, başkalarına mentorluk yapabilecek düzeyde. Katma değer yaratıyor.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Puan Aralıkları */}
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle>Puan Aralıkları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <div className="bg-red-50 dark:bg-red-950 p-3 rounded">
                <p className="text-xs font-semibold text-red-700 dark:text-red-200">0-30</p>
                <p className="text-sm font-bold text-red-900 dark:text-red-100">Yetersiz</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded">
                <p className="text-xs font-semibold text-orange-700 dark:text-orange-200">30-49</p>
                <p className="text-sm font-bold text-orange-900 dark:text-orange-100">Gelişıme Açık</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded">
                <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-200">50-69</p>
                <p className="text-sm font-bold text-yellow-900 dark:text-yellow-100">Beklenen</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-200">70-84</p>
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100">İyi</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded">
                <p className="text-xs font-semibold text-green-700 dark:text-green-200">85-100</p>
                <p className="text-sm font-bold text-green-900 dark:text-green-100">Çok İyi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Butonlar */}
        <div className="flex gap-2 mb-6">
          {(() => {
            const allAnswered = form.items.length > 0 && form.items.every((item: any) => item.score && item.score > 0);
            const hasManagerOpinion = form.managerOpinion && form.managerOpinion.trim() !== "";
            const allExplanationsProvided = form.items.every((item: any) => {
              if (item.score === 1 || item.score === 5) {
                return form.scoreExplanations?.[item.id];
              }
              return true;
            });
            const isFormValid = allAnswered && hasManagerOpinion && allExplanationsProvided;
            
            return (
              <Button
                onClick={handleSave}
                disabled={!isFormValid || createEvaluation.isPending}
                className="flex items-center gap-2"
                title={!isFormValid ? "Tüm alanları ve soruları doldurunuz" : ""}
              >
                <Save className="w-4 h-4" />
                {createEvaluation.isPending ? "Kaydediliyor..." : "Kaydet ve PDF Yazdır"}
              </Button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
