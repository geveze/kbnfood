import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";

function getRoleLabel(role?: string) {
  switch (role) {
    case "admin":
      return "Yönetici";
    case "region_manager":
      return "Bölge Müdürü";
    case "branch_manager":
      return "Şube Yöneticisi";
    case "operations_manager":
      return "Operasyon Müdürü";
    default:
      return "Kullanıcı";
  }
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  
  const { data: branches } = (trpc as any).branches.list.useQuery();
  const { data: periods } = (trpc as any).kpiTargetCards.getPeriods.useQuery();
  const { data: dashboardSummary } = (trpc as any).kpiTargetCards.getDashboardSummary.useQuery(
    { period: selectedPeriod || "" },
    { enabled: !!selectedPeriod }
  );
  const { data: targetCards } = (trpc as any).kpiTargetCards.list.useQuery({
    period: selectedPeriod || undefined,
  });
  
  // Tüm dönemlerin verilerini çek
  const { data: allPeriodKpis } = (trpc as any).kpiTargetCards.list.useQuery({
    period: undefined,
  });
  
  // İlk dönem otomatik seç
  useEffect(() => {
    if (periods && periods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(periods[0]);
    }
  }, [periods, selectedPeriod]);
  
  // Dinamik verilerden dashboard kartlarını hesapla
  const dashboardMetrics = useMemo(() => {
    if (!dashboardSummary) {
      return {
        averagePerformance: 0,
        financialPerformance: 0,
        customerPerformance: 0,
        hrPerformance: 0,
        performanceTrend: [],
        dimensionData: [],
        kpiComparison: [],
      };
    }
    
    const avgPerf = dashboardSummary.averagePerformance || 0;
    const finScore = dashboardSummary.financialPerformance || 0;
    const custScore = dashboardSummary.customerPerformance || 0;
    const hrScore = dashboardSummary.hrPerformance || 0;
    
    return {
      averagePerformance: avgPerf,
      financialPerformance: finScore,
      customerPerformance: custScore,
      hrPerformance: hrScore,
      performanceTrend: [
        { month: "Ocak", target: 100, actual: 95, score: 95 },
        { month: "Şubat", target: 100, actual: 102, score: 102 },
        { month: "Mart", target: 100, actual: avgPerf, score: avgPerf },
      ],
      dimensionData: [
        { name: "Finans", value: Math.round(finScore), fill: "#f97316" },
        { name: "Müşteri", value: Math.round(custScore), fill: "#fb923c" },
        { name: "İnsan", value: Math.round(hrScore), fill: "#fdba74" },
      ],
      kpiComparison: targetCards?.slice(0, 4).map((card: any) => ({
        name: card.target,
        target: 100,
        actual: Math.round(card.score || 0),
      })) || [],
    };
  }, [dashboardSummary, targetCards]);

  // Ciro hedefi trend verilerini hesapla
  const ciroDashboard = useMemo(() => {
    if (!allPeriodKpis || allPeriodKpis.length === 0) {
      return {
        trendData: [],
        kpiPerformanceData: [],
      };
    }
    
    // Dönem bazında ciro hedeflerini grupla
    const ciroByPeriod: Record<string, { target: number; actual: number; count: number }> = {};
    const kpiPerf: Record<string, { target: number; actual: number; count: number }> = {};
    
    allPeriodKpis.forEach((kpi: any) => {
      const period = kpi.period || 'Bilinmiyor';
      
      // Ciro hedeflerini filtrele
      if (kpi.target && kpi.target.toLowerCase().includes('ciro')) {
        if (!ciroByPeriod[period]) {
          ciroByPeriod[period] = { target: 0, actual: 0, count: 0 };
        }
        const targetVal = parseFloat(kpi.targetValue) || 0;
        const actualVal = parseFloat(kpi.actualValue) || 0;
        ciroByPeriod[period].target += targetVal;
        ciroByPeriod[period].actual += actualVal;
        ciroByPeriod[period].count += 1;
      }
      
      // KPI performans verilerini topla
      if (!kpiPerf[kpi.target]) {
        kpiPerf[kpi.target] = { target: 0, actual: 0, count: 0 };
      }
      const score = parseFloat(kpi.score) || 0;
      kpiPerf[kpi.target].target += 100;
      kpiPerf[kpi.target].actual += score;
      kpiPerf[kpi.target].count += 1;
    });
    
    // Trend verilerini hazırla
    const trendData = Object.entries(ciroByPeriod)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({
        period,
        target: Math.round(data.target / data.count),
        actual: Math.round(data.actual / data.count),
      }));
    
    // KPI performans verilerini hazırla
    const kpiPerformanceData = Object.entries(kpiPerf)
      .slice(0, 6)
      .map(([name, data]) => ({
        name: name.substring(0, 20),
        target: 100,
        actual: Math.round(data.actual / data.count),
      }));
    
    return {
      trendData,
      kpiPerformanceData,
    };
  }, [allPeriodKpis]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login-local");
    }
  }, [isAuthenticated, loading, navigate]);

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
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 md:ml-64">
      {/* Header */}
      <div className="dashboard-header">
        <div className="container">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Operasyonel Performans Paneli</h1>
              <p className="text-muted-foreground">Hoş geldiniz, {user?.name || "Kullanıcı"}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Rol: <span className="font-semibold text-foreground">{getRoleLabel(user?.role)}</span></p>
              <p className="text-sm text-muted-foreground">Şubeler: <span className="font-semibold text-foreground">{String(branches?.length || 0)}</span></p>
              <div className="mt-2">
                <label className="text-sm text-muted-foreground mr-2">Dönem:</label>
                <select 
                  value={selectedPeriod} 
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="text-sm px-2 py-1 rounded border border-border bg-background text-foreground"
                >
                  {periods?.map((period: string) => (
                    <option key={period} value={period}>{period}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content container">
        {/* KPI Summary Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Performans Özeti</h2>
          <div className="kpi-grid">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ortalama Performans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{dashboardMetrics.averagePerformance}%</div>
                <div className="flex items-center gap-1 mt-2 text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium">Mevcut dönem</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Finansal Performans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{dashboardMetrics.financialPerformance}%</div>
                <div className="flex items-center gap-1 mt-2 text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium">Finans boyutu</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Müşteri Performansı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{dashboardMetrics.customerPerformance}%</div>
                <div className="flex items-center gap-1 mt-2 text-orange-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Müşteri boyutu</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">İnsan Kaynakları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{dashboardMetrics.hrPerformance}%</div>
                <div className="flex items-center gap-1 mt-2 text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium">İK boyutu</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Trend */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Performans Trendi</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardMetrics.performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="target" stroke="#8884d8" name="Hedef" />
                  <Line type="monotone" dataKey="actual" stroke="#82ca9d" name="Gerçekleşen" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Dimension Distribution */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Boyut Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardMetrics.dimensionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardMetrics.dimensionData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Ay Bazlı Ciro Hedefi Trendi */}
        <Card className="border-border mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Ay Bazlı Ciro Hedefi Trendi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={ciroDashboard.trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="period" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#f5f5f5", border: "1px solid #ccc" }}
                  formatter={(value) => `₺${value.toLocaleString('tr-TR')}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 6 }}
                  activeDot={{ r: 8 }}
                  name="Hedef Ciro"
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 6 }}
                  activeDot={{ r: 8 }}
                  name="Gerçekleşen Ciro"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* KPI Performans Karşılaştırması */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5 text-orange-600" />
              KPI Performans Karşılaştırması (Hedef vs Gerçekleşen)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={ciroDashboard.kpiPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" label={{ value: 'Puan (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#f5f5f5", border: "1px solid #ccc" }}
                  formatter={(value) => `${value}%`}
                />
                <Legend />
                <Bar dataKey="target" fill="#3b82f6" name="Hedef Puan" radius={[8, 8, 0, 0]} />
                <Bar dataKey="actual" fill="#10b981" name="Gerçekleşen Puan" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
