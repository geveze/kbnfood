import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useRouter } from "wouter";
import { ProbationEvaluationPrint } from "./ProbationEvaluationPrint";

// Değerlendirme kriterleri
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

// Temel yetkinlikler
const COMPETENCIES = [
  "Analiz Etme ve Problem Çözme",
  "Görev Bilinci",
  "İletişim Becerisi",
  "Kalite Odaklılık",
  "Takım Çalışması ve İşbirliği",
];

// Puanlama skalası
const SCALE = [
  { value: 1, label: "Yetersiz", color: "bg-red-100" },
  { value: 2, label: "Gelişime Açık", color: "bg-orange-100" },
  { value: 3, label: "Beklenen", color: "bg-yellow-100" },
  { value: 4, label: "İyi", color: "bg-blue-100" },
  { value: 5, label: "Çok İyi", color: "bg-green-100" },
];

type FormData = {
  employeeTCNumber: string;
  employeeName: string;
  branchName: string;
  department: string;
  hireDate: string;
  evaluationPeriod: "1.5_months" | "5.5_months";
  evaluationDate: string;
  criteria: number[];
  competencies: number[];
  continueEmployment: boolean;
  continueEmploymentReason: string;
  managerOpinion: string;
  overallComments: string;
};

export function ProbationEvaluation() {
  const router = useRouter();
  const { user } = useAuth();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      criteria: Array(15).fill(0),
      competencies: Array(5).fill(0),
      evaluationDate: new Date().toISOString().split("T")[0],
      branchName: "",
    },
  });

  const [showResults, setShowResults] = useState(false);
  const [showPreviousEvaluations, setShowPreviousEvaluations] = useState(false);
  const [calculatedResults, setCalculatedResults] = useState<any>(null);
  const [printData, setPrintData] = useState<any>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Şube adını user bilgisinden otomatik doldur
  useEffect(() => {
    if (user?.branchName) {
      setValue("branchName", user.branchName);
    }
  }, [user?.branchName, setValue]);

  const formData = watch();
  const createMutation = (trpc as any).probationEvaluation.create.useMutation();
  const getPreviousMutation = (trpc as any).probationEvaluation.getPreviousEvaluations.useQuery(
    { employeeTCNumber: formData.employeeTCNumber },
    { enabled: !!formData.employeeTCNumber }
  );



  // Sonuçları hesapla
  const handleCalculateResults = () => {
    const allScores = [...formData.criteria, ...formData.competencies].filter((s) => s > 0);

    if (allScores.length === 0) {
      toast.error("Lütfen en az bir kriteri puanlandırınız");
      return;
    }

    const totalScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
    const successPercentage = Math.round((totalScore / 5) * 100);
    const avgCriteria = Math.round(formData.criteria.filter((s) => s > 0).reduce((a, b) => a + b, 0) / formData.criteria.filter((s) => s > 0).length);
    const avgCompetencies = Math.round(formData.competencies.filter((s) => s > 0).reduce((a, b) => a + b, 0) / formData.competencies.filter((s) => s > 0).length);

    const result = {
      totalScore,
      successPercentage,
      avgCriteria,
      avgCompetencies,
      recommendation: totalScore >= 4 ? "Uygun" : totalScore >= 3 ? "Koşullu Uygun" : "Uygun Değil",
    };

    setCalculatedResults(result);
    setShowResults(true);
  };

  // Kaydet ve PDF Yazdır
  const handleSaveAndPrint = async () => {
    try {
      const payload = {
        employeeTCNumber: formData.employeeTCNumber,
        employeeName: formData.employeeName,
        branchName: formData.branchName,
        department: formData.department,
        hireDate: formData.hireDate,
        evaluationPeriod: formData.evaluationPeriod,
        evaluationDate: formData.evaluationDate,
        criteria: formData.criteria,
        competencies: formData.competencies,
        continueEmployment: formData.continueEmployment,
        continueEmploymentReason: formData.continueEmploymentReason,
        managerOpinion: formData.managerOpinion,
        overallComments: formData.overallComments,
      };

      await createMutation.mutateAsync(payload);
      toast.success("Değerlendirme başarıyla kaydedildi!");

      setPrintData({
        ...formData,
        ...calculatedResults,
      });
      setShowPrintPreview(true);
    } catch (error: any) {
      toast.error(error.message || "Kaydetme sırasında hata oluştu");
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Deneme Süresi Değerlendirmesi</h1>
        <p className="text-gray-600 mt-2">Yeni işe alınan personelin performansını değerlendirin</p>
      </div>

      <form onSubmit={handleSubmit(handleSaveAndPrint)} className="space-y-6">
        {/* Çalışan Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle>Çalışan Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>TC Numarası *</Label>
                <Input {...register("employeeTCNumber", { required: "TC Numarası zorunludur" })} placeholder="11 haneli TC No" />
                {errors.employeeTCNumber && <span className="text-red-500 text-sm">{errors.employeeTCNumber.message}</span>}
              </div>
              <div>
                <Label>Adı Soyadı *</Label>
                <Input {...register("employeeName", { required: "Adı soyadı zorunludur" })} placeholder="Personel adı soyadı" />
                {errors.employeeName && <span className="text-red-500 text-sm">{errors.employeeName.message}</span>}
              </div>
              <div>
                <Label>Şube *</Label>
                <Input {...register("branchName", { required: "Şube zorunludur" })} placeholder="Şube adı" readOnly className="bg-gray-100 cursor-not-allowed" />
                {errors.branchName && <span className="text-red-500 text-sm">{errors.branchName.message}</span>}
              </div>
              <div>
                <Label>Bölüm/Görevi *</Label>
                <Input {...register("department", { required: "Bölüm/Görev zorunludur" })} placeholder="Bölüm veya görev" />
                {errors.department && <span className="text-red-500 text-sm">{errors.department.message}</span>}
              </div>
              <div>
                <Label>İşe Giriş Tarihi *</Label>
                <Input type="date" {...register("hireDate", { required: "İşe giriş tarihi zorunludur" })} />
                {errors.hireDate && <span className="text-red-500 text-sm">{errors.hireDate.message}</span>}
              </div>
              <div>
                <Label>Değerlendirme Dönemi *</Label>
                <Select value={formData.evaluationPeriod} onValueChange={(value: any) => setValue("evaluationPeriod", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1.5_months">İşe girişten 1,5 ay sonra</SelectItem>
                    <SelectItem value="5.5_months">İşe girişten 5,5 ay sonra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Değerlendirme Tarihi *</Label>
                <Input type="date" {...register("evaluationDate", { required: "Değerlendirme tarihi zorunludur" })} />
                {errors.evaluationDate && <span className="text-red-500 text-sm">{errors.evaluationDate.message}</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Değerlendirme Kriterleri */}
        <Card>
          <CardHeader>
            <CardTitle>Değerlendirme Kriterleri (15 Kriter)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {CRITERIA.map((criterion, index) => (
              <div key={index} className="border-b pb-4 last:border-b-0">
                <div className="mb-3">
                  <Label className="font-semibold">{index + 1}. {criterion}</Label>
                </div>
                <div className="flex gap-2">
                  {SCALE.map((scale) => (
                    <button
                      key={scale.value}
                      type="button"
                      onClick={() => {
                        const newCriteria = [...formData.criteria];
                        newCriteria[index] = scale.value;
                        setValue("criteria", newCriteria);
                      }}
                      className={`px-4 py-2 rounded font-semibold transition ${
                        formData.criteria[index] === scale.value
                          ? `${scale.color} border-2 border-gray-900`
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {scale.value} - {scale.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Temel Yetkinlikler */}
        <Card>
          <CardHeader>
            <CardTitle>Temel Yetkinlikler (5 Yetkinlik)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {COMPETENCIES.map((competency, index) => (
              <div key={index} className="border-b pb-4 last:border-b-0">
                <div className="mb-3">
                  <Label className="font-semibold">{index + 1}. {competency}</Label>
                </div>
                <div className="flex gap-2">
                  {SCALE.map((scale) => (
                    <button
                      key={scale.value}
                      type="button"
                      onClick={() => {
                        const newCompetencies = [...formData.competencies];
                        newCompetencies[index] = scale.value;
                        setValue("competencies", newCompetencies);
                      }}
                      className={`px-4 py-2 rounded font-semibold transition ${
                        formData.competencies[index] === scale.value
                          ? `${scale.color} border-2 border-gray-900`
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {scale.value} - {scale.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Karar ve Görüşler */}
        <Card>
          <CardHeader>
            <CardTitle>Karar ve Görüşler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Devam Kararı *</Label>
              <Select value={formData.continueEmployment ? "yes" : "no"} onValueChange={(value) => setValue("continueEmployment", value === "yes")}>
                <SelectTrigger>
                  <SelectValue placeholder="Seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Evet, devam etsin</SelectItem>
                  <SelectItem value="no">Hayır, devam etmesin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!formData.continueEmployment && (
              <div>
                <Label>Hayır cevabı için açıklama *</Label>
                <Textarea {...register("continueEmploymentReason", { required: "Hayır cevabı için açıklama zorunludur" })} placeholder="Lütfen açıklama yapınız" />
                {errors.continueEmploymentReason && <span className="text-red-500 text-sm">{errors.continueEmploymentReason.message}</span>}
              </div>
            )}

            <div>
              <Label>Yönetici Görüşü *</Label>
              <Textarea {...register("managerOpinion", { required: "Yönetici görüşü zorunludur" })} placeholder="Yönetici görüşünü yazınız" />
              {errors.managerOpinion && <span className="text-red-500 text-sm">{errors.managerOpinion.message}</span>}
            </div>


          </CardContent>
        </Card>

        {/* Butonlar */}
        <div className="flex gap-4">
          <Button type="button" onClick={handleCalculateResults} className="bg-blue-600 hover:bg-blue-700">
            Sonuçları Hesapla
          </Button>
          {showResults && calculatedResults && (
            <Button type="button" onClick={handleSaveAndPrint} className="bg-green-600 hover:bg-green-700" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Kaydediliyor..." : "Kaydet ve PDF Yazdır"}
            </Button>
          )}
          <Button type="button" onClick={() => window.history.back()} variant="outline">
            Geri Dön
          </Button>
        </div>
      </form>

      {/* Sonuçlar Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Değerlendirme Sonuçları</DialogTitle>
          </DialogHeader>
          {calculatedResults && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-4xl font-bold text-blue-600">{calculatedResults.totalScore}/5</div>
                    <div className="text-sm text-gray-600 mt-2">Ortalama Puan</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-4xl font-bold text-green-600">{calculatedResults.successPercentage}%</div>
                    <div className="text-sm text-gray-600 mt-2">Başarı Yüzdesi</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl font-bold text-purple-600">{calculatedResults.recommendation}</div>
                    <div className="text-sm text-gray-600 mt-2">Tavsiye</div>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600">Kriterler Ort.</div>
                    <div className="text-2xl font-bold mt-2">{calculatedResults.avgCriteria}/5</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600">Yetkinlikler Ort.</div>
                    <div className="text-2xl font-bold mt-2">{calculatedResults.avgCompetencies}/5</div>
                  </CardContent>
                </Card>
              </div>
              <div className="flex gap-4 justify-end pt-4 border-t">
                <Button type="button" onClick={() => setShowResults(false)} variant="outline">
                  Geri Dön
                </Button>
                <Button type="button" onClick={handleSaveAndPrint} className="bg-green-600 hover:bg-green-700" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Kaydediliyor..." : "Kaydet ve PDF Yazdır"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Yazdırma */}
      {showPrintPreview && printData && (
        <ProbationEvaluationPrint data={printData} onClose={() => setShowPrintPreview(false)} />
      )}
    </div>
  );
}
