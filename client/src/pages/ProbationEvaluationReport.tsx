import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface Evaluation {
  id: number;
  employeeTCNumber: string;
  employeeName: string;
  branchName: string;
  department: string;
  evaluationPeriod: "1.5_months" | "5.5_months";
  evaluationDate: string;
  successPercentage: number;
  continueEmployment: boolean;
  continueEmploymentReason?: string;
  overallComments?: string;
  evaluatedBy?: string;
}

export function ProbationEvaluationReport() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);

  // Tüm değerlendirmeleri getir (backend'de filtreleme yapılmayacak, frontend'de yapılacak)
  const { data: evaluations = [], isLoading } = (trpc as any).probationEvaluation.listByBranch.useQuery({
    branch: selectedBranch && selectedBranch !== "all" ? selectedBranch : undefined,
    // evaluationType filtresi kaldırıldı - tüm dönemleri getir, frontend'de filtreleme yap
  });

  // Benzersiz şubeleri al
  const branches = useMemo(() => {
    const uniqueBranches = new Set(evaluations.map((e: Evaluation) => e.branchName));
    return Array.from(uniqueBranches).filter(Boolean).sort();
  }, [evaluations]);

  // Filtrelenmiş değerlendirmeler
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((evaluation: Evaluation) => {
      const matchesSearch =
        evaluation.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evaluation.employeeTCNumber.includes(searchTerm);
      
      // Dönem filtresi
      const matchesPeriod = selectedPeriod === "all" || evaluation.evaluationPeriod === selectedPeriod;
      
      return matchesSearch && matchesPeriod;
    });
  }, [evaluations, searchTerm, selectedPeriod]);

  // İstatistikler
  const stats = useMemo(() => {
    const total = filteredEvaluations.length;
    const successful = filteredEvaluations.filter((e: Evaluation) => e.successPercentage >= 60).length;
    const avgScore = total > 0 ? (filteredEvaluations.reduce((sum: number, e: Evaluation) => sum + e.successPercentage, 0) / total).toFixed(1) : 0;

    return { total, successful, avgScore };
  }, [filteredEvaluations]);

  const handleExportToExcel = () => {
    const data = filteredEvaluations.map((evaluation: Evaluation) => ({
      "TC Numarası": evaluation.employeeTCNumber,
      "Adı Soyadı": evaluation.employeeName,
      "Şube": evaluation.branchName,
      "Bölüm": evaluation.department || "-",
      "Dönem": evaluation.evaluationPeriod === "1.5_months" ? "1,5 Ay" : "5,5 Ay",
      "Tarih": evaluation.evaluationDate,
      "Puan": evaluation.successPercentage,
      "Başarı %": evaluation.successPercentage,
      "Skalası": evaluation.evaluatedBy,
      "Devam": evaluation.continueEmployment ? "Evet" : "Hayır",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Değerlendirmeler");
    XLSX.writeFile(workbook, "deneme-suresi-degerlendirmeler.xlsx");
  };

  const handleComparison = (evaluation: Evaluation) => {
    // Aynı çalışanın diğer dönem değerlendirmesini bul
    const otherEvaluation = evaluations.find(
      (e: Evaluation) =>
        e.employeeTCNumber === evaluation.employeeTCNumber &&
        e.id !== evaluation.id &&
        e.evaluationPeriod !== evaluation.evaluationPeriod
    );

    if (otherEvaluation) {
      setComparisonData({ current: evaluation, other: otherEvaluation });
      setShowComparisonModal(true);
    } else {
      toast.error("Karşılaştırma için diğer dönem değerlendirmesi bulunamadı");
    }
  };

  if (!user) return <div>Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Deneme Süresi Değerlendirmeleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtreleme */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Arama (Ad, TC)</label>
              <Input
                placeholder="Çalışan adı veya TC numarası"
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
              />
            </div>

            {user?.role === "admin" && (
              <div>
                <label className="text-sm font-medium">Şube</label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Şube seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Şubeler</SelectItem>
                    {branches.map((branch: any) => (
                      <SelectItem key={branch} value={branch}>
                        {branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {user?.role === "branch_manager" && (
              <div>
                <label className="text-sm font-medium">Şube</label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700">
                  {user?.branchName || "Bilinmiyor"}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Dönem</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Dönem seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Dönemler</SelectItem>
                  <SelectItem value="1.5_months">1,5 Ay</SelectItem>
                  <SelectItem value="5.5_months">5,5 Ay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">&nbsp;</label>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedBranch("all");
                  setSelectedPeriod("all");
                }}
                variant="outline"
                className="w-full"
              >
                Filtreleri Temizle
              </Button>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-blue-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-gray-600">Toplam Değerlendirme</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.successful}</div>
                  <div className="text-sm text-gray-600">Başarılı (%60+)</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{stats.avgScore}%</div>
                  <div className="text-sm text-gray-600">Ortalama Başarı</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Excel Export */}
          <Button onClick={handleExportToExcel} className="w-full bg-green-600 hover:bg-green-700">
            Excel'e Aktar
          </Button>

          {/* Tablo */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="text-center py-8">Yükleniyor...</div>
            ) : filteredEvaluations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Değerlendirme bulunamadı</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">TC Numarası</th>
                    <th className="px-4 py-2 text-left">Adı Soyadı</th>
                    <th className="px-4 py-2 text-left">Şube</th>
                    <th className="px-4 py-2 text-left">Dönem</th>
                    <th className="px-4 py-2 text-right">Başarı %</th>
                    <th className="px-4 py-2 text-center">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvaluations.map((evaluation: Evaluation) => (
                    <tr key={evaluation.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{evaluation.employeeTCNumber}</td>
                      <td className="px-4 py-2">{evaluation.employeeName}</td>
                      <td className="px-4 py-2">{evaluation.branchName}</td>
                      <td className="px-4 py-2">
                        {evaluation.evaluationPeriod === "1.5_months" ? "1,5 Ay" : "5,5 Ay"}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold">
                        <span
                          className={
                            evaluation.successPercentage >= 60
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {evaluation.successPercentage}%
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleComparison(evaluation)}
                        >
                          Karşılaştır
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Karşılaştırma Modal */}
      <Dialog open={showComparisonModal} onOpenChange={setShowComparisonModal}>
        <DialogContent className="max-w-4xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Değerlendirme Karşılaştırması - {comparisonData?.current?.employeeName} ({comparisonData?.current?.employeeTCNumber})
            </DialogTitle>
          </DialogHeader>
          {comparisonData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* 1,5 Ay Değerlendirmesi */}
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h3 className="font-semibold mb-3 text-blue-900">1,5 Ay Değerlendirmesi</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <strong>Başarı %:</strong>
                      <span className={comparisonData.current?.evaluationType === "1.5_months" ? (comparisonData.current?.successPercentage >= 60 ? "text-green-600 font-semibold" : "text-red-600 font-semibold") : (comparisonData.other?.successPercentage >= 60 ? "text-green-600 font-semibold" : "text-red-600 font-semibold")}>
                        {comparisonData.current?.evaluationType === "1.5_months" ? comparisonData.current?.successPercentage : comparisonData.other?.successPercentage}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <strong>Tarih:</strong>
                      <span>{comparisonData.current?.evaluationType === "1.5_months" ? comparisonData.current?.evaluationDate : comparisonData.other?.evaluationDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <strong>Devam Kararı:</strong>
                      <span className={comparisonData.current?.evaluationType === "1.5_months" ? (comparisonData.current?.continueEmployment ? "text-green-600" : "text-red-600") : (comparisonData.other?.continueEmployment ? "text-green-600" : "text-red-600")}>
                        {comparisonData.current?.evaluationType === "1.5_months" ? (comparisonData.current?.continueEmployment ? "Evet" : "Hayır") : (comparisonData.other?.continueEmployment ? "Evet" : "Hayır")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5,5 Ay Değerlendirmesi */}
                <div className="border rounded-lg p-4 bg-green-50">
                  <h3 className="font-semibold mb-3 text-green-900">5,5 Ay Değerlendirmesi</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <strong>Başarı %:</strong>
                      <span className={comparisonData.current?.evaluationType === "5.5_months" ? (comparisonData.current?.successPercentage >= 60 ? "text-green-600 font-semibold" : "text-red-600 font-semibold") : (comparisonData.other?.successPercentage >= 60 ? "text-green-600 font-semibold" : "text-red-600 font-semibold")}>
                        {comparisonData.current?.evaluationType === "5.5_months" ? comparisonData.current?.successPercentage : comparisonData.other?.successPercentage}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <strong>Tarih:</strong>
                      <span>{comparisonData.current?.evaluationType === "5.5_months" ? comparisonData.current?.evaluationDate : comparisonData.other?.evaluationDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <strong>Devam Kararı:</strong>
                      <span className={comparisonData.current?.evaluationType === "5.5_months" ? (comparisonData.current?.continueEmployment ? "text-green-600" : "text-red-600") : (comparisonData.other?.continueEmployment ? "text-green-600" : "text-red-600")}>
                        {comparisonData.current?.evaluationType === "5.5_months" ? (comparisonData.current?.continueEmployment ? "Evet" : "Hayır") : (comparisonData.other?.continueEmployment ? "Evet" : "Hayır")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* İlerleme Analizi */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">İlerleme Analizi</h4>
                <div className="text-sm space-y-1">
                  {(() => {
                    const score1_5 = comparisonData.current?.evaluationType === "1.5_months" ? comparisonData.current?.successPercentage : comparisonData.other?.successPercentage;
                    const score5_5 = comparisonData.current?.evaluationType === "5.5_months" ? comparisonData.current?.successPercentage : comparisonData.other?.successPercentage;
                    const difference = score5_5 - score1_5;
                    const trend = difference > 0 ? "↑ Olumlu" : difference < 0 ? "↓ Olumsuz" : "= Sabit";
                    const trendColor = difference > 0 ? "text-green-600" : difference < 0 ? "text-red-600" : "text-gray-600";
                    
                    return (
                      <>
                        <div>
                          <strong>Değişim:</strong> <span className={trendColor}>{trend} ({difference > 0 ? "+" : ""}{difference}%)</span>
                        </div>
                        <div>
                          <strong>Sonuç:</strong> {score5_5 >= 60 ? "Deneme süresi başarılı tamamlanmış" : "Deneme süresi başarısız"}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
