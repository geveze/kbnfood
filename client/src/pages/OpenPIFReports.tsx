import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Download, Eye } from "lucide-react";

export function OpenPIFReports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Tüm değerlendirmeleri getir
  const { data: evaluations, isLoading } = (trpc as any).openPif.list.useQuery();

  // Belirli bir değerlendirmeyi getir
  const { data: evaluationDetails, isLoading: detailsLoading } = (trpc as any).openPif.getById.useQuery(
    { evaluationId: selectedEvaluation?.id || 0 },
    { enabled: selectedEvaluation !== null }
  );

  // Arama filtresi
  const filteredEvaluations = evaluations?.filter(
    (item: any) =>
      item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeIdNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.positionName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleViewDetails = (evaluation: any) => {
    setSelectedEvaluation(evaluation);
    setShowDetails(true);
  };

  const handleDownloadExcel = async (evaluation: any) => {
    // Excel indirme işlemi
    console.log("Excel indirme:", evaluation);
  };

  const getScaleColor = (score: number) => {
    if (score >= 4.5) return "bg-green-100 text-green-800";
    if (score >= 3.5) return "bg-blue-100 text-blue-800";
    if (score >= 2.5) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getScaleLabel = (score: number) => {
    if (score >= 4.5) return "Çok İyi";
    if (score >= 3.5) return "İyi";
    if (score >= 2.5) return "Beklenen";
    if (score >= 1.5) return "Gelişime Açık";
    return "Yetersiz";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PİF Değerlendirme Raporları
          </h1>
          <p className="text-gray-600">
            Kaydedilen tüm Performans İzleme Formu değerlendirmelerini görüntüleyin
          </p>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Input
              placeholder="Personel adı, sicil numarası veya pozisyon ile ara..."
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Evaluations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Değerlendirmeler ({filteredEvaluations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : filteredEvaluations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Değerlendirme bulunamadı
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Personel Adı</TableHead>
                      <TableHead>Sicil No</TableHead>
                      <TableHead>Pozisyon</TableHead>
                      <TableHead>Değerlendirmeyi Yapan</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Puan</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvaluations.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.employeeName}
                        </TableCell>
                        <TableCell>{item.employeeIdNumber}</TableCell>
                        <TableCell>{item.positionName}</TableCell>
                        <TableCell>{item.evaluatedByName}</TableCell>
                        <TableCell>
                          {new Date(item.evaluationDate).toLocaleDateString("tr-TR")}
                        </TableCell>
                        <TableCell>
                          <Badge className={getScaleColor(parseFloat(item.totalScore || "0"))}>
                            {item.totalScore} - {getScaleLabel(parseFloat(item.totalScore || "0"))}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(item)}
                              className="gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              Detay
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadExcel(item)}
                              className="gap-1"
                            >
                              <Download className="w-4 h-4" />
                              Excel
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Değerlendirme Detayları</DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : evaluationDetails ? (
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Personel Adı</p>
                  <p className="font-semibold">{evaluationDetails.employeeName}</p>
                </div>
                <div>
                          <p className="text-sm text-gray-600">Sicil Numarası</p>
                  <p className="font-semibold">{evaluationDetails.employeeIdNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pozisyon</p>
                  <p className="font-semibold">{evaluationDetails.positionName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Değerlendirmeyi Yapan</p>
                  <p className="font-semibold">{evaluationDetails.evaluatedByName}</p>
                </div>
              </div>

              {/* Score Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Toplam Puan</p>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-blue-600">
                    {evaluationDetails.totalScore}
                  </div>
                  <Badge className={getScaleColor(parseFloat(evaluationDetails.totalScore || "0"))}>
                    {getScaleLabel(parseFloat(evaluationDetails.totalScore || "0"))}
                  </Badge>
                </div>
              </div>

              {/* Categories */}
              {evaluationDetails.categories && evaluationDetails.categories.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-4">Kategoriler</h3>
                  <div className="space-y-3">
                    {evaluationDetails.categories.map((category: any) => {
                      const answers = (evaluationDetails.answers as Record<number, number>) || {};
                      const score = answers[category.id];
                      return (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="font-medium">{category.name}</span>
                          {score !== undefined && (
                            <Badge className={getScaleColor(score)}>
                              {score}/5
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
