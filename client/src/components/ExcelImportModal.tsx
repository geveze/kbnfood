import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ExcelImportModal({
  isOpen,
  onClose,
  onSuccess,
}: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [replacePeriod, setReplacePeriod] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const importExcel = (trpc as any).bulkUpload.importExcel.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
        toast.error("Lütfen Excel dosyası (.xlsx veya .xls) seçiniz");
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Lütfen bir Excel dosyası seçiniz");
      return;
    }

    setIsLoading(true);
    try {
      // Dosyayı Base64'e dönüştür
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = (e.target?.result as string).split(",")[1];
          const response = await importExcel.mutateAsync({
            fileBase64: base64,
            fileName: file.name,
            replacePeriod,
          });

          setResult(response);

          if (response.success) {
            toast.success(response.message || "Excel dosyası başarıyla yüklendi");
            if (onSuccess) {
              setTimeout(() => {
                onSuccess();
                handleClose();
              }, 2000);
            }
          } else {
            toast.error(response.errors?.[0] || "Yükleme başarısız oldu");
          }
        } catch (error: any) {
          toast.error(error.message || "Yükleme sırasında hata oluştu");
          setResult({
            success: false,
            errors: [error.message || "Bilinmeyen hata"],
          });
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error(error.message || "Hata oluştu");
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setReplacePeriod(false);
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Excel Dosyası Yükle</DialogTitle>
          <DialogDescription>
            Hedef Kartları Detay sheet'ini içeren Excel dosyasını yükleyin
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            {/* Dosya Seçici */}
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="excel-file-input"
                disabled={isLoading}
              />
              <label
                htmlFor="excel-file-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {file ? file.name : "Excel dosyası seçmek için tıklayın"}
                </span>
                <span className="text-xs text-muted-foreground">
                  veya sürükleyip bırakın
                </span>
              </label>
            </div>

            {/* Seçenekler */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={replacePeriod}
                  onChange={(e) => setReplacePeriod(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4"
                />
                <span className="text-sm">
                  Aynı dönemin eski verilerini sil ve yenileriyle değiştir
                </span>
              </label>
            </div>

            {/* Butonlar */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                İptal
              </Button>
              <Button
                onClick={handleImport}
                disabled={!file || isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? "Yükleniyor..." : "Yükle"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sonuç */}
            <div
              className={`p-4 rounded-lg flex gap-3 ${
                result.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p
                  className={`font-medium ${
                    result.success ? "text-green-900" : "text-red-900"
                  }`}
                >
                  {result.success ? "Başarılı" : "Hata"}
                </p>
                <p
                  className={`text-sm ${
                    result.success ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {result.message ||
                    (result.success
                      ? `${result.insertedCount} hedef kartı yüklendi`
                      : result.errors?.[0])}
                </p>
              </div>
            </div>

            {/* Uyarılar */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="font-medium text-yellow-900 text-sm mb-2">
                  Uyarılar:
                </p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {result.warnings.map((warning: string, idx: number) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Hata Detayları */}
            {result.errors && result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-medium text-red-900 text-sm mb-2">
                  Hatalar:
                </p>
                <ul className="text-sm text-red-700 space-y-1 max-h-48 overflow-y-auto">
                  {result.errors.map((error: string, idx: number) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Kapat Butonu */}
            <div className="flex justify-end">
              <Button onClick={handleClose} className="bg-primary hover:bg-primary/90">
                Kapat
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
