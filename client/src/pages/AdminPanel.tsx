import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, Trash2, Upload, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import ExcelImportModal from "@/components/ExcelImportModal";
import PageHeader from "@/components/PageHeader";
import UserManagementContent from "@/pages/UserManagement";
import PerformanceDataUploadModal from "@/components/PerformanceDataUploadModal";
import BulkBranchImportModal from "@/components/BulkBranchImportModal";
import EditBranchModal from "@/components/EditBranchModal";
import DeleteBranchDialog from "@/components/DeleteBranchDialog";
import PeriodManagement from "@/components/PeriodManagement";
import EmailSettingsPanel from "@/components/EmailSettingsPanel";

export default function AdminPanel() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("branches");
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isPerformanceDataModalOpen, setIsPerformanceDataModalOpen] = useState(false);
  const [isBulkBranchModalOpen, setIsBulkBranchModalOpen] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<number | undefined>();
  const [deletingBranchId, setDeletingBranchId] = useState<number | undefined>();
  const [deletingBranchName, setDeletingBranchName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data: branches, refetch: refetchBranches } = (trpc as any).branches.list.useQuery();
  const { data: bulkHistory } = (trpc as any).bulkUpload.history.useQuery();
  const { refetch: refetchKPICards } = (trpc as any).kpiTargetCards.list.useQuery({});

  const changePasswordMutation = (trpc as any).auth.changePassword.useMutation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login-local");
    }
    if (!loading && user?.role !== "admin") {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, user?.role, navigate]);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Tüm alanları doldurunuz");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Yeni şifreler eşleşmiyor");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });

      toast.success("Şifre başarıyla değiştirildi");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error?.message || "Şifre değiştirme başarısız");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Admin Paneli" />
      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={() => {
          refetchKPICards();
          toast.success("KPI hedef kartları başarıyla yüklendi");
        }}
      />

      {/* Performance Data Upload Modal */}
      <PerformanceDataUploadModal
        isOpen={isPerformanceDataModalOpen}
        onClose={() => setIsPerformanceDataModalOpen(false)}
        onSuccess={() => {
          toast.success("Gerçekleşen KPI verileri başarıyla yüklendi");
        }}
      />

      {/* Bulk Branch Import Modal */}
      <BulkBranchImportModal
        isOpen={isBulkBranchModalOpen}
        onClose={() => setIsBulkBranchModalOpen(false)}
        onSuccess={() => {
          refetchBranches();
        }}
      />

      {/* Edit Branch Modal */}
      <EditBranchModal
        isOpen={!!editingBranchId}
        onClose={() => setEditingBranchId(undefined)}
        branchId={editingBranchId}
        onSuccess={() => {
          refetchBranches();
        }}
      />

      {/* Delete Branch Dialog */}
      <DeleteBranchDialog
        isOpen={!!deletingBranchId}
        onClose={() => {
          setDeletingBranchId(undefined);
          setDeletingBranchName("");
        }}
        branchId={deletingBranchId}
        branchName={deletingBranchName}
        onSuccess={() => {
          refetchBranches();
        }}
      />

      {/* Header */}
      <div className="dashboard-header">
        <div className="container flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Paneli</h1>
            <p className="text-muted-foreground">Sistem yönetimi ve yapılandırması</p>
          </div>
          <Button
            onClick={() => setIsExcelModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90"
          >
            <Upload className="w-4 h-4" />
            Excel Yükle
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content container">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="branches">Şubeler</TabsTrigger>
            <TabsTrigger value="periods">Dönemler</TabsTrigger>
            <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
            <TabsTrigger value="kpi">KPI Hedefleri</TabsTrigger>
            <TabsTrigger value="upload">Toplu Yükleme</TabsTrigger>
            <TabsTrigger value="reports">Raporlar</TabsTrigger>
            <TabsTrigger value="settings">Ayarlar</TabsTrigger>
          </TabsList>

          {/* Branches Tab */}
          <TabsContent value="branches" className="mt-6">
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Şube Yönetimi ({String(branches?.length || 0)})</CardTitle>
                <Button
                  size="sm"
                  onClick={() => setIsBulkBranchModalOpen(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Toplu Şube Ekle
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Şube Adı</th>
                        <th>Kod</th>
                        <th>Bölge</th>
                        <th>Müdür</th>
                        <th>Durum</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branches?.map((branch: any) => (
                        <tr key={branch.id}>
                          <td className="font-medium text-foreground">{branch.name}</td>
                          <td>{branch.code}</td>
                          <td>{branch.region || "-"}</td>
                          <td>{branch.manager || "-"}</td>
                          <td>
                            <span className={`badge ${branch.status === "active" ? "badge-success" : "badge-warning"}`}>
                              {branch.status === "active" ? "Aktif" : "İnaktif"}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingBranchId(branch.id)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 p-1 rounded transition-colors"
                                title="Düzenle"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingBranchId(branch.id);
                                  setDeletingBranchName(branch.name);
                                }}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 p-1 rounded transition-colors"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <UserManagementContent />
          </TabsContent>

          {/* KPI Targets Tab */}
          <TabsContent value="kpi" className="mt-6">
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>KPI Hedef Yönetimi</CardTitle>
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Hedef
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">KPI hedef yönetimi sayfası yapılıyor...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk Upload Tab */}
          <TabsContent value="upload" className="mt-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Toplu Veri Yükleme</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* KPI Hedef Kartıları */}
                    <Card className="border-border">
                      <CardHeader>
                        <CardTitle className="text-base">KPI Hedef Kartıları</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Hedef Kartıları Detay sheet'ini yükle
                        </p>
                        <Button
                          onClick={() => setIsExcelModalOpen(true)}
                          className="w-full bg-primary hover:bg-primary/90 flex items-center justify-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          KPI Hedef Kartı Yükle
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Gerçekleşen KPI Verileri */}
                    <Card className="border-border">
                      <CardHeader>
                        <CardTitle className="text-base">Gerçekleşen KPI Verileri</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Şubelerin gerçekleşen değerlerini yükle
                        </p>
                        <Button
                          onClick={() => setIsPerformanceDataModalOpen(true)}
                          className="w-full bg-primary hover:bg-primary/90 flex items-center justify-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Gerçekleşen Veri Yükle
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Raporlar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Raporlar sayfası yapılıyor...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Periods Tab */}
          <TabsContent value="periods" className="mt-6">
            <PeriodManagement />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <div className="space-y-6">
              {/* Mail Settings */}
              <EmailSettingsPanel />
              
              {/* Password Change */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Şifre Değiştir</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-w-md">
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Mevcut Şifre
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="filter-input pr-10"
                          placeholder="Mevcut şifrenizi giriniz"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Yeni Şifre
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="filter-input pr-10"
                          placeholder="Yeni şifrenizi giriniz"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Şifreyi Onayla
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="filter-input pr-10"
                          placeholder="Şifrenizi tekrar giriniz"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 pt-4">
                      <Button
                        type="submit"
                        className="flex-1 bg-primary hover:bg-primary/90"
                        disabled={changePasswordMutation.isPending}
                      >
                        {changePasswordMutation.isPending ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
                      </Button>
                    </div>
                  </form>
                </div>
              </CardContent>
            </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
