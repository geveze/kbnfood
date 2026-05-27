import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface PerformanceRow {
  id: number;
  branchName: string;
  employeeName: string;
  position: string;
  sicilNo: string;
  evaluationDate: string;
  evaluationDateRaw: number;
  evaluationPeriod?: string;
  totalScore: number;
  davranisalScore: number;
  meslekiScore: number;
  status: string;
  items: any[];
  managerOpinion?: string;
  scoreExplanations?: Record<string, string>;
}

const POSITIONS = [
  "Kasa",
  "Servis",
  "Izgara",
  "Izgara Yöneticisi",
  "Restoran Yönetimi",
];

export default function AllBranchesPerformanceReport() {
  const [location, setLocation] = useLocation();
  const [evaluations, setEvaluations] = useState<PerformanceRow[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<PerformanceRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<PerformanceRow | null>(null);
  const [branchMap, setBranchMap] = useState<{ [key: number]: string }>({});

  // Kullanıcı bilgisini getir
  const { data: authUser } = (trpc as any).auth.me.useQuery();

  // şubeleri getir
  const { data: branches } = (trpc as any).branches.list.useQuery();

  // Tüm PİF değerlendirmelerini getir
  const { data: allEvaluations, isLoading: isLoadingData } = (trpc as any).openPif.list.useQuery(
    { branchId: 0 },
    { enabled: authUser?.role !== 'branch_manager' }
  );

  // Şube haritasını oluştur
  useEffect(() => {
    if (branches) {
      const map: { [key: number]: string } = {};
      branches.forEach((branch: any) => {
        map[branch.id] = branch.name;
      });
      setBranchMap(map);
    }
  }, [branches]);

  useEffect(() => {
    if (allEvaluations) {
      const rows: PerformanceRow[] = (allEvaluations as any[]).map((evaluation: any) => {
        // items alanını kontrol et ve array'e dönüştür
        const items = Array.isArray(evaluation.items) ? evaluation.items : (evaluation.items ? JSON.parse(typeof evaluation.items === 'string' ? evaluation.items : JSON.stringify(evaluation.items)) : []);
        
        // Her item'e managerOpinion alanını ekle
        const itemsWithManagerOpinion = items.map((item: any) => ({
          ...item,
          managerOpinion: evaluation.managerOpinion || ""
        }));
        
        // Veritabanından kaydedilmiş totalScore'u kullan, yoksa items'ten hesapla
        const totalScore = evaluation.totalScore 
          ? (typeof evaluation.totalScore === 'string' ? parseInt(evaluation.totalScore) : evaluation.totalScore)
          : (items?.length > 0 
              ? Math.round(items.reduce((sum: number, item: any) => sum + (item.score || 0), 0) / items.length)
              : 0);

        const davranisalItems = items?.filter((item: any) => {
          const cat = (item.category || "").toUpperCase().replace(/[\s_-]/g, "");
          return cat.includes("DAVRANIŞS") || cat.includes("BEHAVIOR");
        }) || [];

        const meslekiItems = items?.filter((item: any) => {
          const cat = (item.category || "").toUpperCase().replace(/[\s_-]/g, "");
          return cat.includes("MESLEKI") || cat.includes("TEKNIK") || cat.includes("TECHNICAL");
        }) || [];

        const davranisalScore = davranisalItems.length > 0
          ? Math.round(davranisalItems.reduce((sum: number, item: any) => sum + (item.score || 0), 0) / davranisalItems.length)
          : 0;

        const meslekiScore = meslekiItems.length > 0
          ? Math.round(meslekiItems.reduce((sum: number, item: any) => sum + (item.score || 0), 0) / meslekiItems.length)
          : 0;

        // Değerlendirme Skalası:
        // 0-30: Yetersiz
        // 30-49: Gelişime Açık
        // 50-69: Beklenen
        // 70-84: İyi
        // 85-100: Çok İyi
        let status = "Yetersiz";
        if (totalScore >= 85) status = "Çok İyi";
        else if (totalScore >= 70) status = "İyi";
        else if (totalScore >= 50) status = "Beklenen";
        else if (totalScore >= 30) status = "Gelişime Açık";
        else status = "Yetersiz";

        // scoreExplanations'i parse et
        let scoreExplanations: Record<string, string> = {};
        if (evaluation.scoreExplanations) {
          try {
            const parsed = typeof evaluation.scoreExplanations === 'string' 
              ? JSON.parse(evaluation.scoreExplanations)
              : evaluation.scoreExplanations;
            if (typeof parsed === 'object' && parsed !== null) {
              scoreExplanations = parsed;
            }
          } catch (e) {
            console.error('Failed to parse scoreExplanations:', e);
          }
        }

        return {
          id: evaluation.id,
          branchName: branchMap[evaluation.branchId] || "Bilinmiyor",
          employeeName: evaluation.employeeName || "Bilinmiyor",
          position: evaluation.employeePosition || "Bilinmiyor",
          sicilNo: evaluation.employeeIdNumber || "Bilinmiyor",
          evaluationDate: evaluation.evaluationDate 
            ? new Date(evaluation.evaluationDate).toLocaleDateString("tr-TR")
            : "Bilinmiyor",
          evaluationDateRaw: evaluation.evaluationDate ? new Date(evaluation.evaluationDate).getTime() : 0,
          evaluationPeriod: evaluation.evaluationPeriod || "-",
          totalScore,
          davranisalScore,
          meslekiScore,
          status,
          items: itemsWithManagerOpinion,
          managerOpinion: evaluation.managerOpinion || "",
          scoreExplanations,
        };
      });

      setEvaluations(rows);
      setFilteredEvaluations(rows);
    }
  }, [allEvaluations, branchMap]);

  // Filtreleri dinamik olarak uygula
  useEffect(() => {
    let filtered = evaluations;

    if (searchTerm) {
      filtered = filtered.filter(
        (e) =>
          e.branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.sicilNo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedPosition) {
      filtered = filtered.filter((e) => e.position === selectedPosition);
    }

    if (startDate) {
      const start = new Date(startDate).getTime();
      filtered = filtered.filter((e) => e.evaluationDateRaw >= start);
    }

    if (endDate) {
      const end = new Date(endDate).getTime();
      filtered = filtered.filter((e) => e.evaluationDateRaw <= end);
    }

    setFilteredEvaluations(filtered);
  }, [searchTerm, selectedPosition, startDate, endDate, evaluations]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedPosition("");
    setStartDate("");
    setEndDate("");
  };

  const handleExportToExcel = () => {
    if (filteredEvaluations.length === 0) {
      toast.error("İhraç edilecek veri yok");
      return;
    }

    const headers = ["Şube", "Ad Soyad", "Ünvan", "Sicil No", "Tarih", "Davranışsal", "Mesleki", "Genel", "Durum"];
    const data = filteredEvaluations.map((e) => [
      e.branchName,
      e.employeeName,
      e.position,
      e.sicilNo,
      e.evaluationDate,
      e.davranisalScore,
      e.meslekiScore,
      e.totalScore,
      e.status,
    ]);

    const csv = [headers, ...data].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `performans_raporu_${new Date().getTime()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Veriler başarıyla indirildi");
  };

  // şube yöneticileri bu sayfaya erişememeli
  if (authUser?.role === 'branch_manager') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-red-600 mb-4">Bu sayfaya erişim izniniz yok.</p>
            <Button
              onClick={() => setLocation('/dashboard')}
              className="w-full"
            >
              Dashboard'a Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => setLocation("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri Dön
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tüm Şubeler Performans Raporu
          </h1>
          <p className="text-gray-600">
            Tüm şubelerin performans değerlendirmelerini görüntüleyin ve analiz edin
          </p>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {filteredEvaluations.length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Toplam</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {filteredEvaluations.filter((e) => e.status === "Çok İyi").length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Çok İyi</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {filteredEvaluations.filter((e) => e.status === "İyi").length}
                </p>
                <p className="text-sm text-gray-600 mt-1">İyi</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">
                  {filteredEvaluations.filter((e) => e.status === "Beklenen").length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Beklenen</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">
                  {filteredEvaluations.filter((e) => e.status === "Gelişime Açık").length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Gelişime Açık</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">
                  {filteredEvaluations.filter((e) => e.status === "Yetersiz").length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Yetersiz</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtreler */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filtreler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Arama
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Şube, ünvan, sicil no..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Ünvan
                </label>
                <select
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tüm Ünvanlar</option>
                  {POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleClearFilters} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Filtreleri Temizle
              </Button>
              <Button
                onClick={handleExportToExcel}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Excel İndir
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tablo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Performans Değerlendirmeleri ({filteredEvaluations.length})</span>
              {startDate || endDate ? (
                <span className="text-sm font-normal text-gray-600">
                  {startDate && new Date(startDate).toLocaleDateString('tr-TR')} - {endDate && new Date(endDate).toLocaleDateString('tr-TR')}
                </span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Veriler yükleniyor...</p>
              </div>
            ) : filteredEvaluations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Veri bulunamadı</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Şube
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Ad Soyad
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Ünvan
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Sicil No
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Tarih
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Değerlendirme Dönemi
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Davranışsal
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Mesleki
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Genel
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Durum
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvaluations.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedEvaluation(row)}
                      >
                        <td className="py-3 px-4 text-gray-900">{row.branchName}</td>
                        <td className="py-3 px-4 text-gray-900">{row.employeeName}</td>
                        <td className="py-3 px-4 text-gray-900">{row.position}</td>
                        <td className="py-3 px-4 text-gray-900">{row.sicilNo}</td>
                        <td className="py-3 px-4 text-gray-900">{row.evaluationDate}</td>
                        <td className="py-3 px-4 text-gray-900">
                          {row.evaluationPeriod || '-'}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-900">
                          {row.davranisalScore}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-900">
                          {row.meslekiScore}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-900 font-semibold">
                          {row.totalScore}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                              row.status === "Çok İyi"
                                ? "bg-green-100 text-green-800"
                                : row.status === "İyi"
                                ? "bg-blue-100 text-blue-800"
                                : row.status === "Beklenen"
                                ? "bg-yellow-100 text-yellow-800"
                                : row.status === "Gelişime Açık"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detay Modal */}
        {selectedEvaluation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Değerlendirme Detayı</CardTitle>
                  <button
                    onClick={() => setSelectedEvaluation(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Şube</p>
                      <p className="font-semibold text-gray-900">
                        {selectedEvaluation.branchName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ünvan</p>
                      <p className="font-semibold text-gray-900">
                        {selectedEvaluation.position}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Sicil No</p>
                      <p className="font-semibold text-gray-900">
                        {selectedEvaluation.sicilNo}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Değerlendirme Tarihi</p>
                      <p className="font-semibold text-gray-900">
                        {selectedEvaluation.evaluationDate}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Kategori Puanları</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-600">Davranışsal</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedEvaluation.davranisalScore}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-600">Mesleki-Teknik</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedEvaluation.meslekiScore}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-600">Genel Puan</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedEvaluation.totalScore}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Durum</h3>
                    <span
                      className={`inline-block px-4 py-2 rounded-full font-semibold ${
                        selectedEvaluation.status === "Çok İyi"
                          ? "bg-green-100 text-green-800"
                          : selectedEvaluation.status === "İyi"
                          ? "bg-blue-100 text-blue-800"
                          : selectedEvaluation.status === "Beklenen"
                          ? "bg-yellow-100 text-yellow-800"
                          : selectedEvaluation.status === "Gelişime Açık"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedEvaluation.status}
                    </span>
                  </div>

                  {selectedEvaluation.managerOpinion && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Yönetici Görüşü</h3>
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {selectedEvaluation.managerOpinion}
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Soru Detayları</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {selectedEvaluation.items.map((item: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                                  {item.itemNumber}.
                                </p>
                                <p className="text-sm text-gray-900 truncate">
                                  {item.description || item.itemDescription || item.question || item.text}
                                </p>
                              </div>
                              {(item.score === 1 || item.score === 5) && selectedEvaluation.scoreExplanations?.[item.id] && (
                                <p className="text-xs text-amber-700 mt-2 pl-6" title={selectedEvaluation.scoreExplanations[item.id]}>
                                  <span className="font-semibold text-amber-600">{item.score === 1 ? "Neden 1 puan:" : "Neden 5 puan:"}</span> {selectedEvaluation.scoreExplanations[item.id]}
                                </p>
                              )}
                            </div>
                            <span className="text-lg font-bold text-blue-600 px-3 py-1 bg-blue-100 rounded flex-shrink-0">
                              {item.score}/5
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
