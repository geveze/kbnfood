import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import BranchDetailView from "./BranchDetailView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Filter } from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#FF9800", "#FFA726", "#FFB74D", "#FFCC80"];

export default function KPITargetCardsFilter() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedManager, setSelectedManager] = useState<string>("");
  const [selectedDimension, setSelectedDimension] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [detailViewBranch, setDetailViewBranch] = useState<string | null>(null);

  // Veri çekme
  const { data: periodsList } = (trpc as any).periods.listActive.useQuery();
  const periods = periodsList?.map((p: any) => p.name) || [];
  const { data: oldPeriods } = (trpc as any).kpiTargetCards.getPeriods.useQuery();
  const { data: managers } = (trpc as any).kpiTargetCards.getBranchManagers.useQuery({});
  const { data: dimensions } = (trpc as any).kpiTargetCards.getDimensions.useQuery();
  const { data: branchesData } = (trpc as any).branches.list.useQuery();
  const branches = branchesData || [];
  const { data: branchesByManager } = (trpc as any).kpiTargetCards.getBranchesByManager.useQuery(
    { branchManager: selectedManager },
    { enabled: !!selectedManager }
  );
  const { data: targetCardsData } = (trpc as any).kpiTargetCards.list.useQuery({
    period: selectedPeriod || undefined,
    branchManager: selectedManager || undefined,
    dimension: selectedDimension || undefined,
    branchName: selectedBranch || undefined,
  });
  const [targetCards, setTargetCards] = useState<any[]>([]);
  const { refetch: refetchTargets } = (trpc as any).kpiTargetCards.list.useQuery({
    period: selectedPeriod || undefined,
    branchManager: selectedManager || undefined,
    dimension: selectedDimension || undefined,
    branchName: selectedBranch || undefined,
  });

  const updateActualValue = (trpc as any).kpiTargetCards.updateActualValue.useMutation({
    onSuccess: () => {
      refetchTargets();
      toast.success("Gerçekleşen değer kaydedildi");
    },
    onError: (error: any) => {
      toast.error("Hata: " + error.message);
    },
  });

  useEffect(() => {
    if (targetCardsData) {
      setTargetCards(targetCardsData);
    }
  }, [targetCardsData]);
  const { data: statistics } = (trpc as any).kpiTargetCards.getStatistics.useQuery({
    period: selectedPeriod || "",
    branchManager: selectedManager || undefined,
  });
  const { data: branchStatistics } = (trpc as any).kpiTargetCards.getBranchStatistics.useQuery(
    {
      period: selectedPeriod,
      branchName: selectedBranch,
    },
    { enabled: !!selectedPeriod && !!selectedBranch }
  );

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login-local");
    }
  }, [isAuthenticated, loading, navigate]);

  // İlk dönem otomatik seç
  useEffect(() => {
    if (periods && periods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(periods[0]);
    }
  }, [periods, selectedPeriod]);

  // Şube müdürü ise kendi şubesini otomatik seç
  useEffect(() => {
    if (user?.role === "branch_manager" && user?.branchId && !selectedBranch) {
      // Şube adını branches listesinden bul
      const userBranch = branches?.find((b: any) => b.id === user.branchId);
      if (userBranch?.name) {
        setSelectedBranch(userBranch.name);
      }
    }
  }, [user?.role, user?.branchId, branches, selectedBranch]);

  const handleExport = () => {
    if (!targetCards || targetCards.length === 0) {
      toast.error("Dışa aktarılacak veri bulunamadı");
      return;
    }

    // CSV formatında dışa aktar
    const headers = [
      "Dönem",
      "Şube Adı",
      "Bölge Sorumlusu",
      "Boyut",
      "Hedef",
      "Birim",
      "Ağırlık %",
      "Hedef Tipi",
      "Hedef Alt Limit",
      "Hedef Değeri",
      "Hedef Üst Limit",
      "Gerçekleşen Değer",
      "Puan",
    ];

    const rows = targetCards.map((card: any) => [
      card.period,
      card.branchName,
      card.branchManager,
      card.dimension,
      card.target,
      card.unit || "-",
      card.weight || "-",
      card.targetType || "-",
      card.lowerLimit || "-",
      card.targetValue || "-",
      card.upperLimit || "-",
      card.actualValue || "-",
      card.score || "-",
    ]);

    const csv = [headers, ...rows].map((row: any) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `KPI_Hedef_Kartlari_${selectedPeriod}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="dashboard-header">
        <div className="container">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              KPI Hedef Kartları Detay
            </h1>
            <p className="text-muted-foreground">
              Şube hedeflerini filtreleyerek detaylı analiz yapın
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content container max-w-7xl">
        {/* Filtreleme */}
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtreleme Seçenekleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Dönem *
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e: any) => {
                    setSelectedPeriod(e.target.value);
                    setSelectedManager("");
                    setSelectedBranch("");
                  }}
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
                <label className="block text-sm font-medium text-foreground mb-2">
                  Bölge Sorumlusu
                </label>
                <select
                  value={selectedManager}
                  onChange={(e: any) => {
                    setSelectedManager(e.target.value);
                    setSelectedBranch("");
                  }}
                  className="filter-input"
                >
                  <option value="">Tümü</option>
                  {managers?.map((manager: string) => (
                    <option key={manager} value={manager}>
                      {manager}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Boyut
                </label>
                <select
                  value={selectedDimension}
                  onChange={(e: any) => setSelectedDimension(e.target.value)}
                  className="filter-input"
                >
                  <option value="">Tümü</option>
                  {dimensions?.map((dimension: string) => (
                    <option key={dimension} value={dimension}>
                      {dimension}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Şube
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e: any) => setSelectedBranch(e.target.value)}
                  disabled={user?.role === "branch_manager"}
                  className="filter-input"
                >
                  <option value="">Önceki Seçimi Temizle</option>
                  {selectedManager
                    ? branchesByManager?.map((branch: any) => (
                        <option key={branch.id} value={branch.name}>
                          {branch.name}
                        </option>
                      ))
                    : branches?.map((branch: any) => (
                        <option key={branch.id} value={branch.name}>
                          {branch.name}
                        </option>
                      ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleExport}
                disabled={!targetCards || targetCards.length === 0}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                CSV Olarak Dışa Aktar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Seçilen Şube İstatistikleri */}
        {selectedBranch && selectedPeriod && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">
                  KPI Adet
                </p>
                <p className="text-3xl font-bold text-primary">
                  {branchStatistics?.kpiCount || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">
                  Hedef Puanı (Ağırlık*Puan)
                </p>
                <p className="text-3xl font-bold text-primary">
                  {branchStatistics?.targetScore || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">
                  Nihai Puan (Hedef/120*100)
                </p>
                <p className="text-3xl font-bold text-primary">
                  {branchStatistics?.finalScore || 0}%
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Genel İstatistikler - Sadece Bölge Sorumlusu için */}
        {statistics && selectedPeriod && user?.role === "region_manager" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-border">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">
                  Toplam Hedef
                </p>
                <p className="text-3xl font-bold text-primary">
                  {statistics.totalTargets}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">
                  Nihai Puan
                </p>
                <p className="text-3xl font-bold text-primary">
                  {((statistics.totalTargets / 120) * 100).toFixed(2)}%
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">
                  Toplam Hedef Puanı
                </p>
                <p className="text-3xl font-bold text-primary">
                  {statistics.totalTargets}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">
                  Boyut Dağılımı
                </p>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">Finans:</span>{" "}
                    {statistics.dimensionBreakdown.finans}
                  </p>
                  <p>
                    <span className="font-medium">Müşteri:</span>{" "}
                    {statistics.dimensionBreakdown.musteri}
                  </p>
                  <p>
                    <span className="font-medium">İnsan:</span>{" "}
                    {statistics.dimensionBreakdown.insan}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Hedef Kartları Tablosu */}
        {targetCards && targetCards.length > 0 ? (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>
                Hedef Kartları ({targetCards.length} kayıt)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Dönem</th>
                      <th>Şube Adı</th>
                      <th>Bölge Sorumlusu</th>
                      <th>Boyut</th>
                      <th>Hedef</th>
                      <th>Hedef Açıklaması</th>
                      <th>Birim</th>
                      <th>Kaynak</th>
                      <th>Sıklık</th>
                      <th>Ağırlık %</th>
                      <th>Hedef Tipi</th>
                      <th>Alt Limit (80P)</th>
                      <th>Hedef Değeri (100P)</th>
                      <th>Üst Limit (120P)</th>
                      <th>Gerçekleşen</th>
                      <th>Puan</th>
                      <th>Hedef Puanı (Ağırlık*Puan)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targetCards.map((card: any, idx: number) => (
                      <tr key={idx} className="hover:bg-muted/50 cursor-pointer" onClick={() => setDetailViewBranch(card.branchName)}>
                          <td className="text-xs">{card.period || "-"}</td>
                          <td className="font-medium text-primary hover:underline">{card.branchName}</td>
                          <td className="text-xs">{card.bolgeSorumlusu || "-"}</td>
                          <td>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {card.dimension}
                            </span>
                          </td>
                          <td className="font-medium">{card.target}</td>
                          <td className="text-xs">{card.targetDescription || "-"}</td>
                          <td>{card.unit || "-"}</td>
                          <td className="text-xs">{card.source || "-"}</td>
                          <td className="text-xs">{card.frequency || "-"}</td>
                          <td className="text-center">{card.weight || "-"}%</td>
                          <td>
                            <span
                              className={`text-xs font-medium ${
                                card.targetType === "Artan"
                                  ? "text-green-600"
                                  : "text-blue-600"
                              }`}
                            >
                              {card.targetType || "-"}
                            </span>
                          </td>
                          <td className="text-center text-xs">{card.lowerLimit || "-"}</td>
                          <td className="font-semibold text-primary text-center">
                            {card.targetValue || "-"}
                          </td>
                          <td className="text-center text-xs">{card.upperLimit || "-"}</td>
                          <td onClick={(e: any) => e.stopPropagation()}>
                            {user?.role === "admin" ? (
                              <input
                                type="number"
                                value={card.actualValue || ""}
                                onChange={(e: any) => {
                                  const updatedCards = targetCards.map((c: any, i: number) =>
                                    i === idx ? { ...c, actualValue: e.target.value } : c
                                  );
                                  setTargetCards(updatedCards);
                                }}
                                onBlur={(e: any) => {
                                  if (card.id && e.target.value !== card.actualValue) {
                                    updateActualValue.mutate({
                                      id: typeof card.id === 'string' ? parseInt(card.id) : card.id,
                                      actualValue: e.target.value,
                                    });
                                  }
                                }}
                                className="w-full px-2 py-1 border rounded text-sm"
                                placeholder="-"
                              />
                            ) : (
                              card.actualValue || "-"
                            )}
                          </td>
                          <td>
                            {card.score ? (
                              <span className="font-semibold">{card.score}</span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="font-semibold text-primary">
                            {card.weightedScore ? parseFloat(card.weightedScore).toFixed(2) : "-"}
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
                <p className="text-muted-foreground mb-2">
                  Seçili filtrelere uygun hedef kartı bulunamadı
                </p>
                <p className="text-sm text-muted-foreground">
                  Lütfen filtreleri değiştirerek tekrar deneyin
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Şube Detay Görünümü */}
      {detailViewBranch && selectedPeriod && (
        <BranchDetailView
          period={selectedPeriod}
          branchName={detailViewBranch}
          onClose={() => setDetailViewBranch(null)}
        />
      )}
    </div>
  );
}
