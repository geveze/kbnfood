import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "recharts";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

export default function MonthlyComparison() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  // Veri çekme
  const { data: branches } = (trpc as any).branches.list.useQuery();
  const { data: periodsList } = (trpc as any).periods.listActive.useQuery();
  const periods = periodsList?.map((p: any) => p.name) || [];
  const { data: monthlyTrend } = (trpc as any).kpiTargetCards.list.useQuery(
    { branchName: selectedBranch || undefined },
    { enabled: !!selectedBranch }
  );
  const { data: monthlyComparison } = (trpc as any).kpiTargetCards.list.useQuery(
    { period: selectedPeriod || undefined },
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

  // İlk şube otomatik seç
  useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].name);
    }
  }, [branches, selectedBranch]);

  // Aylık trend verisi hazırla
  const trendData = monthlyTrend
    ? Array.from(
        new Map(
          monthlyTrend.map((item: any) => [
            item.period,
            {
              period: item.period,
              averageScore:
                parseFloat(item.weightedScore || "0") /
                (parseFloat(item.weight || "1") / 100),
              totalScore: parseFloat(item.weightedScore || "0"),
            },
          ])
        ).values()
      )
        .sort((a: any, b: any) => a.period.localeCompare(b.period))
        .map((item: any) => ({
          period: item.period,
          averageScore: parseFloat(item.averageScore.toFixed(2)),
          totalScore: parseFloat(item.totalScore.toFixed(2)),
        }))
    : [];

  // Şube karşılaştırması verisi hazırla
  const comparisonData = monthlyComparison
    ? Array.from(
        new Map(
          monthlyComparison.map((item: any) => [
            item.branchName,
            {
              branchName: item.branchName,
              totalScore: parseFloat(item.weightedScore || "0"),
              count: 1,
            },
          ])
        ).values()
      )
        .map((item: any) => ({
          branchName: item.branchName,
          finalScore: parseFloat((item.totalScore / 120 * 100).toFixed(2)),
          totalScore: parseFloat(item.totalScore.toFixed(2)),
        }))
        .sort((a: any, b: any) => b.finalScore - a.finalScore)
    : [];

  const handleExport = () => {
    if (!trendData || trendData.length === 0) {
      toast.error("Dışa aktarılacak veri bulunamadı");
      return;
    }

    const headers = ["Dönem", "Ortalama Puan", "Toplam Puan"];
    const rows = trendData.map((item: any) => [
      item.period,
      item.averageScore,
      item.totalScore,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row: any) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monthly-comparison-${selectedBranch}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success("Veriler başarıyla dışa aktarıldı");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Aylık Performans Karşılaştırması</h1>
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          CSV İndir
        </Button>
      </div>

      {/* Filtreler */}
      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Şube Seç</label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Şube seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {branches?.map((branch: any, idx: number) => (
                    <SelectItem key={`branch-${idx}-${branch.branchName}`} value={branch.branchName}>
                      {branch.branchName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Dönem Seç</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Dönem seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {periods?.map((period: string, idx: number) => (
                    <SelectItem key={`period-${idx}-${period}`} value={period}>
                      {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aylık Trend Grafiği */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedBranch} - Aylık Performans Trendi</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="averageScore"
                  stroke="#FF9800"
                  name="Ortalama Puan"
                />
                <Line
                  type="monotone"
                  dataKey="totalScore"
                  stroke="#FFA726"
                  name="Toplam Puan"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Şube Karşılaştırması */}
      {comparisonData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedPeriod} - Şubeler Arası Performans Karşılaştırması</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branchName" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="finalScore"
                  fill="#FF9800"
                  name="Nihai Puan (%)"
                />
              </BarChart>
            </ResponsiveContainer>

            {/* Tablo */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2">Şube Adı</th>
                    <th className="text-right py-2">Nihai Puan (%)</th>
                    <th className="text-right py-2">Toplam Puan</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((item: any, index: number) => (
                    <tr
                      key={`comparison-${index}-${item.branchName}`}
                      className={index % 2 === 0 ? "bg-gray-50" : ""}
                    >
                      <td className="py-2">{item.branchName}</td>
                      <td className="text-right py-2">
                        <span
                          className={`px-2 py-1 rounded ${
                            item.finalScore >= 90
                              ? "bg-green-100 text-green-800"
                              : item.finalScore >= 70
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.finalScore.toFixed(2)}%
                        </span>
                      </td>
                      <td className="text-right py-2">{item.totalScore.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
