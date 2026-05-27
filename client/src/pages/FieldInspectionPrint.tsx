import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, Download, X, Home } from "lucide-react";

export default function FieldInspectionPrint() {
  const [location, setLocation] = useLocation();
  const inspectionId = location ? parseInt(location.split('/').pop() || '0') : null;
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  


  // Denetim detaylarını getir
  const inspectionQuery = (trpc as any).fieldInspection.getInspectionById.useQuery(
    { inspectionId: inspectionId || 0 },
    { enabled: inspectionId !== null && inspectionId !== undefined }
  );

  useEffect(() => {
    if (inspectionQuery.data?.inspection && inspectionId) {
      // PDF URL'sini oluştur
      const url = `/api/inspection/${inspectionId}/pdf`;
      setPdfUrl(url);
      setLoading(false);
    }
  }, [inspectionQuery.data?.inspection?.id, inspectionId]);

  if (loading || !pdfUrl) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">PDF hazırlanıyor...</p>
          {inspectionQuery.error && (
            <p className="text-red-600 mt-2">Hata: {inspectionQuery.error.message}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Kontrol Paneli */}
        <Card className="mb-4 sticky top-4 z-10">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">PDF Yazdırma</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3 flex-wrap">
            <Button
              onClick={() => window.print()}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="w-4 h-4" />
              Yazdır
            </Button>
            <Button
              onClick={() => {
                const link = document.createElement("a");
                link.href = pdfUrl;
                link.download = `Denetim_${inspectionId}.pdf`;
                link.click();
              }}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              İndir
            </Button>
            <Button
              onClick={() => setLocation("/dashboard")}
              variant="outline"
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Dashboard'a Dön
            </Button>
            <Button
              onClick={() => window.close()}
              variant="outline"
              className="gap-2 ml-auto"
            >
              <X className="w-4 h-4" />
              Kapat
            </Button>
          </CardContent>
        </Card>

        {/* PDF Görüntüleyici */}
        <Card>
          <CardContent className="p-0">
            <iframe
              src={pdfUrl}
              className="w-full h-screen border-0"
              title="Denetim Raporu PDF"
            />
          </CardContent>
        </Card>
      </div>

      {/* Yazdırma Stili */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .sticky {
            position: static !important;
          }
          iframe {
            border: none !important;
            height: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
