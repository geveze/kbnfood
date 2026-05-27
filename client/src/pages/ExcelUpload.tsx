import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { toast } from "sonner";
import { parseFile, generateTargetTemplate, generateActualTemplate } from "@/lib/excelParser";

export default function ExcelUpload() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadType, setUploadType] = useState<"actual" | "target">("actual");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = (trpc as any).bulkUpload.uploadActualValues.useMutation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login-local");
    }
    if (!loading && user?.role !== "admin") {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, user?.role, navigate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // CSV veya Excel dosyası kontrolü
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith(".csv")) {
      toast.error("Lütfen CSV veya Excel dosyası seçiniz");
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Lütfen dosya seçiniz");
      return;
    }

    setIsProcessing(true);
    try {
      // Dosyayı parse et
      const parseResult = await parseFile(file);

      if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
        setUploadResult(parseResult);
        toast.error("Dosya parsing hatası");
        setIsProcessing(false);
        return;
      }

      // Backend'e gönder
      const result = await uploadMutation.mutateAsync({
        data: parseResult.data,
      });

      setUploadResult({
        ...result,
        fileName: file.name,
        totalRows: parseResult.totalRows,
        parseWarnings: parseResult.warnings,
      });

      if (result.failed === 0) {
        toast.success(`${result.successful} satır başarıyla yüklendi`);
      } else {
        toast.warning(
          `${result.successful} satır yüklendi, ${result.failed} satırda hata oluştu`
        );
      }
    } catch (error: any) {
      toast.error(error?.message || "Dosya yükleme başarısız");
      setUploadResult({
        errors: [{ row: 0, error: error?.message || "Bilinmeyen hata" }],
        successful: 0,
        failed: 0,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = (type: "actual" | "target") => {
    const template = type === "actual" ? generateActualTemplate() : generateTargetTemplate();
    const fileName = type === "actual" ? "keban_gerçekleşen_template.csv" : "keban_hedef_template.csv";

    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      {/* Header */}
      <div className="dashboard-header">
        <div className="container">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Excel Toplu Yükleme
            </h1>
            <p className="text-muted-foreground">
              CSV veya Excel dosyasından performans verilerini yükleyin
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content container max-w-4xl">
        {/* Upload Type Selection */}
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle>Yükleme Türü Seçin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                variant={uploadType === "actual" ? "default" : "outline"}
                onClick={() => {
                  setUploadType("actual");
                  setUploadResult(null);
                  setFile(null);
                }}
              >
                Gerçekleşen Veri Yükle
              </Button>
              <Button
                variant={uploadType === "target" ? "default" : "outline"}
                onClick={() => {
                  setUploadType("target");
                  setUploadResult(null);
                  setFile(null);
                }}
                disabled
              >
                Hedef Veri Yükle (Yakında)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upload Card */}
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle>Dosya Yükle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* File Input */}
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-4">
                  <Upload className="w-12 h-12 text-muted-foreground" />
                  <div>
                    <p className="text-foreground font-medium mb-1">
                      Dosya seçmek için tıklayın veya sürükleyin
                    </p>
                    <p className="text-sm text-muted-foreground">
                      CSV veya Excel dosyası (maksimum 10 MB)
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Dosya Seç
                  </Button>
                </div>
              </div>

              {/* Selected File */}
              {file && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Seçilen dosya:</span> {file.name}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={!file || isProcessing || uploadMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isProcessing || uploadMutation.isPending ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      İşleniyor...
                    </>
                  ) : (
                    "Yükle ve İşle"
                  )}
                </Button>
                <Button
                  onClick={() => downloadTemplate(uploadType)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Şablon İndir
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Result */}
        {uploadResult && (
          <Card className="border-border mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {uploadResult.errors.length === 0 ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Yükleme Başarılı
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Yükleme Tamamlandı (Hatalar Var)
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">
                    Toplam Satır
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {uploadResult.totalRows}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">
                    Başarılı
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {uploadResult.successful}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Hata</p>
                  <p className="text-2xl font-bold text-red-600">
                    {uploadResult.failed}
                  </p>
                </div>
              </div>

              {/* Warnings */}
              {uploadResult.parseWarnings && uploadResult.parseWarnings.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                    Uyarılar
                  </h4>
                  <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                    {uploadResult.parseWarnings.map((warning: any, idx: number) => (
                      <li key={idx}>
                        Satır {warning.rowNumber}: {warning.warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Errors */}
              {uploadResult.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                    Hatalar
                  </h4>
                  <ul className="space-y-1 text-sm text-red-800 dark:text-red-200 max-h-48 overflow-y-auto">
                    {uploadResult.errors.map((error: any, idx: number) => (
                      <li key={idx}>
                        Satır {error.row}: {error.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    setUploadResult(null);
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  variant="outline"
                >
                  Başka Dosya Yükle
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
