import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface EvaluationSummary {
  employeeName: string;
  evaluationPeriod: string;
  totalScore: number;
  evaluationScale: string;
  evaluationDate: Date;
}

export default function EvaluationReport() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [filterPeriod, setFilterPeriod] = useState<string>("");
  const [filterEmployee, setFilterEmployee] = useState<string>("");
  const [evaluations, setEvaluations] = useState<EvaluationSummary[]>([]);

  // Tüm değerlendirmeleri al
  const { data: evaluationsList, isLoading } = (trpc as any).system.getEvaluations.useQuery(
    { branchId: user?.branchId || 0 },
    { enabled: !!user?.branchId }
  );

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login-local");
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (evaluationsList) {
      const summaries: EvaluationSummary[] = evaluationsList.map((e: any) => ({
        employeeName: e.employeeName,
        evaluationPeriod: e.evaluationPeriod,
        totalScore: e.totalScore,
        evaluationScale: e.evaluationScale,
        evaluationDate: new Date(e.evaluationDate),
      }));
      setEvaluations(summaries);
    }
  }, [evaluationsList]);

  // Filtrelenmiş değerlendirmeler
  const filteredEvaluations = evaluations.filter((e) => {
    if (filterPeriod && e.evaluationPeriod !== filterPeriod) return false;
    if (filterEmployee && !e.employeeName.toLowerCase().includes(filterEmployee.toLowerCase())) return false;
    return true;
  });

  // İstatistikler
  const stats = {
    totalEvaluations: filteredEvaluations.length,
    averageScore: filteredEvaluations.length > 0
      ? Math.round(filteredEvaluations.reduce((sum, e) => sum + e.totalScore, 0) / filteredEvaluations.length)
      : 0,
    excellentCount: filteredEvaluations.filter((e) => e.evaluationScale === "Çok İyi").length,
    goodCount: filteredEvaluations.filter((e) => e.evaluationScale === "İyi").length,
    expectedCount: filteredEvaluations.filter((e) => e.evaluationScale === "Beklenen").length,
    developingCount: filteredEvaluations.filter((e) => e.evaluationScale === "Gelişime Açık").length,
    insufficientCount: filteredEvaluations.filter((e) => e.evaluationScale === "Yetersiz").length,
  };

  const handleExportReport = () => {
    try {
      const csvData = [
        ["DEĞERLENDIRME RAPORU"],
        ["Rapor Tarihi", new Date().toLocaleDateString("tr-TR")],
        ["Toplam Değerlendirme", stats.totalEvaluations],
        ["Ortalama Puan", stats.averageScore],
        [],
        ["DEĞERLENDİRME DAĞILIMI"],
        ["Çok İyi", stats.excellentCount],
        ["İyi", stats.goodCount],
        ["Beklenen", stats.expectedCount],
        ["Gelişime Açık", stats.developingCount],
        ["Yetersiz", stats.insufficientCount],
        [],
        ["DETAYLI LİSTE"],
        ["Personel Adı", "Dönem", "Puan", "Skalası", "Tarih"],
        ...filteredEvaluations.map((e) => [
          e.employeeName,
          e.evaluationPeriod,
          e.totalScore,
          e.evaluationScale,
          e.evaluationDate.toLocaleDateString("tr-TR"),
        ]),
      ];

      const csv = csvData
        .map((row) =>
          row
            .map((cell) => {
              const cellStr = String(cell || "");
              return cellStr.includes(",") ? `"${cellStr}"` : cellStr;
            })
            .join(",")
        )
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Degerlendirme_Raporu_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Rapor indirildi");
    } catch (error) {
      toast.error("Rapor oluşturulurken hata oluştu");
      console.error(error);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="dashboard-header">
        <div className="container">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Değerlendirme Raporu
            </h1>
            <p className="text-muted-foreground">
              Tüm değerlendirmelerin özet raporu ve analizi
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content container max-w-6xl">
        {/* Filtreler */}
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle>Filtreler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Personel Adı
                </label>
                <Input
                  placeholder="Ara..."
                  value={filterEmployee}
                  onChange={(e) => setFilterEmployee(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Dönem
                </label>
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="filter-input"
                >
                  <option value="">Tümü</option>
                  <option value="3. ay">3. ay</option>
                  <option value="6. ay">6. ay</option>
                  <option value="9. ay">9. ay</option>
                  <option value="12. ay">12. ay</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button onClick={handleExportReport} className="w-full flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Rapor İndir
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Toplam Değerlendirme</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{stats.totalEvaluations}</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Ortalama Puan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{stats.averageScore}</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-green-50 dark:bg-green-950">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Çok İyi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.excellentCount}</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-blue-50 dark:bg-blue-950">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">İyi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.goodCount}</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-yellow-50 dark:bg-yellow-950">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Beklenen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{stats.expectedCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Detaylı Tablo */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Detaylı Değerlendirmeler</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEvaluations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Personel Adı</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Dönem</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Puan</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Skalası</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Tarih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvaluations.map((evaluation, index) => (
                      <tr key={index} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 text-foreground">{evaluation.employeeName}</td>
                        <td className="py-3 px-4 text-foreground">{evaluation.evaluationPeriod}</td>
                        <td className="py-3 px-4 text-foreground font-semibold">{evaluation.totalScore}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            evaluation.evaluationScale === "Çok İyi" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                            evaluation.evaluationScale === "İyi" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                            evaluation.evaluationScale === "Beklenen" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                            evaluation.evaluationScale === "Gelişime Açık" ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" :
                            "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}>
                            {evaluation.evaluationScale}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-foreground">{evaluation.evaluationDate.toLocaleDateString("tr-TR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Değerlendirme bulunamadı</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
