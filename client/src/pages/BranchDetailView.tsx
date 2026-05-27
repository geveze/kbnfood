"use client";

import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#FF9800", "#FFA726", "#FFB74D", "#FFCC80"];

interface BranchDetailViewProps {
  period: string;
  branchName: string;
  onClose: () => void;
}

export default function BranchDetailView({
  period,
  branchName,
  onClose,
}: BranchDetailViewProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  // Şubenin hedeflerini al
  const { data: branchTargets, refetch } = (trpc as any).kpiTargetCards.getBranchTargets.useQuery(
    { period, branchName },
    { enabled: !!period && !!branchName }
  );

  // Gerçekleşen değer güncelleme mutation
  const updateActualValueMutation = (trpc as any).kpiTargetCards.updateActualValue.useMutation({
    onSuccess: () => {
      refetch();
      setEditingId(null);
      setEditingValue("");
      toast.success("Değer başarıyla güncellendi");
    },
    onError: (error: any) => {
      toast.error(error.message || "Hata oluştu");
    },
  });

  // Şube istatistikleri
  const calculateStats = () => {
    if (!branchTargets || branchTargets.length === 0) {
      return {
        totalTargets: 0,
        averageScore: 0,
        achievedTargets: 0,
        belowTargets: 0,
        dimensions: {},
      };
    }

    const dimensions: { [key: string]: number } = {};
    let totalScore = 0;
    let achievedCount = 0;
    let belowCount = 0;

    branchTargets.forEach((target: any) => {
      dimensions[target.dimension] = (dimensions[target.dimension] || 0) + 1;
      const score = parseFloat(target.score) || 0;
      totalScore += score;
      if (score >= 100) achievedCount++;
      if (score < 80) belowCount++;
    });

    return {
      totalTargets: branchTargets.length,
      averageScore: (totalScore / branchTargets.length).toFixed(2),
      achievedTargets: achievedCount,
      belowTargets: belowCount,
      dimensions,
    };
  };

  // Boyut dağılımı grafiği
  const prepareDimensionChart = () => {
    if (!branchTargets) return [];
    const stats = calculateStats();
    return Object.entries(stats.dimensions).map(([dimension, count]) => ({
      dimension,
      count,
    }));
  };

  // Hedef başarı dağılımı
  const prepareAchievementChart = () => {
    if (!branchTargets) return [];

    const belowTarget = branchTargets.filter((target: any) => {
      const score = parseFloat(target.score) || 0;
      return score < 80;
    }).length;

    const onTarget = branchTargets.filter((target: any) => {
      const score = parseFloat(target.score) || 0;
      return score >= 80 && score < 120;
    }).length;

    const aboveTarget = branchTargets.filter((target: any) => {
      const score = parseFloat(target.score) || 0;
      return score >= 120;
    }).length;

    return [
      { name: "Hedef Altı", value: belowTarget },
      { name: "Hedef Üstü", value: onTarget },
      { name: "Hedef Üzeri", value: aboveTarget },
    ];
  };

  const stats = calculateStats();
  const dimensionChartData = prepareDimensionChart();
  const achievementChartData = prepareAchievementChart();

  // CSV Dışa Aktar
  const handleExport = () => {
    if (!branchTargets || branchTargets.length === 0) {
      toast.error("Dışa aktarılacak veri bulunamadı");
      return;
    }

    const headers = [
      "Bölge Sorumlusu",
      "Hedef",
      "Hedef Açıklaması",
      "Boyut",
      "Birim",
      "Kaynak",
      "Sıklık",
      "Ağırlık %",
      "Hedef Tipi",
      "Hedef Alt Limit (80 P)",
      "Hedef Değer (100 P)",
      "Hedef Üst Limit (120 P)",
      "Gerçekleşen Değer",
      "Puan",
      "Hedef Puanı (Ağırlık*Puan)",
    ];

    const rows = branchTargets.map((target: any) => [
      target.bolgeSorumlusu || "",
      target.target || "",
      target.targetDescription || "",
      target.dimension || "",
      target.unit || "",
      target.source || "",
      target.frequency || "",
      target.weight || "",
      target.targetType || "",
      target.lowerLimit || "",
      target.targetValue || "",
      target.upperLimit || "",
      target.actualValue || "",
      target.score || "",
      target.weightedScore || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row: any) =>
        row
          .map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${branchName}_Hedefleri_${period}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Veriler başarıyla dışa aktarıldı");
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center p-4 pt-8">
        <div className="bg-background rounded-lg shadow-lg w-full max-w-7xl">
          {/* Header */}
          <div className="border-b border-border p-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{branchName}</h2>
                <p className="text-sm text-muted-foreground">Dönem: {period}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                CSV Dışa Aktar
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* İstatistikler */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">Toplam Hedef</p>
                  <p className="text-3xl font-bold text-primary">
                    {stats.totalTargets}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">
                    Ortalama Puan
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {stats.averageScore}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">
                    Başarılı Hedefler
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.achievedTargets}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">
                    Hedef Altında
                  </p>
                  <p className="text-3xl font-bold text-red-600">
                    {stats.belowTargets}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Grafikler */}
            {branchTargets && branchTargets.length > 0 ? (
              <>
                {/* Boyut Dağılımı */}
                {dimensionChartData.length > 0 && (
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle>Boyut Dağılımı</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={dimensionChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="dimension" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Hedef Başarı Dağılımı */}
                {achievementChartData.length > 0 && (
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle>Hedef Başarı Dağılımı</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={achievementChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {achievementChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Hedefler Tablosu */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle>Hedef Kartları Detayı</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-2 font-semibold">Bölge Sorumlusu</th>
                            <th className="text-left p-2 font-semibold">Hedef</th>
                            <th className="text-left p-2 font-semibold">Hedef Açıklaması</th>
                            <th className="text-left p-2 font-semibold">Boyut</th>
                            <th className="text-left p-2 font-semibold">Birim</th>
                            <th className="text-left p-2 font-semibold">Kaynak</th>
                            <th className="text-left p-2 font-semibold">Sıklık</th>
                            <th className="text-center p-2 font-semibold">Ağırlık %</th>
                            <th className="text-left p-2 font-semibold">Hedef Tipi</th>
                            <th className="text-center p-2 font-semibold">Alt Limit (80P)</th>
                            <th className="text-center p-2 font-semibold">Hedef (100P)</th>
                            <th className="text-center p-2 font-semibold">Üst Limit (120P)</th>
                            <th className="text-center p-2 font-semibold">Gerçekleşen</th>
                            <th className="text-center p-2 font-semibold">Puan</th>
                            <th className="text-center p-2 font-semibold">Hedef Puanı</th>
                            <th className="text-center p-2 font-semibold">Durum</th>
                          </tr>
                        </thead>
                        <tbody>
                          {branchTargets.map((target: any, idx: number) => {
                            const score = parseFloat(target.score) || 0;
                            let statusColor = "bg-red-100 text-red-800";
                            let statusText = "Hedef Altı";

                            if (score >= 120) {
                              statusColor = "bg-green-100 text-green-800";
                              statusText = "Hedef Üzeri";
                            } else if (score >= 80) {
                              statusColor = "bg-yellow-100 text-yellow-800";
                              statusText = "Hedef Üstü";
                            }

                            return (
                              <tr key={idx} className="border-b border-border hover:bg-muted/50">
                                <td className="p-2 text-xs">{target.bolgeSorumlusu || "-"}</td>
                                <td className="p-2 font-medium">{target.target}</td>
                                <td className="p-2 text-xs">{target.targetDescription || "-"}</td>
                                <td className="p-2">{target.dimension}</td>
                                <td className="p-2">{target.unit || "-"}</td>
                                <td className="p-2 text-xs">{target.source || "-"}</td>
                                <td className="p-2 text-xs">{target.frequency || "-"}</td>
                                <td className="p-2 text-center">{target.weight || "-"}%</td>
                                <td className="p-2 text-xs">{target.targetType || "-"}</td>
                                <td className="p-2 text-center font-semibold">{target.lowerLimit || "-"}</td>
                                <td className="p-2 text-center font-semibold text-primary">
                                  {target.targetValue || "-"}
                                </td>
                                <td className="p-2 text-center font-semibold">{target.upperLimit || "-"}</td>
                                <td className="p-2 text-center">
                                  {editingId === target.id && user?.role === "admin" ? (
                                    <div className="flex gap-1 justify-center">
                                      <input
                                        type="number"
                                        value={editingValue}
                                        onChange={(e: any) => setEditingValue(e.target.value)}
                                        className="w-16 px-2 py-1 border rounded text-xs"
                                        placeholder="Değer"
                                      />
                                      <button
                                        onClick={() => {
                                          if (editingValue) {
                                            updateActualValueMutation.mutate({
                                              id: target.id.toString(),
                                              actualValue: editingValue,
                                            });
                                          }
                                        }}
                                        className="px-2 py-1 bg-primary text-white text-xs rounded hover:bg-primary/90"
                                        disabled={updateActualValueMutation.isPending}
                                      >
                                        Kaydet
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingId(null);
                                          setEditingValue("");
                                        }}
                                        className="px-2 py-1 bg-gray-300 text-xs rounded hover:bg-gray-400"
                                      >
                                        İptal
                                      </button>
                                    </div>
                                  ) : user?.role === "admin" ? (
                                    <span
                                      onClick={() => {
                                        setEditingId(target.id);
                                        setEditingValue(target.actualValue || "");
                                      }}
                                      className="cursor-pointer hover:bg-primary/10 px-2 py-1 rounded"
                                    >
                                      {target.actualValue || "-"}
                                    </span>
                                  ) : (
                                    <span>{target.actualValue || "-"}</span>
                                  )}
                                </td>
                                <td className="p-2 text-center font-semibold">{target.score || "-"}</td>
                                <td className="p-2 text-center font-semibold text-primary">
                                  {target.weightedScore ? parseFloat(target.weightedScore).toFixed(2) : "-"}
                                </td>
                                <td className="p-2 text-center">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                                    {statusText}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-border">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Bu şube için hedef bulunamadı
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
