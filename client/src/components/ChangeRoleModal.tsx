import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";

interface ChangeRoleModalProps {
  user: any;
  branches: any[];
  onClose: () => void;
  onSave: (userId: number, role: string, branchId?: number) => Promise<void>;
}

export default function ChangeRoleModal({ user, branches, onClose, onSave }: ChangeRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [selectedBranchId, setSelectedBranchId] = useState(user.branchId || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(
        user.id,
        selectedRole,
        selectedBranchId ? parseInt(selectedBranchId) : undefined
      );
      toast.success("Rol başarıyla güncellendi");
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Rol güncelleme başarısız");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="border-border w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Rol Değiştir</CardTitle>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Kullanıcı: <span className="text-foreground font-semibold">{user.name}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Yeni Rol
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="filter-input"
            >
              <option value="user">Kullanıcı</option>
              <option value="branch_manager">Şube Yöneticisi</option>
              <option value="operations_manager">Operasyon Müdürü</option>
              <option value="region_manager">Bölge Operasyon Müdürü</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {(selectedRole === "branch_manager" || selectedRole === "operations_manager") && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Şube Ataması
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
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
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 flex-1"
            >
              {isLoading ? "Kaydediliyor..." : "Kaydet"}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isLoading}
              className="flex-1"
            >
              İptal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
