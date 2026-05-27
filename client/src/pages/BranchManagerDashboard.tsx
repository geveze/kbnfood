import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUp, ArrowDown } from "lucide-react";
import PageHeader from "@/components/PageHeader";

export default function BranchManagerDashboard() {
  const { user } = useAuth();
  const branchId = user?.branchId;

  // Mevcut dönem verilerini çek
  const { data: currentPerformance } = (trpc as any).kpiTargetCards.list.useQuery(
    {},
    { enabled: !!branchId }
  );

  // Geçmiş ay verilerini çek
  const { data: previousPerformance } = (trpc as any).kpiTargetCards.list.useQuery(
    { period: "previous" },
    { enabled: !!branchId }
  );

  const { data: branch } = (trpc as any).branches.getById.useQuery(
    { id: branchId || 0 },
    { enabled: !!branchId }
  );

  if (!branchId) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="border-border w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Şube bilgisi bulunamadı
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Ortalama puan hesapla
  const calculateAverageScore = (data: any[] | undefined) => {
    if (!data || data.length === 0) return "0";
    const total = data.reduce((sum, item) => sum + (parseFloat(item.score) || 0), 0);
    return (total / data.length).toFixed(1);
  };

  const currentScore = calculateAverageScore(currentPerformance);
  const previousScore = calculateAverageScore(previousPerformance);
  const scoreChange = parseFloat(currentScore) - parseFloat(previousScore);
  const isImproving = scoreChange >= 0;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Şube Performans Paneli" />

      <div className="dashboard-content container">
        {/* Şube Bilgisi */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{branch?.name}</h1>
              <p className="text-muted-foreground mt-1">
                Bölge: <span className="font-semibold">{branch?.region || "-"}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Şube Kodu</p>
              <p className="text-2xl font-bold text-foreground">{branch?.code}</p>
            </div>
          </div>
        </div>

        {/* Performans Özeti */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Mevcut Dönem Puanı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-foreground">{currentScore}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentPerformance?.length || 0} KPI
                  </p>
                </div>
                <div className={`text-2xl ${isImproving ? "text-green-600" : "text-red-600"}`}>
                  {isImproving ? <ArrowUp className="w-6 h-6" /> : <ArrowDown className="w-6 h-6" />}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Geçmiş Dönem Puanı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-3xl font-bold text-foreground">{previousScore}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {previousPerformance?.length || 0} KPI
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Değişim
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p className={`text-3xl font-bold ${isImproving ? "text-green-600" : "text-red-600"}`}>
                  {isImproving ? "+" : ""}{scoreChange.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isImproving ? "İyileşme" : "Düşüş"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KPI Detayları */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>KPI Hedefleri</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="current" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="current">Mevcut Dönem</TabsTrigger>
                <TabsTrigger value="previous">Geçmiş Dönem</TabsTrigger>
              </TabsList>

              <TabsContent value="current" className="mt-4">
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Boyut</th>
                        <th>Hedef</th>
                        <th>Gerçekleşen</th>
                        <th>Puan</th>
                        <th>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPerformance?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="font-medium">{item.dimension}</td>
                          <td>{item.target}</td>
                          <td>{item.actualValue || "-"}</td>
                          <td className="font-semibold">{item.score || 0}</td>
                          <td>
                            <span
                              className={`badge ${
                                item.score >= 100
                                  ? "badge-success"
                                  : item.score >= 80
                                    ? "badge-warning"
                                    : "badge-error"
                              }`}
                            >
                              {item.score >= 100
                                ? "Başarılı"
                                : item.score >= 80
                                  ? "Uyarı"
                                  : "Başarısız"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="previous" className="mt-4">
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Boyut</th>
                        <th>Hedef</th>
                        <th>Gerçekleşen</th>
                        <th>Puan</th>
                        <th>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previousPerformance?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="font-medium">{item.dimension}</td>
                          <td>{item.target}</td>
                          <td>{item.actualValue || "-"}</td>
                          <td className="font-semibold">{item.score || 0}</td>
                          <td>
                            <span
                              className={`badge ${
                                item.score >= 100
                                  ? "badge-success"
                                  : item.score >= 80
                                    ? "badge-warning"
                                    : "badge-error"
                              }`}
                            >
                              {item.score >= 100
                                ? "Başarılı"
                                : item.score >= 80
                                  ? "Uyarı"
                                  : "Başarısız"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
