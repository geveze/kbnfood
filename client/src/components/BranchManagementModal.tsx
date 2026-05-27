import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BranchManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch?: {
    id: number;
    name: string;
    code: string;
    region?: string;
    manager?: string;
    address?: string;
    phone?: string;
  } | null;
  onSuccess?: () => void;
}

export default function BranchManagementModal({
  isOpen,
  onClose,
  branch,
  onSuccess,
}: BranchManagementModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    region: "",
    manager: "",
    address: "",
    phone: "",
    branchEmail: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  // Bölge sorumlusu kullanıcılarını listele
  const { data: regionManagers } = (trpc as any).users.listByRole.useQuery({ role: "region_manager" });

  // Şube ekleme/düzenleme mutation
  const createBranchMutation = (trpc as any).branches.create.useMutation({
    onSuccess: () => {
      toast.success(branch ? "Şube başarıyla güncellendi" : "Şube başarıyla eklendi");
      handleClose();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "İşlem başarısız oldu");
    },
  });

  const updateBranchMutation = (trpc as any).branches.update.useMutation({
    onSuccess: () => {
      toast.success("Şube başarıyla güncellendi");
      handleClose();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "İşlem başarısız oldu");
    },
  });

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || "",
        code: branch.code || "",
        region: branch.region || "",
        manager: branch.manager || "",
        address: branch.address || "",
        phone: branch.phone || "",
        branchEmail: (branch as any).branchEmail || "",
      });
    } else {
      setFormData({
        name: "",
        code: "",
        region: "",
        manager: "",
        address: "",
        phone: "",
        branchEmail: "",
      });
    }
  }, [branch, isOpen]);

  const handleClose = () => {
    setFormData({
      name: "",
      code: "",
      region: "",
      manager: "",
      address: "",
      phone: "",
      branchEmail: "",
    });
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.code) {
      toast.error("Şube adı ve kodu zorunludur");
      return;
    }

    setIsLoading(true);

    try {
      if (branch) {
        await updateBranchMutation.mutateAsync({
          id: branch.id,
          ...formData,
        });
      } else {
        await createBranchMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {branch ? "Şube Düzenle" : "Yeni Şube Ekle"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Şube Adı */}
          <div className="space-y-2">
            <Label htmlFor="name">Şube Adı *</Label>
            <Input
              id="name"
              placeholder="Şube adını giriniz"
              value={formData.name}
              onChange={(e) => handleInputChange(e, "name")}
              disabled={isLoading}
            />
          </div>

          {/* Şube Kodu */}
          <div className="space-y-2">
            <Label htmlFor="code">Şube Kodu *</Label>
            <Input
              id="code"
              placeholder="Şube kodunu giriniz"
              value={formData.code}
              onChange={(e) => handleInputChange(e, "code")}
              disabled={isLoading}
            />
          </div>

          {/* Bölge */}
          <div className="space-y-2">
            <Label htmlFor="region">Bölge</Label>
            <Select value={formData.region} onValueChange={(value) => handleSelectChange("region", value)}>
              <SelectTrigger disabled={isLoading}>
                <SelectValue placeholder="Bölge seçiniz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="istanbul">İstanbul</SelectItem>
                <SelectItem value="ankara">Ankara</SelectItem>
                <SelectItem value="izmir">İzmir</SelectItem>
                <SelectItem value="antalya">Antalya</SelectItem>
                <SelectItem value="adana">Adana</SelectItem>
                <SelectItem value="gaziantep">Gaziantep</SelectItem>
                <SelectItem value="konya">Konya</SelectItem>
                <SelectItem value="bursa">Bursa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bölge Sorumlusu */}
          <div className="space-y-2">
            <Label htmlFor="manager">Bölge Sorumlusu</Label>
            <Select value={formData.manager} onValueChange={(value) => handleSelectChange("manager", value)}>
              <SelectTrigger disabled={isLoading}>
                <SelectValue placeholder="Bölge sorumlusunu seçiniz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Seçilmedi</SelectItem>
                {regionManagers?.map((user: any) => (
                  <SelectItem key={user.id} value={user.name}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Adres */}
          <div className="space-y-2">
            <Label htmlFor="address">Adres</Label>
            <Input
              id="address"
              placeholder="Şubenin adresini giriniz"
              value={formData.address}
              onChange={(e) => handleInputChange(e, "address")}
              disabled={isLoading}
            />
          </div>

          {/* Telefon */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              placeholder="Şubenin telefon numarasını giriniz"
              value={formData.phone}
              onChange={(e) => handleInputChange(e, "phone")}
              disabled={isLoading}
            />
          </div>

          {/* Şube/Yönetici E-posta */}
          <div className="space-y-2">
            <Label htmlFor="branchEmail">Şube/Yönetici E-posta</Label>
            <Input
              id="branchEmail"
              type="email"
              placeholder="Şubenin veya yöneticisinin e-posta adresini giriniz"
              value={formData.branchEmail}
              onChange={(e) => handleInputChange(e, "branchEmail")}
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {branch ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
