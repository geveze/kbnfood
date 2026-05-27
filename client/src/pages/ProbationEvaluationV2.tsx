import { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle, Download, FileText, TrendingUp, TrendingDown } from "lucide-react";
// import html2pdf from 'html2pdf.js';
const html2pdf = (window as any).html2pdf;

// Değerlendirme kriterleri
const EVALUATION_CRITERIA = [
  "Teknik ve mesleki bilgi",
  "İş kalitesi ve doğruluğu",
  "Hız ve verimlilik",
  "Sorumluluk ve güvenilirlik",
  "Takım çalışması",
  "İletişim becerisi",
  "Müşteri hizmet anlayışı",
  "Problem çözme yeteneği",
  "Öğrenme kapasitesi",
  "Kurallara uyma",
  "Disiplin",
  "Motivasyon",
  "Esneklik",
  "İnisiyatif",
  "Liderlik potansiyeli",
];

const COMPETENCIES = [
  "Teknik Yetkinlik",
  "Yönetim Yetkinliği",
  "İletişim Yetkinliği",
  "Kişisel Gelişim",
  "Etik ve Değerler",
];

const SCORE_OPTIONS = [
  { value: 1, label: "1 - Zayıf" },
  { value: 2, label: "2 - Yetersiz" },
  { value: 3, label: "3 - Yeterli" },
  { value: 4, label: "4 - İyi" },
  { value: 5, label: "5 - Mükemmel" },
];

interface Score {
  name: string;
  score: number | null;
  type: "criteria" | "competency";
}

export default function ProbationEvaluationV2() {
  const [formData, setFormData] = useState({
    employeeName: "",
    employeeTCNumber: "",
    employeeRegistrationNumber: "",
    branch: "",
    position: "",
    evaluationType: "1.5_months",
    evaluationDate: new Date().toISOString().split("T")[0],
    evaluatedBy: "",
    continueEmploymentReason: "",
    overallComments: "",
  });

  const [scores, setScores] = useState<Score[]>([
    ...EVALUATION_CRITERIA.map((name: any) => ({ name, score: null, type: "criteria" as const })),
    ...COMPETENCIES.map((name: any) => ({ name, score: null, type: "competency" as const })),
  ]);

  const [continueEmployment, setContinueEmployment] = useState<boolean | null>(null);
  const [successPercentage, setSuccessPercentage] = useState(0);
  const [previousEvaluations, setPreviousEvaluations] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const { data: authData } = (trpc as any).auth.me.useQuery();
  const saveMutation = (trpc as any).probationEvaluation.create.useMutation();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleScoreChange = (index: number, score: number | null) => {
    const newScores = [...scores];
    newScores[index].score = score;
    setScores(newScores);
  };

  const calculateResults = () => {
    const allScored = scores.every((s: any) => s.score !== null);
    if (!allScored) {
      alert("Lütfen tüm kriterleri puanlandırınız");
      return;
    }

    const totalScore = scores.reduce((sum: any, s: any) => sum + (s.score || 0), 0);
    const maxScore = scores.length * 5;
    const percentage = Math.round((totalScore / maxScore) * 100);

    setSuccessPercentage(percentage);
    setContinueEmployment(percentage >= 55);
    setShowResults(true);
  };

  const handleSaveAndPDF = async () => {
    if (!formData.employeeTCNumber || !formData.employeeName) {
      alert("Lütfen TC Numarası ve Personel Adını doldurunuz");
      return;
    }

    try {
      // Verileri kaydet
      await saveMutation.mutateAsync({
        employeeId: 0,
        employeeTCNumber: formData.employeeTCNumber,
        employeeName: formData.employeeName,
        employeeRegistrationNumber: formData.employeeRegistrationNumber,
        department: formData.branch,
        position: formData.position,
        evaluationType: formData.evaluationType as "1.5_months" | "5.5_months" | "on_hire",
        evaluatedBy: formData.evaluatedBy,
        continueEmployment,
        continueEmploymentReason: formData.continueEmploymentReason,
        successPercentage: successPercentage.toString(),
        overallComments: formData.overallComments,
        branchId: 0,
      });

      // PDF oluştur
      if (pdfRef.current) {
        const element = pdfRef.current;
        const opt = {
          margin: 10,
          filename: `Deneme_Suresi_Degerlendirme_${formData.employeeTCNumber}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
        };
        html2pdf().set(opt).from(element).save();
      }

      alert("Değerlendirme başarıyla kaydedildi ve PDF indirildi!");
    } catch (error: any) {
      console.error("Error:", error);
      alert("Hata oluştu");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Deneme Süresi Değerlendirme Formu</h1>
          <p className="text-muted-foreground mt-2">1,5 Ay ve 5,5 Ay Değerlendirmesi</p>
        </div>

        <div ref={pdfRef} className="space-y-6 bg-white p-8 rounded-lg border">
          {/* Personel Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle>Personel Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label>Personel Adı Soyadı *</Label>
                <Input
                  value={formData.employeeName}
                  onChange={(e: any) => handleInputChange("employeeName", e.target.value)}
                  placeholder="Adı Soyadı"
                />
              </div>
              <div>
                <Label>TC Numarası (11 haneli) *</Label>
                <Input
                  value={formData.employeeTCNumber}
                  onChange={(e: any) => handleInputChange("employeeTCNumber", e.target.value)}
                  placeholder="TC No"
                  maxLength={11}
                />
              </div>
              <div>
                <Label>Sicil No</Label>
                <Input
                  value={formData.employeeRegistrationNumber}
                  onChange={(e: any) => handleInputChange("employeeRegistrationNumber", e.target.value)}
                  placeholder="Sicil No"
                />
              </div>
              <div>
                <Label>Şube</Label>
                <Input
                  value={formData.branch}
                  onChange={(e: any) => handleInputChange("branch", e.target.value)}
                  placeholder="Şube"
                  disabled
                />
              </div>
              <div>
                <Label>Görevi</Label>
                <Input
                  value={formData.position}
                  onChange={(e: any) => handleInputChange("position", e.target.value)}
                  placeholder="Görevi"
                />
              </div>
              <div>
                <Label>Değerlendirme Dönemi</Label>
                <Select value={formData.evaluationType} onValueChange={(value: any) => handleInputChange("evaluationType", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_hire">İşe Giriş</SelectItem>
                    <SelectItem value="1.5_months">1,5 Ay</SelectItem>
                    <SelectItem value="5.5_months">5,5 Ay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Değerlendirme Kriterleri */}
          <Card>
            <CardHeader>
              <CardTitle>Değerlendirme Kriterleri</CardTitle>
              <CardDescription>Her kriteri 1-5 arasında puanlandırınız</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3">Değerlendirme Kriterleri (15 madde)</h4>
                <div className="grid grid-cols-2 gap-3">
                  {scores
                    .filter((s: any) => s.type === "criteria")
                    .map((score, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Label className="flex-1 text-sm">{score.name}</Label>
                        <Select
                          value={score.score?.toString() || ""}
                          onValueChange={(value: any) => {
                            const actualIdx = scores.findIndex((s: any) => s.name === score.name);
                            handleScoreChange(actualIdx, parseInt(value));
                          }}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue placeholder="Puan" />
                          </SelectTrigger>
                          <SelectContent>
                            {SCORE_OPTIONS.map((opt: any) => (
                              <SelectItem key={opt.value} value={opt.value.toString()}>
                                {opt.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Temel Yetkinlikler (5 madde)</h4>
                <div className="grid grid-cols-2 gap-3">
                  {scores
                    .filter((s: any) => s.type === "competency")
                    .map((score, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Label className="flex-1 text-sm">{score.name}</Label>
                        <Select
                          value={score.score?.toString() || ""}
                          onValueChange={(value: any) => {
                            const actualIdx = scores.findIndex((s: any) => s.name === score.name);
                            handleScoreChange(actualIdx, parseInt(value));
                          }}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue placeholder="Puan" />
                          </SelectTrigger>
                          <SelectContent>
                            {SCORE_OPTIONS.map((opt: any) => (
                              <SelectItem key={opt.value} value={opt.value.toString()}>
                                {opt.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Devam Kararı */}
          <Card>
            <CardHeader>
              <CardTitle>Devam Kararı</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Bu personelle çalışmaya devam etmek ister misiniz?</Label>
                <div className="flex gap-4 mt-2">
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

              {continueEmployment === false && (
                <div>
                  <Label>Hayır ise gerekçe</Label>
                  <Textarea
                    value={formData.continueEmploymentReason}
                    onChange={(e: any) => handleInputChange("continueEmploymentReason", e.target.value)}
                    placeholder="Gerekçeyi açıklayınız"
                  />
                </div>
              )}

              <div>
                <Label>Genel Görüş / Yorum</Label>
                <Textarea
                  value={formData.overallComments}
                  onChange={(e: any) => handleInputChange("overallComments", e.target.value)}
                  placeholder="Genel görüş ve önerilerinizi yazınız"
                />
              </div>

              <div>
                <Label>Değerlendiren Kişi</Label>
                <Input
                  value={formData.evaluatedBy}
                  onChange={(e: any) => handleInputChange("evaluatedBy", e.target.value)}
                  placeholder="Değerlendiren adı"
                />
              </div>
            </CardContent>
          </Card>

          {/* Sonuç */}
          {showResults && (
            <Card className={continueEmployment ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {continueEmployment ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <span className="text-green-600">Başarılı</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-6 h-6 text-red-600" />
                      <span className="text-red-600">Başarısız</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm font-medium">Başarı Yüzdesi</p>
                  <p className="text-3xl font-bold">%{successPercentage}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Başarı Kriteri</p>
                  <p className="text-3xl font-bold">%55</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Devam Kararı</p>
                  <p className="text-3xl font-bold">{continueEmployment ? "Evet" : "Hayır"}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Butonlar */}
        <div className="flex gap-4">
          {!showResults ? (
            <Button onClick={calculateResults} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Sonuçları Hesapla
            </Button>
          ) : (
            <>
              <Button onClick={handleSaveAndPDF} className="flex-1 bg-green-600 hover:bg-green-700">
                <FileText className="w-4 h-4 mr-2" />
                Kaydet ve PDF Yazdır
              </Button>
              <Button onClick={() => setShowResults(false)} variant="outline" className="flex-1">
                Geri Dön
              </Button>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
