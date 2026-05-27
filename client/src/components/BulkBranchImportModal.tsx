import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Copy } from "lucide-react";

interface BulkBranchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BulkBranchImportModal({
  isOpen,
  onClose,
  onSuccess,
}: BulkBranchImportModalProps) {
  const [branchText, setBranchText] = useState("");
  const [importedBranches, setImportedBranches] = useState<string[]>([]);
  const [step, setStep] = useState<"input" | "preview" | "success">("input");

  const bulkAddMutation = (trpc as any).branches.bulkAdd.useMutation({
    onSuccess: () => {
      toast.success("Şubeler başarıyla eklendi");
      setStep("success");
      onSuccess?.();
      setTimeout(() => {
        handleClose();
      }, 2000);
    },
    onError: (error: any) => {
      toast.error(error.message || "Şube ekleme başarısız");
    },
  });

  const parseBranches = () => {
    const lines = branchText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const branches = lines.map((line) => {
      // "BY ŞUBE ADI" formatından şube adını çıkar
      const match = line.match(/^BY\s+(.+)$/i);
      return match ? match[1].trim() : line;
    });

    if (branches.length === 0) {
      toast.error("Hiçbir şube bulunamadı");
      return;
    }

    setImportedBranches(branches);
    setStep("preview");
  };

  const handleImport = () => {
    if (importedBranches.length === 0) {
      toast.error("Lütfen şubeleri seçin");
      return;
    }

    bulkAddMutation.mutate({
      branches: importedBranches.map((name) => ({
        name,
        status: "active",
      })),
    });
  };

  const handleClose = () => {
    setBranchText("");
    setImportedBranches([]);
    setStep("input");
    onClose();
  };

  const handleCopyExample = () => {
    const example = `BY AFYON WATERMALL
BY ANTALYA ALANYA AKDENİZ AVM
BY ANTALYA ALANYA CADDE
BY AYDIN EFELER
BY BURSA KENT MEYDANI AVM`;
    navigator.clipboard.writeText(example);
    toast.success("Örnek metin kopyalandı");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Toplu Şube Ekleme</DialogTitle>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Şube Adlarını Yapıştırın</p>
                <p>
                  Her satırda bir şube adı olacak şekilde yapıştırın. "BY" ön eki
                  otomatik olarak kaldırılacaktır.
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Şube Adları ({branchText.split("\n").filter((l) => l.trim()).length} satır)
              </label>
              <Textarea
                value={branchText}
                onChange={(e) => setBranchText(e.target.value)}
                placeholder="BY AFYON WATERMALL
BY ANTALYA ALANYA AKDENİZ AVM
BY ANTALYA ALANYA CADDE
..."
                className="font-mono text-sm min-h-64"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCopyExample}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Örnek Yapıştır
              </Button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                İptal
              </Button>
              <Button
                onClick={parseBranches}
                disabled={branchText.trim().length === 0}
                className="bg-primary hover:bg-primary/90"
              >
                Önizleme
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800 dark:text-green-200">
                <p className="font-medium mb-1">
                  {importedBranches.length} şube eklemeye hazır
                </p>
                <p>Aşağıdaki şubeleri sisteme ekleyecek. Devam etmek istiyor musunuz?</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Eklenecek Şubeler ({importedBranches.length})
              </label>
              <Card className="border-border max-h-64 overflow-y-auto">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {importedBranches.map((branch, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-muted rounded text-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-foreground">{branch}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep("input")}
              >
                Geri Dön
              </Button>
              <Button
                onClick={handleImport}
                disabled={bulkAddMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {bulkAddMutation.isPending ? "Ekleniyor..." : "Şubeleri Ekle"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Başarılı!
              </h3>
              <p className="text-muted-foreground">
                {importedBranches.length} şube sisteme başarıyla eklendi.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
