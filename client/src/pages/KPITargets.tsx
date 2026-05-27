import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Download, Printer } from "lucide-react";

const DIMENSIONS = [
  { id: "FINANCE", label: "FİNANS", color: "bg-blue-100 dark:bg-blue-900" },
  { id: "CUSTOMER", label: "MÜŞTERİ", color: "bg-green-100 dark:bg-green-900" },
  { id: "HR", label: "İNSAN", color: "bg-purple-100 dark:bg-purple-900" },
];

const SAMPLE_TARGETS = [
  {
    id: 1,
    dimension: "FİNANS",
    target: "Ciro / Hamburger Adedi",
    description: "Aylık ciro ve hamburger satış adedi",
    unit: "TL / Adet",
    frequency: "Aylık",
    weight: 25,
    lowerLimit: 80000,
    targetValue: 100000,
    upperLimit: 120000,
  },
  {
    id: 2,
    dimension: "FİNANS",
    target: "Karlılık",
    description: "Brüt karlılık oranı",
    unit: "%",
    frequency: "Aylık",
    weight: 20,
    lowerLimit: 28,
    targetValue: 35,
    upperLimit: 40,
  },
  {
    id: 3,
    dimension: "MÜŞTERİ",
    target: "Müşteri Şikayet Oranı",
    description: "Müşteri şikayet oranı",
    unit: "%",
    frequency: "Aylık",
    weight: 15,
    lowerLimit: 1.5,
    targetValue: 1,
    upperLimit: 0.5,
  },
  {
    id: 4,
    dimension: "MÜŞTERİ",
    target: "Google / Pazaryeri Puanı",
    description: "Google ve pazaryeri puanı ortalaması",
    unit: "Puan",
    frequency: "Aylık",
    weight: 15,
    lowerLimit: 4.0,
    targetValue: 4.5,
    upperLimit: 5.0,
  },
  {
    id: 5,
    dimension: "İNSAN",
    target: "Personel Maliyeti",
    description: "Aylık personel maliyeti",
    unit: "TL",
    frequency: "Aylık",
    weight: 15,
    lowerLimit: 15000,
    targetValue: 12000,
    upperLimit: 10000,
  },
  {
    id: 6,
    dimension: "İNSAN",
    target: "İşgücü Devir Oranı",
    description: "Yıllık işgücü devir oranı",
    unit: "%",
    frequency: "Yıllık",
    weight: 10,
    lowerLimit: 40,
    targetValue: 25,
    upperLimit: 15,
  },
];

export default function KPITargets() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: branches } = (trpc as any).branches.list.useQuery();
  const { data: kpiTargets } = (trpc as any).kpiTargets.list.useQuery({ branchId: user?.branchId || undefined });

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

  const displayTargets = kpiTargets?.length ? kpiTargets : SAMPLE_TARGETS;
  const filteredTargets = selectedDimension
    ? displayTargets.filter((t: any) => t.dimension === selectedDimension)
    : displayTargets;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="dashboard-header">
        <div className="container">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">KPI Hedef Kartı</h1>
              <p className="text-muted-foreground">2026 Yılı Performans Hedefleri</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Yazdır
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                PDF İndir
              </Button>
              {user?.role === "admin" && (
                <Button
                  size="sm"
                  onClick={() => setShowForm(!showForm)}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4" />
                  Yeni Hedef
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content container">
        {/* Branch Info Card */}
        <Card className="border-border mb-8">
          <CardHeader>
            <CardTitle>Şube Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Şube Adı</p>
                <p className="text-lg font-semibold text-foreground">Merkez Şube</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Değerlendirme Dönemi</p>
                <p className="text-lg font-semibold text-foreground">2026 Yılı</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Operasyon Müdürü</p>
                <p className="text-lg font-semibold text-foreground">Ahmet Yılmaz</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dimension Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <Button
            variant={selectedDimension === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedDimension(null)}
            className="bg-primary hover:bg-primary/90"
          >
            Tümü ({displayTargets.length})
          </Button>
          {DIMENSIONS.map((dim) => (
            <Button
              key={dim.id}
              variant={selectedDimension === dim.label ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDimension(dim.label)}
              className={selectedDimension === dim.label ? "bg-primary hover:bg-primary/90" : ""}
            >
              {dim.label} ({displayTargets.filter((t: any) => t.dimension === dim.label).length})
            </Button>
          ))}
        </div>

        {/* KPI Targets Table */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>KPI Hedef Detayları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Boyut</th>
                    <th>Hedef</th>
                    <th>Açıklama</th>
                    <th>Birim</th>
                    <th>Sıklık</th>
                    <th>Ağırlık %</th>
                    <th>Alt Limit (80)</th>
                    <th>Hedef (100)</th>
                    <th>Üst Limit (120)</th>
                    {user?.role === "admin" && <th>İşlemler</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredTargets.map((target: any) => (
                    <tr key={target.id}>
                      <td>
                        <span className={`badge ${getDimensionColor(target.dimension)}`}>
                          {target.dimension}
                        </span>
                      </td>
                      <td className="font-medium text-foreground">{target.target}</td>
                      <td className="text-sm text-muted-foreground">{target.description}</td>
                      <td>{target.unit}</td>
                      <td>{target.frequency}</td>
                      <td className="font-semibold">{target.weight}%</td>
                      <td className="text-sm">{target.lowerLimit}</td>
                      <td className="font-semibold text-primary">{target.targetValue}</td>
                      <td className="text-sm">{target.upperLimit}</td>
                      {user?.role === "admin" && (
                        <td>
                          <div className="flex gap-2">
                            <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-800 dark:text-red-400">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {DIMENSIONS.map((dim) => {
            const dimTargets = displayTargets.filter((t: any) => t.dimension === dim.label);
            const totalWeight = dimTargets.reduce((sum: number, t: any) => sum + (t.weight || 0), 0);
            return (
              <Card key={dim.id} className="border-border">
                <CardHeader>
                  <CardTitle className="text-base">{dim.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Hedef Sayısı:</span>
                      <span className="font-semibold text-foreground">{dimTargets.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Toplam Ağırlık:</span>
                      <span className="font-semibold text-foreground">{totalWeight}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getDimensionColor(dimension: string): string {
  const colors: Record<string, string> = {
    "FİNANS": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    "MÜŞTERİ": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    "İNSAN": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  };
  return colors[dimension] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
}
