import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";

export default function InspectionDashboard() {
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"overview" | "critical" | "warnings">("overview");

  // Veri çekme
  const { data: dashboardMetrics = [], isLoading: metricsLoading } = trpc.fieldInspection.getDashboardMetrics.useQuery(
    selectedBranch !== "all" ? { branchId: parseInt(selectedBranch) } : undefined
  );

  const { data: criticalQuestions = [], isLoading: criticalLoading } = trpc.fieldInspection.getCriticalQuestions.useQuery(
    selectedBranch !== "all" ? { branchId: parseInt(selectedBranch) } : undefined
  );

  const { data: warningsSummary = [], isLoading: warningsLoading } = trpc.fieldInspection.getWarningsSummary.useQuery();

  const { data: branches = [], isLoading: branchesLoading } = trpc.fieldInspection.getBranches.useQuery();

  // Şube listesi
  const branchOptions = useMemo(() => {
    if (!Array.isArray(branches)) return [];
    return branches.map((b: any) => ({
      id: b.id,
      code: b.code,
      name: b.name,
    }));
  }, [branches]);

  // KPI hesaplamaları
  const averageScore = useMemo(() => {
    if (!Array.isArray(dashboardMetrics) || dashboardMetrics.length === 0) return 0;
    const total = dashboardMetrics.reduce((sum: number, m: any) => sum + (parseFloat(m.averageScore) || 0), 0);
    return (total / dashboardMetrics.length).toFixed(1);
  }, [dashboardMetrics]);

  const warningBranchCount = useMemo(() => {
    if (!Array.isArray(warningsSummary)) return 0;
    return warningsSummary.length;
  }, [warningsSummary]);

  const isLoading = metricsLoading || criticalLoading || warningsLoading || branchesLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 bg-background">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Denetim Performans Özeti</h1>
          <p className="text-sm text-muted-foreground mt-1">Şube bazlı denetim sonuçları ve aksiyon planları</p>
        </div>

        {/* Sekmeler */}
        <div className="flex gap-2 border-b border-border">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            onClick={() => setActiveTab("overview")}
            className="rounded-b-none"
          >
            Denetim Özeti
          </Button>
          <Button
            variant={activeTab === "critical" ? "default" : "ghost"}
            onClick={() => setActiveTab("critical")}
            className="rounded-b-none"
          >
            Kritik Sorular
          </Button>
          <Button
            variant={activeTab === "warnings" ? "default" : "ghost"}
            onClick={() => setActiveTab("warnings")}
            className="rounded-b-none"
          >
            Uyarılar
          </Button>
        </div>

        {/* OVERVIEW SEKMESİ */}
        {activeTab === "overview" && (
          <>
            {/* Filtreleme */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Filtreleme</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-foreground mb-2 block">Şube Seçimi</label>
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Tüm şubeler" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Şubeler</SelectItem>
                        {branchOptions.map((branch: any) => (
                          <SelectItem key={branch.id} value={branch.id.toString()}>
                            {branch.name} ({branch.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KPI Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Denetim</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{Array.isArray(dashboardMetrics) ? dashboardMetrics.length : 0}</div>
                  <p className="text-xs text-muted-foreground mt-2">Yapılan denetim sayısı</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ortalama Skor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{averageScore}%</div>
                  <p className="text-xs text-muted-foreground mt-2">Genel başarı ortalaması</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Kritik Sorular</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {Array.isArray(criticalQuestions) ? criticalQuestions.length : 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">%50+ hayır oranı olan sorular</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Uyarılı Şubeler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{warningBranchCount}</div>
                  <p className="text-xs text-muted-foreground mt-2">Kritik uyarı alan şubeler</p>
                </CardContent>
              </Card>
            </div>

            {/* Şube Performans Tablosu */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Şube Performans Tablosu</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
                ) : Array.isArray(dashboardMetrics) && dashboardMetrics.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead className="text-foreground font-semibold">Şube Adı</TableHead>
                          <TableHead className="text-foreground font-semibold">Şube Kodu</TableHead>
                          <TableHead className="text-right text-foreground font-semibold">Ortalama Skor</TableHead>
                          <TableHead className="text-right text-foreground font-semibold">Son Skor</TableHead>
                          <TableHead className="text-center text-foreground font-semibold">Trend</TableHead>
                          <TableHead className="text-foreground font-semibold">Son Denetim</TableHead>
                          <TableHead className="text-foreground font-semibold">Denetçi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboardMetrics.map((metric: any) => (
                          <TableRow key={metric.branchId} className="border-border hover:bg-muted/50">
                            <TableCell className="font-medium text-foreground">{metric.branchName}</TableCell>
                            <TableCell className="text-muted-foreground">{metric.branchCode}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {metric.averageScore}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {metric.lastScore}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {metric.trend > 0 ? (
                                <div className="flex items-center justify-center gap-1 text-green-600">
                                  <TrendingUp size={16} />
                                  <span className="text-sm">+{metric.trend}%</span>
                                </div>
                              ) : metric.trend < 0 ? (
                                <div className="flex items-center justify-center gap-1 text-red-600">
                                  <TrendingDown size={16} />
                                  <span className="text-sm">{metric.trend}%</span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {metric.lastInspectionDate
                                ? new Date(metric.lastInspectionDate).toLocaleDateString("tr-TR")
                                : "-"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{metric.lastInspectorName}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">Denetim verisi bulunamadı</div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* KRİTİK SORULAR SEKMESİ */}
        {activeTab === "critical" && (
          <>
            {/* Kritik Sorular Tablosu */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle size={20} className="text-orange-600" />
                  Kritik Sorular (%50+ Hayır Oranı)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
                ) : Array.isArray(criticalQuestions) && criticalQuestions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead className="text-foreground font-semibold">Kategori</TableHead>
                          <TableHead className="text-foreground font-semibold">Soru</TableHead>
                          <TableHead className="text-right text-foreground font-semibold">Hayır Oranı</TableHead>
                          <TableHead className="text-right text-foreground font-semibold">Hayır Sayısı</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {criticalQuestions.map((question: any) => (
                          <TableRow key={question.questionId} className="border-border hover:bg-muted/50">
                            <TableCell className="font-medium text-foreground">{question.categoryName}</TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-lg">{question.questionText}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                {question.noPercentage}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {question.noCount}/{question.totalCount}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">Kritik soru bulunamadı</div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* UYARILAR SEKMESİ */}
        {activeTab === "warnings" && (
          <>
            {/* Uyarılı Şubeler */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle size={20} className="text-red-600" />
                  Uyarılı Şubeler - Kritik Soru Uyarıları
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
                ) : Array.isArray(warningsSummary) && warningsSummary.length > 0 ? (
                  <div className="space-y-4">
                    {warningsSummary.map((branch: any) => (
                      <div key={branch.branchId} className="border border-red-200 bg-red-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                              <Badge className="bg-red-600">
                                {branch.warningCount} Uyarı
                              </Badge>
                              {branch.branchName} ({branch.branchCode})
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Son uyarı: {branch.lastWarningDate ? new Date(branch.lastWarningDate).toLocaleDateString("tr-TR") : "-"}
                            </p>
                          </div>
                        </div>

                        {/* Uyarı Detayları */}
                        <div className="space-y-2 mt-3">
                          {Array.isArray(branch.warnings) && branch.warnings.slice(0, 3).map((warning: any) => (
                            <div key={warning.id} className="text-sm bg-white rounded p-2 border border-red-100">
                              <p className="font-medium text-foreground">{warning.categoryName}</p>
                              <p className="text-muted-foreground text-xs mt-1">{warning.questionText}</p>
                            </div>
                          ))}
                          {Array.isArray(branch.warnings) && branch.warnings.length > 3 && (
                            <p className="text-xs text-muted-foreground italic">
                              +{branch.warnings.length - 3} daha fazla uyarı
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">Aktif uyarı bulunmamaktadır</div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
