import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface PerformanceDataUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PerformanceDataUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: PerformanceDataUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const uploadPerformanceDataMutation = (trpc as any).performanceData.uploadExcel.useMutation();

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
      toast.error("Lütfen Excel dosyası (.xlsx veya .xls) seçiniz");
      return;
    }
    setFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Lütfen dosya seçiniz");
      return;
    }

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const base64 = Buffer.from(arrayBuffer).toString("base64");

        await uploadPerformanceDataMutation.mutateAsync({
          fileName: file.name,
          fileData: base64,
        });

        toast.success("Gerçekleşen KPI verileri başarıyla yüklendi");
        setFile(null);
        onClose();
        onSuccess?.();
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      toast.error(error?.message || "Dosya yükleme başarısız");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerçekleşen KPI Verileri Yükle</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">Excel Dosyası Formatı:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Sütun 1: Dönem (örn: 2026-03)</li>
                <li>Sütun 2: Şube Adı</li>
                <li>Sütun 3: KPI Adı</li>
                <li>Sütun 4: Gerçekleşen Değer</li>
              </ul>
            </div>
          </div>

          {/* File Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium text-foreground mb-2">
              {file ? file.name : "Excel Dosyası Yükle"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {file
                ? "Dosya seçildi. Yüklemek için 'Yükle' butonuna tıklayın"
                : "Dosyayı sürükleyip bırakın veya tıklayarak seçin"}
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) {
                  handleFileSelect(selectedFile);
                }
              }}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("file-input")?.click()}
                className="cursor-pointer"
              >
                Dosya Seç
              </Button>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              İptal
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? "Yükleniyor..." : "Yükle"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
