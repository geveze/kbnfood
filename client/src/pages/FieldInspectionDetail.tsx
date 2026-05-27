import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, User, CheckCircle, AlertCircle, Download } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import GuestLayout from "@/components/GuestLayout";

export default function FieldInspectionDetail() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/field-inspection-detail/:inspectionId");
  
  // URL'den view parametresini al (public = izole görünüm)
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const isPublicView = searchParams.get('view') === 'public';
  
  const inspectionId = params?.inspectionId ? parseInt(params.inspectionId) : null;
  
  const inspectionQuery = (trpc as any).fieldInspection.getInspectionById.useQuery(
    { inspectionId: inspectionId! },
    { enabled: !!inspectionId }
  );

  const handleDownloadPDF = () => {
    // Yeni backend PDF endpoint'ini kullan (guncel verilerle)
    if (inspectionId) {
      const link = document.createElement("a");
      link.href = `/pdf/${inspectionId}`;
      link.download = `Denetim_${inspectionId}.pdf`;
      link.click();
    }
  };

  const handleGoBack = () => {
    if (isPublicView) {
      // Public view'de geri gitme butonu yok, sadece kapat
      window.close();
    } else {
      setLocation("/field-inspection-history");
    }
  };

  if (!inspectionId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-red-600">Denetim ID bulunamadı</p>
      </div>
    );
  }

  if (inspectionQuery.isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Denetim detayları yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (inspectionQuery.isError || !inspectionQuery.data) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-red-600">Denetim bulunamadı</p>
      </div>
    );
  }

  const inspection = inspectionQuery.data.inspection;
  const answers = inspectionQuery.data.answers;

  // Kategoriye göre grupla
  const categorizedAnswers = Array.from(
    new Map(
      answers.map((a: any) => [
        a.categoryName,
        answers.filter((x: any) => x.categoryName === a.categoryName),
      ])
    )
  );

  // Kategori başarı oranlarını hesapla
  const categoryScores = categorizedAnswers.map(([categoryName, categoryAnswers]: any) => {
    const totalPoints = categoryAnswers.reduce((sum: number, a: any) => sum + a.questionPoints, 0);
    const earnedPoints = categoryAnswers.reduce((sum: number, a: any) => sum + a.earnedPoints, 0);
    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    return { categoryName, percentage: Math.round(percentage), earnedPoints, totalPoints };
  });

  // Başarı oranına göre renk belirle
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-green-500';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-50';
    if (score >= 80) return 'bg-green-50';
    if (score >= 70) return 'bg-yellow-50';
    if (score >= 60) return 'bg-orange-50';
    return 'bg-red-50';
  };

  const getScoreBorderColor = (score: number) => {
    if (score >= 90) return 'border-green-200';
    if (score >= 80) return 'border-green-200';
    if (score >= 70) return 'border-yellow-200';
    if (score >= 60) return 'border-orange-200';
    return 'border-red-200';
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Sticky Branch Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 -mx-4 px-4 py-3 mb-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-gray-600">Şube Adı</p>
              <p className="text-lg font-bold text-gray-900">{inspection.branchName}</p>
            </div>
            <div className="border-l border-gray-300 pl-4">
              <p className="text-sm text-gray-600">Şube Kodu</p>
              <p className="text-lg font-bold text-blue-600">{inspection.branchCode}</p>
            </div>
          </div>
          {/* Public view'de geri dön butonu gösterme */}
          {!isPublicView && (
            <Button
              onClick={handleGoBack}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Başlık Bilgileri */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-4">Denetim Detayları</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Tarih</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <p className="font-semibold">
                        {format(new Date(inspection.inspectionDate), "d MMMM yyyy HH:mm", {
                          locale: tr,
                        })}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Denetçi</p>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <p className="font-semibold">{inspection.inspectorName}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Başarı Oranı</p>
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 rounded-full flex items-center justify-center" style={{
                        background: `conic-gradient(${Number(inspection.totalScore) >= 80 ? '#16a34a' : '#dc2626'} 0deg ${(Number(inspection.totalScore) / 100) * 360}deg, #e5e7eb ${(Number(inspection.totalScore) / 100) * 360}deg 360deg)`,
                      }}>
                        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                          <p className={`font-bold text-sm ${getScoreColor(Number(inspection.totalScore))}`}>
                            {Number(inspection.totalScore).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className={`font-semibold text-lg ${getScoreColor(Number(inspection.totalScore))}`}>
                          {Number(inspection.totalScore) >= 80 ? '✓ Başarılı' : '⚠ Dikkat Gerekli'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {Number(inspection.totalScore) >= 90 ? 'Mükemmel' :
                           Number(inspection.totalScore) >= 80 ? 'İyi' :
                           Number(inspection.totalScore) >= 70 ? 'Orta' :
                           Number(inspection.totalScore) >= 60 ? 'Düşük' : 'Kritik'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* PDF indirme butonu - her zaman göster */}
              <Button
                onClick={handleDownloadPDF}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                PDF OLARAK İNDİR
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Kategori Başarı Oranları */}
        <Card className="mb-6 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-lg text-purple-900">📊 Kategori Başarı Oranları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryScores.map((category: any) => {
                const bgColor = getScoreBgColor(category.percentage);
                const borderColor = getScoreBorderColor(category.percentage);
                const textColor = getScoreColor(category.percentage);
                const barColor = category.percentage >= 90 ? 'bg-green-600' :
                                category.percentage >= 80 ? 'bg-green-500' :
                                category.percentage >= 70 ? 'bg-yellow-600' :
                                category.percentage >= 60 ? 'bg-orange-600' : 'bg-red-600';
                return (
                  <div key={category.categoryName} className={`p-4 rounded-lg border-2 ${borderColor} ${bgColor}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900 text-sm line-clamp-2">{category.categoryName}</p>
                      <p className={`font-bold text-lg ${textColor}`}>
                        {category.percentage}%
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${barColor}`}
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {category.earnedPoints}/{category.totalPoints} puan
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Aksiyon Planları */}
        {inspectionQuery.data.actions && inspectionQuery.data.actions.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-lg text-orange-900">📋 Aksiyon Planları</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inspectionQuery.data.actions.map((action: any, idx: number) => {
                  const statusColors: Record<string, string> = {
                    'Tamamlandı': 'bg-green-100 text-green-700',
                    'Devam Ediyor': 'bg-blue-100 text-blue-700',
                    'İptal': 'bg-gray-100 text-gray-700',
                    'Açık': 'bg-yellow-100 text-yellow-700'
                  };
                  const priorityColors: Record<string, string> = {
                    'Yüksek': 'text-red-600',
                    'Orta': 'text-orange-600',
                    'Düşük': 'text-green-600'
                  };
                  return (
                  <div key={idx} className="border-l-4 border-orange-400 pl-4 py-2 bg-white rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-gray-900 flex-1">{action.actionDescription}</p>
                      <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ml-2 ${statusColors[action.status] || 'bg-gray-100 text-gray-700'}`}>
                        {action.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Sorumlu Kişi</p>
                        <p className="font-medium text-gray-900">{action.assignedToName || 'Atanmadı'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tamamlanma Tarihi</p>
                        <p className="font-medium text-gray-900">
                          {action.actionDeadline ? new Date(action.actionDeadline).toLocaleDateString('tr-TR') : 'Belirlenmedi'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Soru</p>
                        <p className="font-medium text-gray-900 text-xs">{action.questionText}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Öncelik</p>
                        <p className={`font-medium text-xs ${priorityColors[action.priority] || 'text-gray-600'}`}>
                          {action.priority}
                        </p>
                      </div>
                    </div>
                    {action.completionNotes && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-600">Tamamlama Notları:</p>
                        <p className="text-sm text-gray-800 mt-1">{action.completionNotes}</p>
                      </div>
                    )}
                  </div>
                );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Denetçi Genel Değerlendirmesi */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">💬 Denetçi Genel Değerlendirmesi</CardTitle>
          </CardHeader>
          <CardContent>
            {inspection.generalAssessment ? (
              <div className="space-y-3">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{inspection.generalAssessment}</p>
                <div className="pt-3 border-t border-blue-200">
                  <p className="text-xs text-gray-600">Denetçi tarafından {format(new Date(inspection.inspectionDate), 'd MMMM yyyy', { locale: tr })} tarihinde kaydedilmiştir.</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm">Denetçi tarafından genel değerlendirme kaydedilmemiştir.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kategoriye Göre Sorular ve Fotoğraflar */}
        <div className="space-y-6">
          {categorizedAnswers.map(([categoryName, categoryAnswers]: any) => (
            <Card key={categoryName}>
              <CardHeader>
                <CardTitle className="text-lg">{categoryName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {categoryAnswers.map((answer: any, idx: number) => (
                  <div key={`${categoryName}-${answer.id}-${idx}`} className="border-b pb-6 last:border-b-0">
                    {/* Soru ve Cevap */}
                    <div className="mb-4">
                      <p className="text-gray-900 font-medium mb-3">{answer.questionText}</p>
                      <div className="flex gap-2 flex-wrap">
                        <span
                          className={`px-3 py-1 rounded text-sm font-semibold ${
                            answer.earnedPoints > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {answer.earnedPoints > 0 ? "✓ Evet" : "✗ Hayır"}
                        </span>
                        <span className="px-3 py-1 rounded text-sm font-semibold bg-blue-100 text-blue-700">
                          {answer.earnedPoints}/{answer.questionPoints} puan
                        </span>
                      </div>
                    </div>

                    {/* Açıklama */}
                    {answer.explanation && (
                      <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Açıklama:</span> {answer.explanation}
                        </p>
                      </div>
                    )}

                    {/* Bu soruya ait Aksiyon Planları */}
                    {inspectionQuery.data.actions && inspectionQuery.data.actions.filter((a: any) => a.questionId === answer.questionId).length > 0 && (
                      <div className="mt-4 p-3 bg-orange-50 rounded border border-orange-200">
                        <p className="text-sm font-semibold text-orange-900 mb-2">📋 Aksiyon Planları:</p>
                        <div className="space-y-2">
                          {inspectionQuery.data.actions.filter((a: any) => a.questionId === answer.questionId).map((action: any, idx: number) => (
                            <div key={idx} className="text-sm bg-white p-2 rounded border border-orange-100">
                              <p className="font-medium text-gray-900">{action.actionDescription}</p>
                              <div className="flex gap-2 mt-1 flex-wrap text-xs">
                                <span className="text-gray-600">Sorumlu: {action.assignedToName || 'Atanmadı'}</span>
                                <span className="text-gray-600">Deadline: {action.actionDeadline ? new Date(action.actionDeadline).toLocaleDateString('tr-TR') : 'Belirlenmedi'}</span>
                                <span className={`px-2 py-0.5 rounded ${
                                  action.status === 'Tamamlandı' ? 'bg-green-100 text-green-700' :
                                  action.status === 'Devam Ediyor' ? 'bg-blue-100 text-blue-700' :
                                  action.status === 'İptal' ? 'bg-gray-100 text-gray-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>{action.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fotoğraflar */}
                    {answer.photoUrls && answer.photoUrls.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-gray-700 mb-3">
                          Fotoğraflar ({answer.photoUrls.length})
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {answer.photoUrls.map((photo: string, photoIdx: number) => {
                              // S3 URL'sini doğrudan kullan
                              const proxyUrl = photo;
                            return (
                            <div
                              key={`photo-${answer.id}-${photoIdx}`}
                              data-photo-container={`${answer.id}-${photoIdx}`}
                              className="relative group rounded-lg border-4 border-gray-600 bg-gray-100 shadow-md overflow-hidden h-96 cursor-pointer"
                              onClick={() => {
                                // Fotoğrafı tam ekran modal'da aç
                                const modal = document.createElement('div');
                                modal.className =
                                  'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4';
                                modal.innerHTML = `
                                  <div class="relative w-full h-full flex flex-col items-center justify-center">
                                    <button class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10" onclick="this.closest('.fixed').remove()">
                                      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                      </svg>
                                    </button>
                                    <img src="${proxyUrl}" alt="Fotoğraf" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                                    <p class="text-white text-sm mt-4">Kapatmak için tıkla veya ESC tuşuna bas</p>
                                  </div>
                                `;
                                modal.onclick = (e: any) => {
                                  if (e.target === modal) modal.remove();
                                };
                                document.addEventListener('keydown', (e: any) => {
                                  if (e.key === 'Escape') modal.remove();
                                });
                                document.body.appendChild(modal);
                              }}
                            >
                              <img
                                src={proxyUrl}
                                alt={`Fotoğraf ${photoIdx + 1}`}
                                className="w-full h-full object-contain hover:scale-110 transition-transform cursor-pointer"
                                style={{}}
                                onLoad={(e: any) => {
                                  // Resim başarıyla yüklendi - yeşil badge ekle
                                  const container = document.querySelector(`[data-photo-container="${answer.id}-${photoIdx}"]`);
                                  if (container && !container.querySelector('.bg-green-500')) {
                                    const badge = document.createElement('div');
                                    badge.className = 'absolute top-1 right-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold';
                                    badge.textContent = '✓';
                                    container.appendChild(badge);
                                  }
                                }}
                                onError={(e: any) => {
                                  // Resim yüklenmediyse fallback göster
                                  const img = e.target as HTMLImageElement;
                                  img.style.display = 'none';
                                  const fallback = document.createElement('div');
                                  fallback.className = 'w-full h-48 flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 text-red-700 font-semibold text-center px-2';
                                  fallback.innerHTML = '<div><div class="text-2xl mb-1">⚠️</div><div class="text-xs">Resim Yüklenemiyor</div></div>';
                                  img.parentElement?.appendChild(fallback);
                                }}
                                onClick={() => {
                                  // Fotoğrafı tam ekran modal'da aç
                                  const modal = document.createElement("div");
                                  modal.className =
                                    "fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4";
                                  modal.innerHTML = `
                                    <div class="relative w-full h-full flex flex-col items-center justify-center">
                                      <button class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10" onclick="this.closest('.fixed').remove()">
                                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                      </button>
                                      <img src="${proxyUrl}" alt="Fotoğraf" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                                      <p class="text-white text-sm mt-4">Kapatmak için tıkla veya ESC tuşuna bas</p>
                                    </div>
                                  `;
                                  modal.onclick = (e: any) => {
                                    if (e.target === modal) modal.remove();
                                  };
                                  document.addEventListener('keydown', (e: any) => {
                                    if (e.key === 'Escape') modal.remove();
                                  });
                                  document.body.appendChild(modal);
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                <span className="text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                  Tıkla
                                </span>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
