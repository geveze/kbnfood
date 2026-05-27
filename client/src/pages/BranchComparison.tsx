import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const COLORS = ["#FF9800", "#FFA726", "#FFB74D", "#FFCC80", "#FFE0B2"];

export default function BranchComparison() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedDimension, setSelectedDimension] = useState<string>("");

  // Veri çekme
  const { data: periodsList } = (trpc as any).periods.listActive.useQuery();
  const periods = periodsList?.map((p: any) => p.name) || [];
  const { data: dimensions } = (trpc as any).kpiTargetCards.getDimensions.useQuery();
  const { data: allBranches } = (trpc as any).kpiTargetCards.list.useQuery(
    { period: selectedPeriod || undefined },
    { enabled: !!selectedPeriod }
  );

  // Seçilen şubelerin verilerini al
  const { data: comparisonData } = (trpc as any).kpiTargetCards.list.useQuery(
    {
      period: selectedPeriod || undefined,
      dimension: selectedDimension || undefined,
    },
    { enabled: !!selectedPeriod }
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

  // Benzersiz şubeleri al
  const uniqueBranches = Array.from(
    new Set(
      (allBranches || []).map((item: any) => item.branchName)
    )
  ).sort();

  // Şube seçimini toggle et
  const toggleBranch = (branchName: string) => {
    setSelectedBranches((prev) =>
      prev.includes(branchName)
        ? prev.filter((b) => b !== branchName)
        : [...prev, branchName]
    );
  };

  // Karşılaştırma verilerini hazırla
  const prepareComparisonChart = () => {
    if (!comparisonData || selectedBranches.length === 0) return [];

    const targets = selectedDimension
      ? comparisonData.filter((item: any) => item.dimension === selectedDimension)
      : comparisonData;

    // Şubelere göre grupla
    const grouped: { [key: string]: any[] } = {};
    targets.forEach((item: any) => {
      if (!grouped[item.branchName]) {
        grouped[item.branchName] = [];
      }
      grouped[item.branchName].push(item);
    });

    // Seçilen şubeleri filtrele
    const filtered = Object.entries(grouped)
      .filter(([branchName]) => selectedBranches.includes(branchName))
      .map(([branchName, items]) => ({
        branchName,
        targetCount: items.length,
        averageScore: (
          items.reduce((sum: number, item: any) => {
            const score = parseFloat(item.score) || 0;
            return sum + score;
          }, 0) / items.length
        ).toFixed(2),
        achievementRate: (
          (items.filter((item: any) => {
            const score = parseFloat(item.score) || 0;
            return score >= 100;
          }).length / items.length) *
          100
        ).toFixed(0),
      }));

    return filtered;
  };

  // Boyut dağılımı
  const prepareDimensionChart = () => {
    if (!comparisonData || selectedBranches.length === 0) return [];

    const targets = comparisonData.filter((item: any) =>
      selectedBranches.includes(item.branchName)
    );

    const dimensionMap: { [key: string]: number } = {};
    targets.forEach((item: any) => {
      dimensionMap[item.dimension] = (dimensionMap[item.dimension] || 0) + 1;
    });

    return Object.entries(dimensionMap).map(([dimension, count]) => ({
      dimension,
      count,
    }));
  };

  // Hedef başarı oranı
  const prepareAchievementChart = () => {
    if (!comparisonData || selectedBranches.length === 0) return [];

    const targets = comparisonData.filter((item: any) =>
      selectedBranches.includes(item.branchName)
    );

    const grouped: { [key: string]: any[] } = {};
    targets.forEach((item: any) => {
      if (!grouped[item.branchName]) {
        grouped[item.branchName] = [];
      }
      grouped[item.branchName].push(item);
    });

    return Object.entries(grouped).map(([branchName, items]) => {
      const belowTarget = items.filter((item: any) => {
        const score = parseFloat(item.score) || 0;
        return score < 80;
      }).length;

      const onTarget = items.filter((item: any) => {
        const score = parseFloat(item.score) || 0;
        return score >= 80 && score < 120;
      }).length;

      const aboveTarget = items.filter((item: any) => {
        const score = parseFloat(item.score) || 0;
        return score >= 120;
      }).length;

      return {
        branchName,
        "Hedef Altı": belowTarget,
        "Hedef Üstü": onTarget,
        "Hedef Üzeri": aboveTarget,
      };
    });
  };

  const comparisonChartData = prepareComparisonChart();
  const dimensionChartData = prepareDimensionChart();
  const achievementChartData = prepareAchievementChart();

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
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Şube Karşılaştırma Analizi
          </h1>
          <p className="text-muted-foreground">
            Birden fazla şubenin performansını yan yana karşılaştırın
          </p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Dönem *
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => {
                    setSelectedPeriod(e.target.value);
                    setSelectedBranches([]);
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
                  Boyut
                </label>
                <select
                  value={selectedDimension}
                  onChange={(e) => setSelectedDimension(e.target.value)}
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
            </div>

            {/* Şube Seçimi */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Karşılaştırılacak Şubeler ({selectedBranches.length} seçili)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(uniqueBranches as string[]).map((branch: string) => (
                  <label
                    key={branch}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBranches.includes(branch)}
                      onChange={() => toggleBranch(branch)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{branch}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grafikleri Göster */}
        {selectedBranches.length > 0 ? (
          <div className="space-y-6">
            {/* Genel Karşılaştırma */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Genel Performans Karşılaştırması</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="branchName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="averageScore"
                      fill="#FF9800"
                      name="Ortalama Puan"
                    />
                    <Bar
                      dataKey="targetCount"
                      fill="#FFA726"
                      name="Hedef Sayısı"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Hedef Başarı Oranı */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Hedef Başarı Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={achievementChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="branchName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Hedef Altı" fill="#EF4444" stackId="a" />
                    <Bar dataKey="Hedef Üstü" fill="#FBBF24" stackId="a" />
                    <Bar dataKey="Hedef Üzeri" fill="#10B981" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Boyut Dağılımı */}
            {dimensionChartData.length > 0 && (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Boyut Dağılımı</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dimensionChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dimension" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#FF9800" name="Hedef Sayısı" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Detaylı Tablo */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Detaylı Karşılaştırma Tablosu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Şube Adı</th>
                        <th>Hedef Sayısı</th>
                        <th>Ortalama Puan</th>
                        <th>Başarı Oranı</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonChartData.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="font-medium">{item.branchName}</td>
                          <td className="text-center">{item.targetCount}</td>
                          <td className="text-center font-semibold text-primary">
                            {item.averageScore}
                          </td>
                          <td className="text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              parseFloat(item.achievementRate) >= 80
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {item.achievementRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">
                  Karşılaştırılacak şubeler seçiniz
                </p>
                <p className="text-sm text-muted-foreground">
                  En az bir şube seçerek analizi başlatabilirsiniz
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
