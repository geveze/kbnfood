import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Download, Calendar, User, CheckCircle, AlertCircle, Home } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface InspectionDetail {
  id: number;
  branchName: string;
  branchCode: string;
  inspectionDate: string;
  inspectorName: string;
  totalScore: number;
  status: string;
  answers: Array<{
    questionText: string;
    categoryName: string;
    answer: "E" | "H";
    earnedPoints: number;
    questionPoints: number;
    explanation?: string;
    photoUrls?: string[];
  }>;
  generalComments?: string;
}

export default function FieldInspectionHistory() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedInspection, setSelectedInspection] = useState<InspectionDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Role göre denetimleri getir
  // Admin ve bölge müdürü: tüm denetimler
  // Şube yöneticisi: sadece kendi şubesinin denetimleri
  const allInspectionsQuery = (trpc as any).fieldInspection.getAllInspections.useQuery(undefined, {
    enabled: !!user && (user.role === "admin" || user.role === "region_manager"),
  });
  
  const branchInspectionsQuery = (trpc as any).fieldInspection.getInspectionsByBranch.useQuery(
    { branchId: user?.branchId || 0 },
    {
      enabled: !!user && user.role !== "admin" && user.role !== "region_manager" && !!user.branchId,
    }
  );
  
  // Kullanıcının rolüne göre doğru veriyi seç
  const inspectionsQuery = user && (user.role === "admin" || user.role === "region_manager") 
    ? allInspectionsQuery 
    : branchInspectionsQuery;

  const handleViewDetail = (inspectionId: number) => {
    // Detay sayfasına navigate et
    setLocation(`/field-inspection-detail/${inspectionId}`);
  };

  const handleDownloadPDF = (inspectionId: number, pdfUrl?: string) => {
    const link = document.createElement("a");
    // Veritabanından gelen PDF URL'sini kullan
    if (pdfUrl) {
      link.href = pdfUrl;
    } else {
      // Fallback: Dinamik PDF endpoint'i kullan
      link.href = `/api/inspection/${inspectionId}/pdf`;
    }
    link.download = `Denetim_${inspectionId}.pdf`;
    link.click();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Başlık ve Dashboard Butonu */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Geçmiş Denetimler</h1>
            <p className="text-gray-600 mt-2">
              {user?.role === "admin" || user?.role === "region_manager"
                ? "Tüm şubelerin denetim geçmişini görüntüleyin ve detaylarını inceleyin"
                : "Şubenizin denetim geçmişini görüntüleyin ve detaylarını inceleyin"}
            </p>
          </div>
          <Button
            onClick={() => setLocation("/dashboard")}
            variant="outline"
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Home className="w-4 h-4" />
            Dashboard'a Dön
          </Button>
        </div>

        {/* Denetimler Listesi */}
        <div className="space-y-4">
          {inspectionsQuery.isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Denetimler yükleniyor...</p>
            </div>
          )}

          {inspectionsQuery.data && inspectionsQuery.data.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-600">Henüz denetim kaydı bulunmamaktadır.</p>
              </CardContent>
            </Card>
          )}

          {inspectionsQuery.data?.map((inspection: any) => (
            <Card key={inspection.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Sol Taraf - Bilgiler */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {inspection.branchName || inspection.branchCode || 'Bilinmeyen Şube'}
                      </h3>
                      {inspection.branchCode && (
                        <span className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded">
                          {inspection.branchCode}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(inspection.inspectionDate), "d MMMM yyyy HH:mm", {
                            locale: tr,
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{inspection.inspectorName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {inspection.totalScore >= 80 ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-green-600">{Number(inspection.totalScore).toFixed(1)}%</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="font-semibold text-red-600">{Number(inspection.totalScore).toFixed(1)}%</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Denetçi Genel Değerlendirmesi */}
                    {inspection.generalAssessment && (
                      <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm font-semibold text-blue-900 mb-1">💬 Denetçi Değerlendirmesi:</p>
                        <p className="text-sm text-gray-700 line-clamp-2">{inspection.generalAssessment}</p>
                      </div>
                    )}
                    
                    {inspection.generalComments && (
                      <div className="mt-4 p-3 bg-amber-50 rounded border border-amber-200">
                        <p className="text-sm font-semibold text-amber-900 mb-1">📝 Genel Açıklamalar:</p>
                        <p className="text-sm text-gray-700 line-clamp-2">{inspection.generalComments}</p>
                      </div>
                    )}
                  </div>

                  {/* Sağ Taraf - Butonlar */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleViewDetail(inspection.id)}
                      size="sm"
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Detay
                    </Button>
                    <Button
                      onClick={() => handleDownloadPDF(inspection.id, (inspection as any).pdfUrl)}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>


      </div>
    </div>
  );
}
