import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Printer } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#FF9800", "#FFA726", "#FFB74D", "#FFCC80"];

export default function ReportGenerator() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [reportType, setReportType] = useState("performance");
  const [period, setPeriod] = useState("2026-01");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: branches } = (trpc as any).branches.list.useQuery();
  const { data: performanceData } = (trpc as any).performanceData.list.useQuery({
    branchId: selectedBranch && selectedBranch !== "all" ? parseInt(selectedBranch) : undefined,
    period: period || undefined,
  });
  const { data: kpiTargets } = (trpc as any).kpiTargets.list.useQuery({
    branchId: selectedBranch && selectedBranch !== "all" ? parseInt(selectedBranch) : undefined,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login-local");
    }
  }, [isAuthenticated, loading, navigate]);

  const downloadMasterExcel = async () => {
    setIsGenerating(true);
    try {
      // Tüm şubelerin ID'lerini al
      const allBranchIds = branches?.map((b: any) => b.id) || [];
      
      // Query parametrelerini oluştur
      const params = new URLSearchParams();
      if (period) params.append("period", period);
      if (allBranchIds.length > 0) {
        allBranchIds.forEach((id: number) => params.append("branchIds", id.toString()));
      }
      
      // Master Excel dosyasını indir
      const response = await fetch(`/api/download-evaluations?${params.toString()}`);
      if (!response.ok) throw new Error("Excel indirme başarısız");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Performans_Izleme_${period || "Tum_Donemler"}_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Excel dosyası başarıyla indirildi");
    } catch (error: any) {
      toast.error(error?.message || "Excel indirme başarısız");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadHTMLReport = async () => {
    console.log("downloadHTMLReport called");
    setIsGenerating(true);
    try {
      const { generatePerformanceMonitoringReport } = await import("@/lib/performance-monitoring-report");
      
      // Rapor verilerini getir - tRPC mutation POST ile
      const inputData = {
        branchId: selectedBranch && selectedBranch !== "all" ? parseInt(selectedBranch) : undefined,
        period: period || "",
      };
      
      console.log("Sending to API:", inputData);
      
      // tRPC mutation POST body format - json wrapper ile gönder
      const response = await fetch(`/api/trpc/performanceEvaluations.getReport`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: inputData }),
      });
      
      console.log("API Response Status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`Rapor verileri alınamadı (${response.status}): ${errorText}`);
      }
      
      const result = await response.json();
      console.log("API Response:", result);
      
      // tRPC mutation response'u direkt olarak kullan
      let reportData: any = result || [];
      
      // Eğer result bir object ise ve array değil ise, array'e dönüştür
      if (!Array.isArray(reportData) && typeof reportData === "object") {
        reportData = [reportData];
      }
      
      // Eğer hala array değil ise, boş array kullan
      if (!Array.isArray(reportData)) {
        reportData = [];
      }
      
      console.log("Report Data:", reportData, "Type:", typeof reportData, "Is Array:", Array.isArray(reportData));
      
      // reportData'nın array olup olmadığını kontrol et
      if (!Array.isArray(reportData)) {
        console.error("Report data is not an array:", reportData);
        toast.error("Rapor verisi hatalı format'ta");
        return;
      }
      
      if (reportData.length === 0) {
        toast.error("Rapor için veri bulunamadı");
        return;
      }
      
      // HTML rapor oluştur
      const htmlContent = generatePerformanceMonitoringReport(reportData as any);
      
      // HTML dosyasını indir
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Performans_Izleme_Raporu_${period || "Tum_Donemler"}_${new Date().toISOString().split("T")[0]}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("HTML rapor başarıyla indirildi");
    } catch (error: any) {
      console.error("HTML rapor hatası:", error);
      toast.error(error?.message || "HTML rapor oluşturma başarısız");
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDFReport = async () => {
    // Performans İzleme rapor türü seçiliyse HTML indir
    if (reportType === "performance-monitoring") {
      await downloadHTMLReport();
      return;
    }

    if (!selectedBranch) {
      toast.error("Lütfen şube seçiniz");
      return;
    }

    setIsGenerating(true);
    try {
      // PDF oluşturma işlemi
      const reportContent = `
        KEBAN FOOD ŞÜBESİ PERFORMANS RAPORU
        
        Şube: ${branches?.find((b: any) => b.id === parseInt(selectedBranch))?.name}
        Dönem: ${period}
        Rapor Tarihi: ${new Date().toLocaleDateString("tr-TR")}
        
        ÖZET
        -----
        Toplam KPI Hedefi: ${kpiTargets?.length || 0}
        İşlenen Performans Verileri: ${performanceData?.length || 0}
        
        PERFORMANS VERİLERİ
        -------------------
        ${performanceData?.map((p: any) => `
          Hedef: ${p.kpiTargetId}
          Gerçek Değer: ${p.actualValue}
          Durum: ${p.status}
        `).join("\n") || "Veri bulunamadı"}
        
        NOTLAR
        ------
        Bu rapor ${new Date().toLocaleDateString("tr-TR")} tarihinde otomatik olarak oluşturulmuştur.
      `;

      // Tarayıcı yazdırma penceresini aç
      const printWindow = window.open("", "", "height=600,width=800");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Keban Food Performans Raporu</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #FF9800; border-bottom: 2px solid #FF9800; padding-bottom: 10px; }
                h2 { color: #333; margin-top: 20px; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #FF9800; color: white; }
                .summary { background-color: #f5f5f5; padding: 10px; border-radius: 5px; }
              </style>
            </head>
            <body>
              <h1>KEBAN FOOD ŞÜBESİ PERFORMANS RAPORU</h1>
              
              <div class="summary">
                <p><strong>Şube:</strong> ${branches?.find((b: any) => b.id === parseInt(selectedBranch))?.name}</p>
                <p><strong>Dönem:</strong> ${period}</p>
                <p><strong>Rapor Tarihi:</strong> ${new Date().toLocaleDateString("tr-TR")}</p>
              </div>
              
              <h2>ÖZET</h2>
              <table>
                <tr>
                  <th>Metrik</th>
                  <th>Değer</th>
                </tr>
                <tr>
                  <td>Toplam KPI Hedefi</td>
                  <td>${kpiTargets?.length || 0}</td>
                </tr>
                <tr>
                  <td>İşlenen Performans Verileri</td>
                  <td>${performanceData?.length || 0}</td>
                </tr>
              </table>
              
              <h2>PERFORMANS VERİLERİ</h2>
              <table>
                <tr>
                  <th>KPI Hedefi</th>
                  <th>Gerçek Değer</th>
                  <th>Durum</th>
                </tr>
                ${performanceData?.map((p: any) => `
                  <tr>
                    <td>${p.kpiTargetId}</td>
                    <td>${p.actualValue}</td>
                    <td>${p.status}</td>
                  </tr>
                `).join("") || "<tr><td colspan='3'>Veri bulunamadı</td></tr>"}
              </table>
              
              <hr style="margin-top: 30px;">
              <p style="font-size: 12px; color: #666;">
                Bu rapor ${new Date().toLocaleDateString("tr-TR")} tarihinde otomatik olarak oluşturulmuştur.
              </p>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }

      toast.success("Rapor başarıyla oluşturuldu");
    } catch (error: any) {
      toast.error(error?.message || "Rapor oluşturma başarısız");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
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
              Rapor Oluşturucu
            </h1>
            <p className="text-muted-foreground">
              Performans raporlarını PDF olarak oluştur ve yazdır
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content container max-w-6xl">
        {/* Report Configuration */}
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle>Rapor Ayarları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Şube *
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="filter-input"
                >
                  <option value="">Şube Seçiniz</option>
                  <option value="all">Tüm Şubeler</option>
                  {branches?.map((branch: any) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Rapor Türü
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="filter-input"
                >
                  <option value="performance">Performans Raporu</option>
                  <option value="kpi">KPI Hedef Raporu</option>
                  <option value="summary">Özet Rapor</option>
                  <option value="performance-monitoring">Performans İzleme</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Dönem
                </label>
                <input
                  type="month"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>

            <div className="flex gap-2">
              {reportType === "performance-monitoring" ? (
                <>
                  <Button
                    onClick={() => downloadHTMLReport()}
                    disabled={isGenerating}
                    className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {isGenerating ? "İndiriliyor..." : "HTML İndir"}
                  </Button>
                  <Button
                    onClick={downloadMasterExcel}
                    disabled={isGenerating}
                    className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {isGenerating ? "İndiriliyor..." : "Excel İndir"}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={generatePDFReport}
                  disabled={!selectedBranch || isGenerating}
                  className="bg-primary hover:bg-primary/90 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {isGenerating ? "Oluşturuluyor..." : "PDF Oluştur"}
                </Button>
              )}
              <Button
                onClick={handlePrint}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Yazdır
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Preview */}
        {selectedBranch && selectedBranch !== "all" && (
          <Card className="border-border mb-6">
            <CardHeader>
              <CardTitle>
                {branches?.find((b: any) => b.id === parseInt(selectedBranch))?.name} - {period} Raporu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Performance Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Performans Özeti
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Toplam KPI Hedefi:</span>
                      <span className="font-semibold">{kpiTargets?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">İşlenen Veri:</span>
                      <span className="font-semibold">{performanceData?.length || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Performance Chart */}
                {performanceData && performanceData.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Performans Dağılımı
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={performanceData}
                          dataKey="actualValue"
                          nameKey="kpiTargetId"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {performanceData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
