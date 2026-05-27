import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";
import { Filter, Download } from "lucide-react";

const PERFORMANCE_DATA = [
  { month: "Ocak", financial: 98, customer: 92, hr: 88, overall: 92.7 },
  { month: "Şubat", financial: 102, customer: 90, hr: 90, overall: 94 },
  { month: "Mart", financial: 100, customer: 94, hr: 92, overall: 95.3 },
];

const BRANCH_PERFORMANCE = [
  { branch: "Merkez", financial: 98, customer: 92, hr: 88 },
  { branch: "Şubat", financial: 102, customer: 90, hr: 90 },
  { branch: "Mart", financial: 100, customer: 94, hr: 92 },
  { branch: "Nisan", financial: 105, customer: 95, hr: 94 },
];

export default function Performance() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: "2026-01-01", end: "2026-03-31" });

  // Rol tabanli erisim kontrolu
  // Sube muduru ise otomatik olarak kendi subesini secilsin
  const effectiveBranchId = user?.role === "branch_manager" ? user?.branchId?.toString() : selectedBranch;

  const { data: branches } = (trpc as any).branches.list.useQuery();
  const { data: performanceData } = (trpc as any).performanceData.list.useQuery({
    branchId: effectiveBranchId ? parseInt(effectiveBranchId) : undefined,
  });

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="dashboard-header">
        <div className="container">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Performans Analizi</h1>
              <p className="text-muted-foreground">Şube ve KPI performans metriklerinin detaylı analizi</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Rapor İndir
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content container">
        {/* Filters */}
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtreler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Şube</label>
            {user?.role === "branch_manager" ? (
              <div className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground">
                {branches?.find((b: any) => b.id === user?.branchId)?.name || "Şube Bilgisi Yok"}
              </div>
            ) : (
              <select
                value={selectedBranch || ""}
                onChange={(e) => setSelectedBranch(e.target.value || null)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Tüm Şubeler</option>
                {branches?.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            )}
          </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Başlangıç Tarihi</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="filter-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Bitiş Tarihi</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="filter-input"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Trend */}
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle>Performans Trendi (Aylık)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={PERFORMANCE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="financial" name="Finansal" stroke="#f97316" strokeWidth={2} />
                <Line type="monotone" dataKey="customer" name="Müşteri" stroke="#fb923c" strokeWidth={2} />
                <Line type="monotone" dataKey="hr" name="İnsan Kaynakları" stroke="#fdba74" strokeWidth={2} />
                <Line type="monotone" dataKey="overall" name="Genel Ortalama" stroke="#ea580c" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Branch Comparison */}
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle>Şube Karşılaştırması</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={BRANCH_PERFORMANCE}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="branch" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                  }}
                />
                <Legend />
                <Bar dataKey="financial" name="Finansal" fill="#f97316" />
                <Bar dataKey="customer" name="Müşteri" fill="#fb923c" />
                <Bar dataKey="hr" name="İnsan Kaynakları" fill="#fdba74" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Details Table */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Detaylı Performans Verileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Şube</th>
                    <th>Dönem</th>
                    <th>KPI Hedefi</th>
                    <th>Gerçek Değer</th>
                    <th>Puan</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { branch: "Merkez", period: "2026-03", kpi: "Ciro", actual: 98000, score: 98, status: "on_target" },
                    { branch: "Merkez", period: "2026-03", kpi: "Karlılık", actual: 35.2, score: 105, status: "above_target" },
                    { branch: "Merkez", period: "2026-03", kpi: "Müşteri Memnuniyeti", actual: 92, score: 92, status: "on_target" },
                    { branch: "Şubat", period: "2026-03", kpi: "Ciro", actual: 102000, score: 102, status: "above_target" },
                    { branch: "Şubat", period: "2026-03", kpi: "Karlılık", actual: 34.5, score: 98, status: "on_target" },
                    { branch: "Şubat", period: "2026-03", kpi: "Müşteri Memnuniyeti", actual: 90, score: 90, status: "on_target" },
                  ].map((row, idx) => (
                    <tr key={idx}>
                      <td className="font-medium text-foreground">{row.branch}</td>
                      <td>{row.period}</td>
                      <td>{row.kpi}</td>
                      <td>{row.actual}</td>
                      <td className="font-semibold text-primary">{row.score}</td>
                      <td>
                        <span className={`performance-badge ${getStatusClass(row.status)}`}>
                          {getStatusLabel(row.status)}
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
    </div>
  );
}

function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    above_target: "excellent",
    on_target: "good",
    below_target: "critical",
  };
  return classes[status] || "warning";
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    above_target: "Hedefin Üstünde",
    on_target: "Hedefte",
    below_target: "Hedefin Altında",
  };
  return labels[status] || "Bilinmiyor";
}
