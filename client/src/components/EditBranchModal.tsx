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

interface EditBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId?: number;
  onSuccess?: () => void;
}

export default function EditBranchModal({
  isOpen,
  onClose,
  branchId,
  onSuccess,
}: EditBranchModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [region, setRegion] = useState("");
  const [manager, setManager] = useState("");
  const [branchEmail, setBranchEmail] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const { data: branch } = (trpc as any).branches.getById.useQuery(
    { id: branchId || 0 },
    { enabled: !!branchId }
  );

  const updateMutation = (trpc as any).branches.update.useMutation({
    onSuccess: () => {
      toast.success("Şube başarıyla güncellendi");
      onSuccess?.();
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "Şube güncelleme başarısız");
    },
  });

  useEffect(() => {
    if (branch) {
      setName(branch.name || "");
      setCode(branch.code || "");
      setRegion(branch.region || "");
      setManager(branch.manager || "");
      setBranchEmail((branch as any).branchEmail || "");
      setStatus((branch.status as "active" | "inactive") || "active");
    }
  }, [branch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Şube adı gereklidir");
      return;
    }

    if (!code.trim()) {
      toast.error("Şube kodu gereklidir");
      return;
    }

    if (branchId) {
      updateMutation.mutate({
        id: branchId,
        name,
        code,
        region,
        manager,
        branchEmail,
        status,
      });
    }
  };

  const handleClose = () => {
    setName("");
    setCode("");
    setRegion("");
    setManager("");
    setBranchEmail("");
    setStatus("active");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Şube Düzenle</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Şube Adı *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Şube adını girin"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="code">Şube Kodu *</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Şube kodunu girin"
              maxLength={10}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="region">Bölge</Label>
            <Input
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Bölge adını girin (opsiyonel)"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="manager">Müdür</Label>
            <Input
              id="manager"
              value={manager}
              onChange={(e) => setManager(e.target.value)}
              placeholder="Müdür adını girin (opsiyonel)"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="branchEmail">Şube/Yönetici E-posta</Label>
            <Input
              id="branchEmail"
              type="email"
              value={branchEmail}
              onChange={(e) => setBranchEmail(e.target.value)}
              placeholder="E-posta adresini girin (opsiyonel)"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="status">Durum</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">İnaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              İptal
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {updateMutation.isPending ? "Güncelleniyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
