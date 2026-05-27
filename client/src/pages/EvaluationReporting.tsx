import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FileText, Download, Eye, ArrowLeft, Search, Filter } from "lucide-react";
import { exportToPDF } from "@/lib/evaluation-export";

interface EvaluationRecord {
  id: number;
  employeeName: string;
  employeePosition: string;
  employeeIdNumber?: string;
  evaluationPeriod: string;
  evaluationDate: Date;
  totalScore: number;
  evaluationScale: string;
  evaluatedByManager?: string;
  managerOpinion?: string;
  hireDate?: Date;
  items?: Array<{
    id: string;
    category: string;
    subcategory: string;
    itemNumber: number;
    description: string;
    score: number;
  }>;
}

export default function EvaluationReporting() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationRecord | null>(null);

  // Tüm değerlendirmeleri getir
  const { data: evaluations = [], isLoading } = (trpc as any).system.getEvaluations.useQuery({ branchId: 0 });

  // Benzersiz pozisyonları al
  const positions = useMemo(() => {
    const uniquePositions = new Set(evaluations.map((e: any) => e.employeePosition));
    return Array.from(uniquePositions).sort();
  }, [evaluations]);

  // Benzersiz dönemleri al
  const periods = useMemo(() => {
    const uniquePeriods = new Set(evaluations.map((e: any) => e.evaluationPeriod));
    return Array.from(uniquePeriods).sort();
  }, [evaluations]);

  // Filtrelenmiş değerlendirmeleri al
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((evaluation: any) => {
      const matchesSearch =
        evaluation.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evaluation.employeeIdNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPosition = !filterPosition || evaluation.employeePosition === filterPosition;
      const matchesPeriod = !filterPeriod || evaluation.evaluationPeriod === filterPeriod;

      return matchesSearch && matchesPosition && matchesPeriod;
    });
  }, [evaluations, searchTerm, filterPosition, filterPeriod]);

  const handleViewDetails = (evaluation: any) => {
    setSelectedEvaluation(evaluation);
  };

  const handleExportPDF = (evaluation: any) => {
    try {
      exportToPDF({
        id: evaluation.id,
        employeeName: evaluation.employeeName,
        employeePosition: evaluation.employeePosition,
        employeeIdNumber: evaluation.employeeIdNumber,
        hireDate: evaluation.hireDate ? new Date(evaluation.hireDate) : undefined,
        evaluationDate: new Date(evaluation.evaluationDate),
        evaluationPeriod: evaluation.evaluationPeriod,
        evaluatedByManager: evaluation.evaluatedByManager,
        totalScore: parseFloat(evaluation.totalScore),
        evaluationScale: evaluation.evaluationScale,
        managerOpinion: evaluation.managerOpinion,
        items: evaluation.items,
      });
      toast.success("PDF başarıyla oluşturuldu");
    } catch (error) {
      toast.error("PDF oluşturulurken hata oluştu");
    }
  };

  const getScaleColor = (scale: string) => {
    const colors: Record<string, string> = {
      "Yetersiz": "bg-red-100 text-red-800",
      "Gelişime Açık": "bg-orange-100 text-orange-800",
      "Beklenen": "bg-yellow-100 text-yellow-800",
      "İyi": "bg-green-100 text-green-800",
      "Çok İyi": "bg-blue-100 text-blue-800",
    };
    return colors[scale] || "bg-gray-100 text-gray-800";
  };

  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      "Kasa": "bg-green-50 border-green-200",
      "Izgara": "bg-red-50 border-red-200",
      "Servis": "bg-blue-50 border-blue-200",
      "Izgara Yöneticisi": "bg-orange-50 border-orange-200",
      "Restoran Yönetimi": "bg-purple-50 border-purple-200",
    };
    return colors[position] || "bg-gray-50 border-gray-200";
  };

  if (selectedEvaluation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-6xl mx-auto">
          <Button
            onClick={() => setSelectedEvaluation(null)}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>

          <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <CardTitle className="flex items-center justify-between">
                <span>Değerlendirme Detayları</span>
                <span className="text-sm font-normal">
                  {selectedEvaluation.employeePosition}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-sm font-semibold text-slate-600">
                    Personel Adı Soyadı
                  </label>
                  <p className="text-lg font-bold text-slate-900 mt-1">
                    {(selectedEvaluation as any).employeeName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600">
                    Sicil No
                  </label>
                  <p className="text-lg font-bold text-slate-900 mt-1">
                    {(selectedEvaluation as any).employeeIdNumber || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600">
                    Değerlendirme Dönemi
                  </label>
                  <p className="text-lg font-bold text-slate-900 mt-1">
                    {(selectedEvaluation as any).evaluationPeriod}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600">
                    Değerlendirme Tarihi
                  </label>
                  <p className="text-lg font-bold text-slate-900 mt-1">
                    {new Date((selectedEvaluation as any).evaluationDate).toLocaleDateString("tr-TR")}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-slate-600 font-semibold">Toplam Puan</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">
                      {parseFloat(String((selectedEvaluation as any).totalScore)).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">/ 100</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-600 font-semibold">Değerlendirme Skalası</p>
                    <p className={`text-lg font-bold mt-1 px-3 py-1 rounded inline-block ${getScaleColor((selectedEvaluation as any).evaluationScale)}`}>
                      {(selectedEvaluation as any).evaluationScale}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-600 font-semibold">Değerlendiren</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {selectedEvaluation.evaluatedByManager || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {selectedEvaluation.managerOpinion && (
                <div className="mb-6">
                  <label className="text-sm font-semibold text-slate-600">
                    Yönetici Görüşü
                  </label>
                  <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-4 mt-2">
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {selectedEvaluation.managerOpinion}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => handleExportPDF(selectedEvaluation)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF İndir
                </Button>
                <Button
                  onClick={() => setSelectedEvaluation(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Kapat
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-600" />
            Değerlendirme Raporlaması
          </h1>
          <p className="text-slate-600 mt-1">
            Tüm personel performans değerlendirmelerini görüntüleyin ve yönetin
          </p>
        </div>

        <Card className="mb-6 border-2">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2">
            <CardTitle className="text-lg">Filtreleme ve Arama</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-600 block mb-2">
                  <Search className="w-4 h-4 inline mr-1" />
                  Ad veya Sicil No
                </label>
                <Input
                  placeholder="Ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-2"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600 block mb-2">
                  <Filter className="w-4 h-4 inline mr-1" />
                  Ünvan
                </label>
                  <select
                    value={filterPosition}
                    onChange={(e) => setFilterPosition(e.target.value)}
                    className="w-full border-2 border-slate-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Tümü</option>
                    {positions.map((pos: any) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600 block mb-2">
                  Dönem
                </label>
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="w-full border-2 border-slate-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Tümü</option>
                  {periods.map((period: any) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterPosition("");
                    setFilterPeriod("");
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Filtreleri Temizle
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {isLoading ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-slate-600">Yükleniyor...</p>
              </CardContent>
            </Card>
          ) : filteredEvaluations.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-slate-600">Değerlendirme bulunamadı</p>
              </CardContent>
            </Card>
          ) : (
            filteredEvaluations.map((evaluation: any) => (
              <Card
                key={evaluation.id}
                className={`border-2 cursor-pointer hover:shadow-lg transition-shadow ${getPositionColor(evaluation.employeePosition)}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-bold text-slate-900">
                            {evaluation.employeeName}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {evaluation.employeePosition} • {evaluation.evaluationPeriod}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mr-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">
                          {parseFloat(String((evaluation as any).totalScore)).toFixed(1)}
                        </p>
                        <p className={`text-xs font-semibold px-2 py-1 rounded ${getScaleColor((evaluation as any).evaluationScale)}`}>
                          {(evaluation as any).evaluationScale}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleViewDetails(evaluation as any)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Detay
                      </Button>
                      <Button
                        onClick={() => handleExportPDF(evaluation as any)}
                        size="sm"
                        variant="outline"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="mt-6 text-center text-sm text-slate-600">
          <p>
            Toplam {filteredEvaluations.length} değerlendirme gösteriliyor
          </p>
        </div>
      </div>
    </div>
  );
}
