import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import BranchManagementModal from "@/components/BranchManagementModal";

export default function BranchManagement() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);

  const { data: branches, refetch } = (trpc as any).branches.list.useQuery();
  const deleteBranchMutation = (trpc as any).branches.delete.useMutation({
    onSuccess: () => {
      toast.success("Şube başarıyla silindi");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Şube silme başarısız");
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login-local");
    }
    if (!loading && user?.role !== "admin") {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, user?.role, navigate]);

  const handleEditBranch = (branch: any) => {
    setEditingBranch(branch);
    setIsModalOpen(true);
  };

  const handleDeleteBranch = async (branchId: number) => {
    if (window.confirm("Bu şubeyi silmek istediğinizden emin misiniz?")) {
      try {
        await deleteBranchMutation.mutateAsync({ id: branchId });
      } catch (error) {
        console.error("Error deleting branch:", error);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBranch(null);
  };

  const handleModalSuccess = () => {
    refetch();
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
      <PageHeader title="Şubeler" />
      
      {/* Header */}
      <div className="dashboard-header">
        <div className="container">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Şubeler</h1>
              <p className="text-muted-foreground">Keban Food şubelerini oluştur ve yönet</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingBranch(null);
                setIsModalOpen(true);
              }}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Yeni Şube
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content container">
        {/* Branches Table */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Şubeler ({String(branches?.length || 0)})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Şube Adı</th>
                    <th>Kod</th>
                    <th>Bölge</th>
                    <th>Bölge Sorumlusu</th>
                    <th>Adres</th>
                    <th>Telefon</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {branches?.map((branch: any) => (
                    <tr key={branch.id}>
                      <td className="font-medium text-foreground">
                        {branch.name}
                      </td>
                      <td>{branch.code}</td>
                      <td>{branch.region || "-"}</td>
                      <td>{branch.manager || "-"}</td>
                      <td className="text-sm">{branch.address || "-"}</td>
                      <td>{branch.phone || "-"}</td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditBranch(branch)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            title="Düzenle"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBranch(branch.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400"
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
              {!branches || branches.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Henüz şube eklenmemiştir</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branch Management Modal */}
      <BranchManagementModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        branch={editingBranch}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
