import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import ChangeRoleModal from "@/components/ChangeRoleModal";

export default function UserManagement() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [userToChangeRole, setUserToChangeRole] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "user" as "user" | "admin" | "branch_manager" | "operations_manager" | "region_manager",
    branchId: "",
  });

  const { data: users, refetch } = (trpc as any).auth.listUsers.useQuery();
  const { data: branches } = (trpc as any).branches.list.useQuery();
  const createUserMutation = (trpc as any).auth.createUser.useMutation();
  const updateUserMutation = (trpc as any).auth.updateUser.useMutation();
  const deactivateUserMutation = (trpc as any).auth.deactivateUser.useMutation();
  const resetPasswordMutation = (trpc as any).auth.resetUserPassword.useMutation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login-local");
    }
    if (!loading && user?.role !== "admin") {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, user?.role, navigate]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.password || !formData.name || !formData.email) {
      toast.error("Tüm alanları doldurunuz");
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        username: formData.username,
        password: formData.password,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        branchId: formData.branchId ? parseInt(formData.branchId) : undefined,
      });

      toast.success("Kullanıcı başarıyla oluşturuldu");
      setFormData({
        username: "",
        password: "",
        name: "",
        email: "",
        role: "user",
        branchId: "",
      });
      setShowForm(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Kullanıcı oluşturma başarısız");
    }
  };

  const handleResetPassword = async (userId: number) => {
    const newPassword = prompt("Yeni şifre giriniz:");
    if (!newPassword) return;

    try {
      await resetPasswordMutation.mutateAsync({
        userId,
        newPassword,
      });
      toast.success("Şifre başarıyla sıfırlandı");
    } catch (error: any) {
      toast.error(error?.message || "Şifre sıfırlama başarısız");
    }
  };

  const handleDeactivateUser = async (userId: number) => {
    if (!confirm("Bu kullanıcıyı deaktif etmek istediğinizden emin misiniz?")) return;
    try {
      await deactivateUserMutation.mutateAsync({ userId });
      toast.success("Kullanıcı başarıyla deaktif edildi");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Kullanıcı deaktif etme başarısız");
    }
  };

  const handleChangeRole = async (userId: number, role: string, branchId?: number) => {
    try {
      await updateUserMutation.mutateAsync({
        userId,
        role: role as any,
        branchId,
      });
      toast.success("Rol başarıyla değiştirildi");
      setShowRoleModal(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Rol değiştirme başarısız");
    }
  };;

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
              <h1 className="text-3xl font-bold text-foreground mb-2">Kullanıcı Yönetimi</h1>
              <p className="text-muted-foreground">Sistem kullanıcılarını oluştur ve yönet</p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Yeni Kullanıcı
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content container">
        {/* Create User Form */}
        {showForm && (
          <Card className="border-border mb-6">
            <CardHeader>
              <CardTitle>Yeni Kullanıcı Oluştur</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Kullanıcı Adı
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="filter-input"
                      placeholder="Kullanıcı adı"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Şifre
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="filter-input"
                      placeholder="Şifre"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Ad Soyad
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="filter-input"
                      placeholder="Ad Soyad"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="filter-input"
                      placeholder="Email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Rol
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="filter-input"
                    >
                      <option value="user">Kullanıcı</option>
                      <option value="branch_manager">Şube Yöneticisi</option>
                      <option value="operations_manager">Operasyon Müdürü</option>
                      <option value="region_manager">Bölge Operasyon Müdürü</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Şube
                    </label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                      className="filter-input"
                    >
                      <option value="">Seçiniz</option>
                      {branches?.map((branch: any) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-primary hover:bg-primary/90">
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

        {/* Users Table */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Sistem Kullanıcıları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kullanıcı Adı</th>
                    <th>Ad Soyad</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Şube</th>
                    <th>Son Giriş</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((user: any) => (
                    <tr key={user.id}>
                      <td className="font-medium text-foreground">{user.username}</td>
                      <td>{user.name}</td>
                      <td className="text-sm">{user.email}</td>
                      <td>
                        <span className={`badge ${
                          user.role === "admin" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" :
                          user.role === "region_manager" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" :
                          user.role === "branch_manager" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" :
                          user.role === "operations_manager" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100" :
                          "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"
                        }`}>
                          {user.role === "admin" ? "Admin" :
                           user.role === "region_manager" ? "Bölge Müdürü" :
                           user.role === "branch_manager" ? "Şube Yöneticisi" :
                           user.role === "operations_manager" ? "Operasyon Müdürü" : "Kullanıcı"}
                        </span>
                      </td>
                      <td>{user.branchId ? `Şube ${user.branchId}` : "-"}</td>
                      <td className="text-sm text-muted-foreground">
                        {new Date(user.lastSignedIn).toLocaleDateString("tr-TR")}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setUserToChangeRole(user);
                              setShowRoleModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-800 dark:text-purple-400"
                            title="Rol Değiştir"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(user.id)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            title="Şifre Sıfırla"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeactivateUser(user.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400"
                            title="Deaktif Et"
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
      </div>

      {/* Change Role Modal */}
      {showRoleModal && userToChangeRole && (
        <ChangeRoleModal
          user={userToChangeRole}
          branches={branches || []}
          onClose={() => setShowRoleModal(false)}
          onSave={handleChangeRole}
        />
      )}
    </div>
  );
}
