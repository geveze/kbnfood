import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, TrendingUp, Download } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface BranchPerformance {
  branchName: string;
  totalWeightedScore: number;
  finalScore: number;
  financialScore: number;
  customerScore: number;
  hrScore: number;
  targetCount: number;
  trend: "up" | "down" | "stable";
}

export default function BranchPerformanceRanking() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [sortBy, setSortBy] = useState<"finalScore" | "financialScore" | "customerScore" | "hrScore">("finalScore");
  const [branchPerformance, setBranchPerformance] = useState<BranchPerformance[]>([]);

  const { data: periods } = (trpc as any).kpiTargetCards.getPeriods.useQuery();
  const { data: targetCards } = (trpc as any).kpiTargetCards.list.useQuery({
    period: selectedPeriod || undefined,
  });

  // İlk dönem otomatik seç
  useEffect(() => {
    if (periods && periods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(periods[0]);
    }
  }, [periods, selectedPeriod]);

  // Şube performansını hesapla
  useEffect(() => {
    if (!targetCards || targetCards.length === 0) {
      setBranchPerformance([]);
      return;
    }

    const branchMap = new Map<string, any>();

    targetCards.forEach((card: any) => {
      if (!branchMap.has(card.branchName)) {
        branchMap.set(card.branchName, {
          branchName: card.branchName,
          cards: [],
          financialCards: [],
          customerCards: [],
          hrCards: [],
        });
      }

      const branch = branchMap.get(card.branchName);
      branch.cards.push(card);

      if (card.dimension === "Finance") {
        branch.financialCards.push(card);
      } else if (card.dimension === "Customer") {
        branch.customerCards.push(card);
      } else if (card.dimension === "HR") {
        branch.hrCards.push(card);
      }
    });

    const performance: BranchPerformance[] = Array.from(branchMap.values()).map((branch: any) => {
      const totalWeightedScore = branch.cards.reduce((sum: number, c: any) => sum + (c.weightedScore || 0), 0);
      const finalScore = (totalWeightedScore / 120) * 100;

      const financialScore =
        branch.financialCards.length > 0
          ? branch.financialCards.reduce((sum: number, c: any) => sum + (c.score || 0), 0) /
            branch.financialCards.length
          : 0;

      const customerScore =
        branch.customerCards.length > 0
          ? branch.customerCards.reduce((sum: number, c: any) => sum + (c.score || 0), 0) /
            branch.customerCards.length
          : 0;

      const hrScore =
        branch.hrCards.length > 0
          ? branch.hrCards.reduce((sum: number, c: any) => sum + (c.score || 0), 0) / branch.hrCards.length
          : 0;

      return {
        branchName: branch.branchName,
        totalWeightedScore: Math.round(totalWeightedScore * 100) / 100,
        finalScore: Math.round(finalScore * 100) / 100,
        financialScore: Math.round(financialScore * 100) / 100,
        customerScore: Math.round(customerScore * 100) / 100,
        hrScore: Math.round(hrScore * 100) / 100,
        targetCount: branch.cards.length,
        trend: finalScore >= 90 ? "up" : finalScore >= 70 ? "stable" : "down",
      };
    });

    // Seçili sıralama ölçütüne göre sırala
    performance.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      return (bValue as number) - (aValue as number);
    });

    setBranchPerformance(performance);
  }, [targetCards, sortBy]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login-local");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleExport = () => {
    if (branchPerformance.length === 0) {
      toast.error("Dışa aktarılacak veri bulunamadı");
      return;
    }

    const headers = ["Sıra", "Şube Adı", "Nihai Puan", "Finansal", "Müşteri", "İnsan Kaynakları", "Hedef Sayısı"];
    const rows = branchPerformance.map((branch, index) => [
      index + 1,
      branch.branchName,
      branch.finalScore,
      branch.financialScore,
      branch.customerScore,
      branch.hrScore,
      branch.targetCount,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `branch_ranking_${selectedPeriod}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Veriler başarıyla dışa aktarıldı");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const chartData = branchPerformance.slice(0, 10).map((branch) => ({
    name: branch.branchName.substring(0, 15),
    "Nihai Puan": branch.finalScore,
    Finansal: branch.financialScore,
    Müşteri: branch.customerScore,
    "İK": branch.hrScore,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="dashboard-header">
        <div className="container">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Şube Performans Sıralaması</h1>
            <p className="text-muted-foreground">Şubelerin KPI performansını karşılaştırın ve sıralamayı görüntüleyin</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content container max-w-7xl">
        {/* Filtreleme ve Kontroller */}
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle>Sıralama Kontrolleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Dönem</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="filter-input"
                >
                  <option value="">Dönem Seçiniz</option>
                  {periods?.map((period: string) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Sıralama Ölçütü</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="filter-input"
                >
                  <option value="finalScore">Nihai Puan</option>
                  <option value="financialScore">Finansal Performans</option>
                  <option value="customerScore">Müşteri Performansı</option>
                  <option value="hrScore">İnsan Kaynakları</option>
                </select>
              </div>
            </div>

            <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              CSV Olarak Dışa Aktar
            </Button>
          </CardContent>
        </Card>

        {/* Performans Grafiği */}
        {chartData.length > 0 && (
          <Card className="border-border mb-6">
            <CardHeader>
              <CardTitle>Top 10 Şube Performansı</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Nihai Puan" fill="#f97316" />
                  <Bar dataKey="Finansal" fill="#fb923c" />
                  <Bar dataKey="Müşteri" fill="#fdba74" />
                  <Bar dataKey="İK" fill="#fed7aa" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Sıralama Tablosu */}
        {branchPerformance.length > 0 ? (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Tüm Şubeler ({branchPerformance.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sıra</th>
                      <th>Şube Adı</th>
                      <th>Nihai Puan</th>
                      <th>Finansal</th>
                      <th>Müşteri</th>
                      <th>İnsan Kaynakları</th>
                      <th>Hedef Sayısı</th>
                      <th>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchPerformance.map((branch, index) => (
                      <tr key={branch.branchName} className="hover:bg-muted/50">
                        <td className="font-bold text-primary">{index + 1}</td>
                        <td className="font-medium">{branch.branchName}</td>
                        <td className="font-bold text-lg">
                          <span
                            className={`px-2 py-1 rounded-full ${
                              branch.finalScore >= 90
                                ? "bg-green-100 text-green-800"
                                : branch.finalScore >= 70
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {branch.finalScore}%
                          </span>
                        </td>
                        <td>
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              branch.financialScore >= 90
                                ? "bg-green-50 text-green-700"
                                : branch.financialScore >= 70
                                ? "bg-yellow-50 text-yellow-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {branch.financialScore}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              branch.customerScore >= 90
                                ? "bg-green-50 text-green-700"
                                : branch.customerScore >= 70
                                ? "bg-yellow-50 text-yellow-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {branch.customerScore}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              branch.hrScore >= 90
                                ? "bg-green-50 text-green-700"
                                : branch.hrScore >= 70
                                ? "bg-yellow-50 text-yellow-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {branch.hrScore}
                          </span>
                        </td>
                        <td className="text-center">{branch.targetCount}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            {branch.trend === "up" ? (
                              <>
                                <ArrowUp className="w-4 h-4 text-green-600" />
                                <span className="text-xs text-green-600">Yükselen</span>
                              </>
                            ) : branch.trend === "down" ? (
                              <>
                                <ArrowDown className="w-4 h-4 text-red-600" />
                                <span className="text-xs text-red-600">Düşen</span>
                              </>
                            ) : (
                              <>
                                <TrendingUp className="w-4 h-4 text-yellow-600" />
                                <span className="text-xs text-yellow-600">Sabit</span>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Seçili dönem için veri bulunamadı</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
