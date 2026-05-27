import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Home } from "lucide-react";
import { trpc } from "@/lib/trpc";

const CRITERIA = [
  "Teknik ve mesleki bilgi",
  "Yöneticileriyle iletişim",
  "İş arkadaşları ile iletişim becerisi ve işbirliği içinde çalışma",
  "Şirketi temsil yeteneği (kılık kıyafet, genel görünüm vb.)",
  "Verilen işi doğru bir şekilde ve zamanında yerine getirme, iş disiplini",
  "Şirket kural ve talimatlarına uyma",
  "Araştırmaya ve öğrenmeye ilgisi",
  "Sorumluluk alma ve işi sahiplenme",
  "İşe değer katma, yeni fikirler üretme",
  "Değişen koşullara uyum sağlama, esneklik",
  "Olumlu, yapıcı ve pozitif yaklaşım",
  "Etkin planlama ve zaman yönetimi",
  "İşe adapte olma ve motive çalışma",
  "Muhakeme yeteneği",
  "Etik ve dürüst çalışma",
];

const COMPETENCIES = [
  "Analiz Etme ve Problem Çözme",
  "Görev Bilinci",
  "İletişim Becerisi",
  "Kalite Odaklılık",
  "Takım Çalışması ve İşbirliği",
];

const SCORE_SCALE = {
  5: { label: "Çok İyi", range: "85-100" },
  4: { label: "İyi", range: "70-84" },
  3: { label: "Beklenen", range: "50-69" },
  2: { label: "Gelişime Açık", range: "30-49" },
  1: { label: "Yetersiz", range: "0-29" },
};

const COMPETENCY_DEFINITIONS: Record<string, string> = {
  "Analiz Etme ve Problem Çözme": "Problemi etkili bir şekilde çözümlemek için problemin asıl nedenlerini zamanında belirlemek, bu nedenleri değerlemek ve yenilikçi çözüm alternatifleri geliştirmek.",
  "Görev Bilinci": "Kurum kültürüne uygun hareket etmek, kurumun misyon, vizyon ve temel değerlerini benimsemek, etik ve dürüst davranmak.",
  "İletişim Becerisi": "Kişinin iletişim süreçlerini anlama, yorumlama, tepki verme ve uygun şekilde yanıt verme yeteneğini içerir.",
  "Kalite Odaklılık": "Yüksek kalite için zorlayıcı standartlar belirlemek, bu standartlara uygun hareket etmek; sistem kurmak, dokümantasyon oluşturmak.",
  "Takım Çalışması ve İşbirliği": "Organizasyonel hedeflere ulaşmada ve görev paylaşımında; takımın üyeleri ile iş birliğinde olmak, dayanışma içerisinde çalışabilmek.",
};

export default function ProbationEvaluationForm() {
  const [, navigate] = useLocation();
  const { data: authData } = (trpc as any).auth.me.useQuery();
  const { data: branches } = (trpc as any).branches.list.useQuery();
  const saveMutation = (trpc as any).probationEvaluation.save.useMutation();

  const [formData, setFormData] = useState({
    employeeTCNumber: "",
    employeeName: "",
    branch: "",
    department: "",
    hireDate: "",
    evaluationType: "1.5_months" as "1.5_months" | "5.5_months",
  });

  const [scores, setScores] = useState<Record<string, number>>({});
  const [continueEmployment, setContinueEmployment] = useState<boolean | null>(null);
  const [continueEmploymentReason, setContinueEmploymentReason] = useState("");
  const [managerOpinion, setManagerOpinion] = useState("");
  const [evaluatedBy, setEvaluatedBy] = useState("");
  const [evaluatedByDate, setEvaluatedByDate] = useState("");
  const [evaluatedBySecond, setEvaluatedBySecond] = useState("");
  const [evaluatedBySecondDate, setEvaluatedBySecondDate] = useState("");
  const [hrReviewedBy, setHrReviewedBy] = useState("");
  const [hrReviewedByDate, setHrReviewedByDate] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [successPercentage, setSuccessPercentage] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (authData?.branchName) {
      setFormData((prev: any) => ({ ...prev, branch: authData.branchName }));
    }
  }, [authData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleScoreChange = (criterion: string, score: number) => {
    setScores((prev: any) => ({ ...prev, [criterion]: score }));
  };

  const calculateResults = () => {
    const allItems = [...CRITERIA, ...COMPETENCIES];
    const allScored = allItems.every((item: any) => scores[item] !== undefined && scores[item] > 0);

    if (!allScored) {
      alert("Lütfen tüm kriterleri puanlandırınız");
      return;
    }

    const totalScore = Object.values(scores).reduce((sum: any, score: any) => sum + score, 0);
    const maxScore = allItems.length * 5;
    const percentage = Math.round((totalScore / maxScore) * 100);

    setSuccessPercentage(percentage);
    setContinueEmployment(percentage >= 55);
    setShowResults(true);
  };

  const handleSave = async () => {
    if (!formData.employeeTCNumber || !formData.employeeName) {
      alert("Lütfen TC No ve Personel Adını doldurunuz");
      return;
    }

    if (!formData.branch) {
      alert("Lütfen şubeyi seçiniz");
      return;
    }

    setIsSaving(true);
    try {
      await saveMutation.mutateAsync({
        employeeTCNumber: formData.employeeTCNumber.trim(),
        employeeName: formData.employeeName,
        branch: formData.branch,
        department: formData.department,
        hireDate: formData.hireDate,
        evaluationType: formData.evaluationType,
        evaluationMonth: new Date().toISOString().split("T")[0],
        scores,
        successPercentage,
        continueEmployment: continueEmployment || false,
        comments: managerOpinion,
        evaluatedBy: evaluatedBy || authData?.user?.name,
        evaluatedBySecond,
      });

      alert("Değerlendirme başarıyla kaydedildi!");
      // Formu sıfırla
      setShowResults(false);
      setScores({});
      setFormData({
        employeeTCNumber: "",
        employeeName: "",
        branch: authData?.user?.branchName || "",
        department: "",
        hireDate: "",
        evaluationType: "1.5_months",
      });
      setContinueEmploymentReason("");
      setManagerOpinion("");
      setEvaluatedBy("");
      setEvaluatedByDate("");
      setEvaluatedBySecond("");
      setEvaluatedBySecondDate("");
      setHrReviewedBy("");
      setHrReviewedByDate("");
    } catch (error: any) {
      console.error("Kaydetme hatası:", error);
      alert("Değerlendirme kaydedilirken hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  if (!showResults) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Deneme Süresi Değerlendirme Formu</h1>
            <Button variant="outline" onClick={() => navigate("/")}>
              <Home className="w-4 h-4 mr-2" />
              Ana Sayfa
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Doküman No: IKY.P.01_f11 | Revizyon No: 1 | Revizyon Tarihi: 10.12.2025</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personel Bilgileri */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Personel Bilgileri</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>TC Numarası *</Label>
                    <Input
                      value={formData.employeeTCNumber}
                      onChange={(e: any) => handleInputChange("employeeTCNumber", e.target.value)}
                      placeholder="11 haneli TC No"
                      maxLength={11}
                    />
                  </div>
                  <div>
                    <Label>Personel Adı Soyadı *</Label>
                    <Input
                      value={formData.employeeName}
                      onChange={(e: any) => handleInputChange("employeeName", e.target.value)}
                      placeholder="Adı soyadı"
                    />
                  </div>
                  <div>
                    <Label>Şube *</Label>
                    <Select value={formData.branch} onValueChange={(val: any) => handleInputChange("branch", val)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {branches?.map((branch: any) => (
                          <SelectItem key={branch.id} value={branch.name}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Bölümü-Şubesi / Görevi</Label>
                    <Input
                      value={formData.department}
                      onChange={(e: any) => handleInputChange("department", e.target.value)}
                      placeholder="Bölüm veya görev"
                    />
                  </div>
                  <div>
                    <Label>İşe Giriş Tarihi</Label>
                    <Input
                      type="date"
                      value={formData.hireDate}
                      onChange={(e: any) => handleInputChange("hireDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Değerlendirme Dönemi *</Label>
                    <Select value={formData.evaluationType} onValueChange={(val: any) => handleInputChange("evaluationType", val)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1.5_months">İşe girişten 1,5 ay sonra</SelectItem>
                        <SelectItem value="5.5_months">İşe girişten 5,5 ay sonra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Puanlama Skala Bilgisi */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Puanlama Skala Bilgisi</h3>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(SCORE_SCALE).map(([score, info]) => (
                    <div key={score} className="p-3 border rounded text-center">
                      <div className="text-2xl font-bold">{score}</div>
                      <div className="text-sm font-semibold">{info.label}</div>
                      <div className="text-xs text-gray-500">%{info.range}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Değerlendirme Kriterleri */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Değerlendirme Kriterleri (15 Madde)</h3>
                <div className="space-y-2">
                  {CRITERIA.map((criterion, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm flex-1">{idx + 1}. {criterion}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((score: any) => (
                          <Button
                            key={score}
                            variant={scores[criterion] === score ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleScoreChange(criterion, score)}
                            className="w-8 h-8 p-0"
                          >
                            {score}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Temel Yetkinlikler */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Temel Yetkinlikler (5 Madde)</h3>
                <div className="space-y-4">
                  {COMPETENCIES.map((comp, idx) => (
                    <div key={idx} className="border rounded p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="font-semibold">{idx + 1}. {comp}</span>
                          <p className="text-xs text-gray-600 mt-1">{COMPETENCY_DEFINITIONS[comp]}</p>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((score: any) => (
                            <Button
                              key={score}
                              variant={scores[comp] === score ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleScoreChange(comp, score)}
                              className="w-8 h-8 p-0"
                            >
                              {score}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Başarı Yüzdesi */}
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm">
                  <span className="font-semibold">Başarı yüzdesinin;</span> %55 ve üzeri personel görevine devam edebilir.
                </p>
              </div>

              {/* Devam Kararı */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Bu kişiyle çalışmaya devam etmek ister misiniz?</h3>
                <div className="flex gap-4">
                  <Button
                    variant={continueEmployment === true ? "default" : "outline"}
                    onClick={() => setContinueEmployment(true)}
                  >
                    Evet
                  </Button>
                  <Button
                    variant={continueEmployment === false ? "default" : "outline"}
                    onClick={() => setContinueEmployment(false)}
                  >
                    Hayır
                  </Button>
                </div>
              </div>

              {/* Hayır Cevabı Açıklaması */}
              {continueEmployment === false && (
                <div>
                  <Label>Cevabınız hayır ise detaylı olarak açıklayınız</Label>
                  <Textarea
                    value={continueEmploymentReason}
                    onChange={(e: any) => setContinueEmploymentReason(e.target.value)}
                    placeholder="Detaylı açıklama..."
                    rows={3}
                  />
                </div>
              )}

              {/* Yönetici Görüşü */}
              <div>
                <Label>Yönetici Görüşü</Label>
                <Textarea
                  value={managerOpinion}
                  onChange={(e: any) => setManagerOpinion(e.target.value)}
                  placeholder="Yönetici görüşü..."
                  rows={3}
                />
              </div>

              {/* İmza Bölümleri */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">İmzalar</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs">Değerlendirilen Çalışan</Label>
                    <Input placeholder="Adı Soyadı" className="text-xs" />
                    <Input type="date" className="text-xs mt-1" />
                    <div className="border-t-2 border-gray-400 mt-4 h-12"></div>
                  </div>
                  <div>
                    <Label className="text-xs">1. Amir</Label>
                    <Input
                      value={evaluatedBy}
                      onChange={(e: any) => setEvaluatedBy(e.target.value)}
                      placeholder="Adı Soyadı"
                      className="text-xs"
                    />
                    <Input
                      type="date"
                      value={evaluatedByDate}
                      onChange={(e: any) => setEvaluatedByDate(e.target.value)}
                      className="text-xs mt-1"
                    />
                    <div className="border-t-2 border-gray-400 mt-4 h-12"></div>
                  </div>
                  <div>
                    <Label className="text-xs">2. Amir</Label>
                    <Input
                      value={evaluatedBySecond}
                      onChange={(e: any) => setEvaluatedBySecond(e.target.value)}
                      placeholder="Adı Soyadı"
                      className="text-xs"
                    />
                    <Input
                      type="date"
                      value={evaluatedBySecondDate}
                      onChange={(e: any) => setEvaluatedBySecondDate(e.target.value)}
                      className="text-xs mt-1"
                    />
                    <div className="border-t-2 border-gray-400 mt-4 h-12"></div>
                  </div>
                  <div>
                    <Label className="text-xs">İnsan Kaynakları</Label>
                    <Input
                      value={hrReviewedBy}
                      onChange={(e: any) => setHrReviewedBy(e.target.value)}
                      placeholder="Adı Soyadı"
                      className="text-xs"
                    />
                    <Input
                      type="date"
                      value={hrReviewedByDate}
                      onChange={(e: any) => setHrReviewedByDate(e.target.value)}
                      className="text-xs mt-1"
                    />
                    <div className="border-t-2 border-gray-400 mt-4 h-12"></div>
                  </div>
                </div>
              </div>

              <Button onClick={calculateResults} className="w-full" size="lg">
                Sonuçları Hesapla
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Değerlendirme Sonuçları</h1>
          <Button variant="outline" onClick={() => navigate("/")}>
            <Home className="w-4 h-4 mr-2" />
            Ana Sayfa
          </Button>
        </div>

        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div className={`p-4 rounded text-center ${continueEmployment ? "bg-green-100" : "bg-red-100"}`}>
                <p className="text-sm font-semibold">Karar</p>
                <p className="text-lg font-bold">
                  {continueEmployment ? "Görevine Devam Edebilir" : "Görevine Devam Edemez"}
                </p>
              </div>
              <div className="p-4 rounded text-center bg-blue-100">
                <p className="text-sm font-semibold">Başarı Yüzdesi</p>
                <p className="text-3xl font-bold text-blue-600">%{successPercentage}</p>
              </div>
              <div className="p-4 rounded text-center bg-purple-100">
                <p className="text-sm font-semibold">Başarı Sınırı</p>
                <p className="text-lg font-bold text-purple-600">%55</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setShowResults(false)}
                variant="outline"
                className="flex-1"
              >
                Geri Dön
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? "Kaydediliyor..." : "Kaydet ve Tamamla"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
