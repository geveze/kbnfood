import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";

export default function EvaluationsTable() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("2026-01");

  const { data: evaluations = [], isLoading } = (trpc as any).system.getEvaluations.useQuery({
    period: selectedPeriod,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login-local");
    }
  }, [isAuthenticated, loading, navigate]);

  // Admin kontrolü
  if (!loading && user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Erişim Reddedildi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Bu sayfaya sadece yöneticiler erişebilir.
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Ana Sayfaya Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Arama filtresi
  const filteredEvaluations = evaluations.filter((evaluation: any) =>
    evaluation.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    evaluation.employeeIdNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    evaluation.employeePosition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Excel indir
  const handleDownloadExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedPeriod) params.append("period", selectedPeriod);

      const response = await fetch(`/api/download-evaluations?${params.toString()}`);
      if (!response.ok) throw new Error("Excel indirme başarısız");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Degerlendirmeler_${selectedPeriod}_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Excel dosyası başarıyla indirildi");
    } catch (error: any) {
      toast.error(error?.message || "Excel indirme başarısız");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold">Tüm Değerlendirmeler</h1>
          </div>
          <Button onClick={handleDownloadExcel} className="gap-2">
            <Download className="w-4 h-4" />
            Excel İndir
          </Button>
        </div>

        {/* Filtreler */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtreler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Dönem</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="2026-01">2026-01</option>
                  <option value="2026-02">2026-02</option>
                  <option value="2026-03">2026-03</option>
                  <option value="2026-04">2026-04</option>
                  <option value="2026-05">2026-05</option>
                  <option value="2026-06">2026-06</option>
                  <option value="2026-07">2026-07</option>
                  <option value="2026-08">2026-08</option>
                  <option value="2026-09">2026-09</option>
                  <option value="2026-10">2026-10</option>
                  <option value="2026-11">2026-11</option>
                  <option value="2026-12">2026-12</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Ara</label>
                <Input
                  placeholder="Personel adı, sicil no, pozisyon..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tablo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Değerlendirmeler ({filteredEvaluations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Yükleniyor...</div>
            ) : filteredEvaluations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Değerlendirme bulunamadı
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Personel Adı</th>
                      <th className="text-left py-3 px-4 font-medium">Sicil No</th>
                      <th className="text-left py-3 px-4 font-medium">Pozisyon</th>
                      <th className="text-left py-3 px-4 font-medium">Dönem</th>
                      <th className="text-left py-3 px-4 font-medium">Değerlendiren</th>
                      <th className="text-right py-3 px-4 font-medium">Toplam Puan</th>
                      <th className="text-left py-3 px-4 font-medium">Skalası</th>
                      <th className="text-left py-3 px-4 font-medium">Tarih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvaluations.map((evaluation: any, index: number) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{evaluation.employeeName}</td>
                        <td className="py-3 px-4">{evaluation.employeeIdNumber || "-"}</td>
                        <td className="py-3 px-4">{evaluation.employeePosition}</td>
                        <td className="py-3 px-4">{evaluation.evaluationPeriod}</td>
                        <td className="py-3 px-4">{evaluation.evaluatedByManager || "-"}</td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {evaluation.totalScore}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            evaluation.evaluationScale === "Çok İyi" ? "bg-green-100 text-green-800" :
                            evaluation.evaluationScale === "İyi" ? "bg-blue-100 text-blue-800" :
                            evaluation.evaluationScale === "Beklenen" ? "bg-yellow-100 text-yellow-800" :
                            evaluation.evaluationScale === "Gelişime Açık" ? "bg-orange-100 text-orange-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {evaluation.evaluationScale}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {new Date(evaluation.evaluationDate).toLocaleDateString("tr-TR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
