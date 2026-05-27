import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download } from "lucide-react";
import { useLocation } from "wouter";

export default function EvaluationHistory() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchEmployee, setSearchEmployee] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Backend'e list prosedürü ekle
  // Şimdilik mevcut evaluations'ı kullan

  // Tüm değerlendirmeleri getir (admin tüm, şube yöneticileri sadece kendi şubelerinin)
  const { data: evaluations = [], isLoading } = (trpc as any).openPif.getEvaluationHistory.useQuery(
    { 
      branchId: user?.branchId || undefined,
      userRole: user?.role || undefined,
    },
    { enabled: !!user }
  );

  // Personel adına göre filtrele
  const filteredEvaluations = useMemo(() => {
    if (!searchEmployee) return evaluations;
    return evaluations.filter((e: any) =>
      e.employeeName.toLowerCase().includes(searchEmployee.toLowerCase())
    );
  }, [evaluations, searchEmployee]);

  // Personel adına göre grupla
  const groupedByEmployee = useMemo(() => {
    const grouped: Record<string, typeof evaluations> = {};
    filteredEvaluations.forEach((e: any) => {
      if (!grouped[e.employeeName]) {
        grouped[e.employeeName] = [];
      }
      grouped[e.employeeName].push(e);
    });
    // Her grubun değerlendirmelerini tarihe göre sırala (en yenisi önce)
    Object.keys(grouped).forEach((key: string) => {
      grouped[key].sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
    return grouped;
  }, [filteredEvaluations]);

  const getScaleColor = (scale: string) => {
    switch (scale) {
      case "Yetersiz":
        return "bg-red-100 text-red-800";
      case "Gelişime Açık":
        return "bg-orange-100 text-orange-800";
      case "Beklenen":
        return "bg-yellow-100 text-yellow-800";
      case "İyi":
        return "bg-blue-100 text-blue-800";
      case "Çok İyi":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const exportToPDF = async (evaluation: typeof evaluations[0]) => {
    try {
      // Eğer pdfUrl varsa, kaydedilen PDF'i indir
      if (evaluation.pdfUrl) {
        const link = document.createElement("a");
        link.href = evaluation.pdfUrl;
        link.download = `Degerlendirme_${evaluation.employeeName.replace(/\s+/g, "_")}_${new Date(evaluation.evaluationDate).toISOString().split("T")[0]}.pdf`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      // Eğer pdfUrl yoksa, uyarı göster
      alert("Bu değerlendirmenin PDF dosyası kaydedilmemiştir. Lütfen değerlendirmeyi tekrar kaydedin.");
      return;

      // Yoksa yeni PDF oluştur
      const { generateEvaluationPDF } = await import("@/lib/evaluation-export");
      const pdfBlob = await generateEvaluationPDF({
        id: evaluation.id,
        employeeName: evaluation.employeeName,
        employeePosition: evaluation.employeePosition,
        employeeIdNumber: evaluation.employeeIdNumber,
        hireDate: evaluation.hireDate,
        evaluationDate: evaluation.evaluationDate,
        evaluationPeriod: evaluation.evaluationPeriod,
        totalScore: evaluation.totalScore,
        evaluationScale: evaluation.evaluationScale,
        evaluatedByManager: evaluation.evaluatedByManager,
        managerOpinion: evaluation.managerOpinion,
        items: evaluation.items || [],
      });

      const { pdfBlob: blob } = pdfBlob;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Degerlendirme_${evaluation.employeeName.replace(/\s+/g, "_")}_${new Date(evaluation.evaluationDate).toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF indirme hatası:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Değerlendirmeler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLocation("/performance-monitoring")}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Değerlendirme Geçmişi</h1>
              <p className="text-gray-600 mt-1">Personellerin tüm değerlendirmelerini görüntüleyin</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="pt-6">
            <Input
              placeholder="Personel adı ile ara..."
              value={searchEmployee}
              onChange={(e) => setSearchEmployee(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Evaluations List */}
        <div className="space-y-4">
          {Object.entries(groupedByEmployee).length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="pt-6 text-center text-gray-500">
                Değerlendirme bulunamadı
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedByEmployee).map(([employeeName, evals]) => (
              <Card key={employeeName} className="shadow-sm overflow-hidden">
                <CardHeader
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors"
                  onClick={() =>
                    setExpandedId(expandedId === evals[0].id ? null : evals[0].id)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{employeeName}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Toplam {evals.length} değerlendirme
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        Son Değerlendirme
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(evals[0].createdAt).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                {expandedId === evals[0].id && (
                  <CardContent className="pt-6">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>Dönem</TableHead>
                            <TableHead>Tarih</TableHead>
                            <TableHead>Toplam Puan</TableHead>
                            <TableHead>Skalası</TableHead>
                            <TableHead>Değerlendiren</TableHead>
                            <TableHead>İşlem</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {evals.map((evaluation: any) => (
                            <TableRow key={evaluation.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">
                                {evaluation.evaluationPeriod}
                              </TableCell>
                              <TableCell>
                                {evaluation.evaluationDate
                                  ? new Date(evaluation.evaluationDate).toLocaleDateString("tr-TR")
                                  : "-"}
                              </TableCell>
                              <TableCell className="font-semibold">
                                {evaluation.totalScore}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    getScaleColor(
                                      evaluation.evaluationScale
                                    )
                                  }`}
                                >
                                  {evaluation.evaluationScale}
                                </span>
                              </TableCell>
                              <TableCell>{evaluation.evaluatedByManager}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => exportToPDF(evaluation)}
                                  className="gap-2"
                                >
                                  <Download className="h-4 w-4" />
                                  İndir
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Yönetici Görüşü */}
                    {evals[0]?.managerOpinion && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Son Yönetici Görüşü
                        </h4>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {evals[0]?.managerOpinion}
                        </p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
