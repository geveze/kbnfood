import { trpc } from "@/lib/trpc";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface DeleteBranchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  branchId?: number;
  branchName?: string;
  onSuccess?: () => void;
}

export default function DeleteBranchDialog({
  isOpen,
  onClose,
  branchId,
  branchName,
  onSuccess,
}: DeleteBranchDialogProps) {
  const deleteMutation = (trpc as any).branches.delete.useMutation({
    onSuccess: () => {
      toast.success("Şube başarıyla silindi");
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "Şube silme başarısız");
    },
  });

  const handleDelete = () => {
    if (branchId) {
      deleteMutation.mutate({ id: branchId });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Şubeyi Sil</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="text-foreground font-medium">{branchName}</span> şubesini silmek istediğinize emin misiniz?
            <br />
            <span className="text-sm text-muted-foreground mt-2 block">
              Bu işlem geri alınamaz. Şubeyle ilişkili tüm veriler silinecektir.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel>İptal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleteMutation.isPending ? "Siliniyor..." : "Sil"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
