import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Eye, Loader2, Search } from "lucide-react";

export default function InspectionArchive() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);

  // Tüm denetimleri getir
  const inspectionsQuery = (trpc as any).fieldInspection.getAllInspections.useQuery();

  // Şubeleri getir
  const branchesQuery = (trpc as any).branches.list.useQuery();

  // Verileri filtrele
  const filteredInspections = (inspectionsQuery.data || []).filter((inspection: any) => {
    const matchesSearch =
      inspection.branchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.branchCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.id.toString().includes(searchTerm);

    const matchesBranch = !selectedBranch || inspection.branchId === selectedBranch;

    return matchesSearch && matchesBranch;
  });

  const handleDownloadPDF = (pdfUrl: string, branchCode: string, inspectionId: number) => {
    if (!pdfUrl) {
      alert("PDF bulunamadı");
      return;
    }

    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `Denetim_${branchCode}_${inspectionId}.pdf`;
    link.click();
  };

  const handleViewPDF = (inspectionId: number) => {
    window.open(`/field-inspection-print/${inspectionId}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Başlık */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Denetim Arşivi</h1>
          <p className="text-gray-600 mt-2">Geçmiş denetimlerin raporlarını görüntüleyin ve indirin</p>
        </div>

        {/* Filtreler */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtreler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Arama */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Şube adı, kodu veya denetim ID'si ara..."
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Şube Seçimi */}
              <select
                value={selectedBranch || ""}
                onChange={(e: any) => setSelectedBranch(e.target.value ? parseInt(e.target.value) : null)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="">Tüm Şubeler</option>
                {(branchesQuery.data || []).map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Denetimler Tablosu */}
        <Card>
          <CardHeader>
            <CardTitle>
              Denetimler ({filteredInspections.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inspectionsQuery.isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : filteredInspections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Denetim bulunamadı</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Denetim ID</TableHead>
                      <TableHead>Şube Adı</TableHead>
                      <TableHead>Şube Kodu</TableHead>
                      <TableHead>Denetim Tarihi</TableHead>
                      <TableHead>Toplam Puan</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInspections.map((inspection: any) => (
                      <TableRow key={inspection.id}>
                        <TableCell className="font-medium">#{inspection.id}</TableCell>
                        <TableCell>{inspection.branchName}</TableCell>
                        <TableCell>{inspection.branchCode}</TableCell>
                        <TableCell>
                          {new Date(inspection.createdAt).toLocaleDateString("tr-TR")}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-blue-600">
                            {Number(inspection.totalScore).toFixed(2)}/100
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              inspection.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {inspection.status === "completed" ? "Tamamlandı" : "Devam Ediyor"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleViewPDF(inspection.id)}
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Görüntüle
                            </Button>
                            {inspection.pdfUrl && (
                              <Button
                                onClick={() =>
                                  handleDownloadPDF(
                                    inspection.pdfUrl,
                                    inspection.branchCode,
                                    inspection.id
                                  )
                                }
                                variant="outline"
                                size="sm"
                                className="gap-2"
                              >
                                <Download className="w-4 h-4" />
                                İndir
                              </Button>
                            )}
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
    </div>
  );
}
