import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DIMENSIONS = [
  { id: "FINANCE", label: "FİNANS" },
  { id: "CUSTOMER", label: "MÜŞTERİ" },
  { id: "HR", label: "İNSAN KAYNAKLAR" },
];

export default function KPIManagement() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [formData, setFormData] = useState({
    dimension: "FINANCE",
    target: "",
    description: "",
    unit: "",
    frequency: "Aylık",
    weight: 0,
    lowerLimit: 0,
    targetValue: 0,
    upperLimit: 0,
  });

  const { data: branches } = (trpc as any).branches.list.useQuery();
  const { data: kpiTargets, refetch } = (trpc as any).kpiTargets.list.useQuery({
    branchId: selectedBranch ? parseInt(selectedBranch) : undefined,
  });
  const createKPIMutation = (trpc as any).kpiTargets.create.useMutation();
  const updateKPIMutation = (trpc as any).kpiTargets.update.useMutation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login-local");
    }
    if (!loading && user?.role !== "admin") {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, user?.role, navigate]);

  const handleCreateKPI = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBranch || !formData.target) {
      toast.error("Şube ve hedef adı gereklidir");
      return;
    }

    try {
      await createKPIMutation.mutateAsync({
        branchId: parseInt(selectedBranch),
        dimension: formData.dimension,
        target: formData.target,
        description: formData.description || undefined,
        unit: formData.unit || undefined,
        frequency: formData.frequency,
        weight: formData.weight || undefined,
        lowerLimit: formData.lowerLimit || undefined,
        targetValue: formData.targetValue || undefined,
        upperLimit: formData.upperLimit || undefined,
      });

      toast.success("KPI hedefi başarıyla oluşturuldu");
      setFormData({
        dimension: "FINANCE",
        target: "",
        description: "",
        unit: "",
        frequency: "Aylık",
        weight: 0,
        lowerLimit: 0,
        targetValue: 0,
        upperLimit: 0,
      });
      setShowForm(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "KPI hedefi oluşturma başarısız");
    }
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

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="dashboard-header">
        <div className="container">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                KPI Hedef Yönetimi
              </h1>
              <p className="text-muted-foreground">
                Şubeler için KPI hedeflerini oluştur ve yönet
              </p>
            </div>
            {!showForm && (
              <Button
                size="sm"
                onClick={() => setShowForm(true)}
                className="bg-primary hover:bg-primary/90 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Yeni Hedef
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content container">
        {/* Create KPI Form */}
        {showForm && (
          <Card className="border-border mb-6">
            <CardHeader>
              <CardTitle>Yeni KPI Hedefi Oluştur</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateKPI} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Şube *
                    </label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="filter-input"
                      required
                    >
                      <option value="">Şube Seçiniz</option>
                      {branches?.map((branch: any) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Boyut *
                    </label>
                    <select
                      value={formData.dimension}
                      onChange={(e) =>
                        setFormData({ ...formData, dimension: e.target.value })
                      }
                      className="filter-input"
                    >
                      {DIMENSIONS.map((dim) => (
                        <option key={dim.id} value={dim.id}>
                          {dim.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Hedef Adı *
                    </label>
                    <input
                      type="text"
                      value={formData.target}
                      onChange={(e) =>
                        setFormData({ ...formData, target: e.target.value })
                      }
                      className="filter-input"
                      placeholder="Hedef adı"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Açıklama
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="filter-input"
                      placeholder="Açıklama"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Birim
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData({ ...formData, unit: e.target.value })
                      }
                      className="filter-input"
                      placeholder="TL, %, Adet, vb."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Sıklık
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={(e) =>
                        setFormData({ ...formData, frequency: e.target.value })
                      }
                      className="filter-input"
                    >
                      <option value="Aylık">Aylık</option>
                      <option value="Üç Aylık">Üç Aylık</option>
                      <option value="Yıllık">Yıllık</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Ağırlık (%)
                    </label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          weight: parseFloat(e.target.value),
                        })
                      }
                      className="filter-input"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Alt Limit (80)
                    </label>
                    <input
                      type="number"
                      value={formData.lowerLimit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lowerLimit: parseFloat(e.target.value),
                        })
                      }
                      className="filter-input"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Hedef Değer (100)
                    </label>
                    <input
                      type="number"
                      value={formData.targetValue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          targetValue: parseFloat(e.target.value),
                        })
                      }
                      className="filter-input"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Üst Limit (120)
                    </label>
                    <input
                      type="number"
                      value={formData.upperLimit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          upperLimit: parseFloat(e.target.value),
                        })
                      }
                      className="filter-input"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90"
                  >
                    Oluştur
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    İptal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Branch Selection */}
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle>Şube Seçimi</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="filter-input max-w-md"
            >
              <option value="">Tüm Şubeler</option>
              {branches?.map((branch: any) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* KPI Targets Table */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>
              KPI Hedefleri
              {selectedBranch && branches
                ? ` - ${
                    branches.find((b: any) => b.id === parseInt(selectedBranch))
                      ?.name
                  }`
                : ""}
            </CardTitle>
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
                    <th>Ağırlık</th>
                    <th>Alt Limit</th>
                    <th>Hedef</th>
                    <th>Üst Limit</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {kpiTargets?.map((kpi: any) => (
                    <tr key={kpi.id}>
                      <td>
                        <span className="badge bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                          {kpi.dimension}
                        </span>
                      </td>
                      <td className="font-medium text-foreground">
                        {kpi.target}
                      </td>
                      <td className="text-sm text-muted-foreground">
                        {kpi.description || "-"}
                      </td>
                      <td>{kpi.unit || "-"}</td>
                      <td>{kpi.frequency || "-"}</td>
                      <td>{kpi.weight || "-"}%</td>
                      <td>{kpi.lowerLimit || "-"}</td>
                      <td className="font-semibold text-primary">
                        {kpi.targetValue || "-"}
                      </td>
                      <td>{kpi.upperLimit || "-"}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
              {!kpiTargets || kpiTargets.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Henüz KPI hedefi eklenmemiştir
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
