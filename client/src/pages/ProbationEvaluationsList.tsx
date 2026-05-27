import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, Download, Eye, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ProbationEvaluationsList() {
  const [, navigate] = useLocation();
  const { data: authData } = (trpc as any).auth.me.useQuery();
  const { data: evaluations, isLoading } = (trpc as any).probationEvaluation.list.useQuery();
  const deleteMutation = (trpc as any).probationEvaluation.delete.useMutation();

  const [filterBranch, setFilterBranch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [searchTC, setSearchTC] = useState("");

  // Yalnızca Şube Müdürü ve Admin görebilir
  const canView = authData?.user?.role === "admin" || authData?.user?.role === "branch_manager";

  if (!canView) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Card className="w-96">
            <CardContent className="pt-6">
              <p className="text-center text-red-600">
                Bu sayfaya erişim izniniz yok. Sadece Şube Müdürü ve Admin erişebilir.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const filteredEvaluations = evaluations?.filter((item: any) => {
    const matchBranch = !filterBranch || item.branch === filterBranch;
    const matchType = !filterType || item.evaluationType === filterType;
    const matchTC = !searchTC || item.employeeTCNumber.includes(searchTC);
    return matchBranch && matchType && matchTC;
  }) || [];

  const branches = Array.from(new Set(evaluations?.map((item: any) => item.branch) || []));

  const handleDelete = async (id: number) => {
    if (confirm("Bu değerlendirmeyi silmek istediğinizden emin misiniz?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        alert("Değerlendirme silindi");
      } catch (error: any) {
        alert("Silme işlemi başarısız oldu");
      }
    }
  };

  const handleDownloadPDF = (item: any) => {
    // PDF indirme işlemi - pdfUrl varsa
    if (item.pdfUrl) {
      window.open(item.pdfUrl, "_blank");
    } else {
      alert("PDF dosyası henüz oluşturulmamış");
    }
  };

  const handleExportExcel = () => {
    // Excel export işlemi
    const headers = [
      "TC No",
      "Personel Adı",
      "Şube",
      "Bölüm",
      "Değerlendirme Dönemi",
      "Başarı %",
      "Karar",
      "Değerlendiren",
      "Tarih",
    ];

    const rows = filteredEvaluations.map((item: any) => [
      item.employeeTCNumber,
      item.employeeName,
      item.branch,
      item.department || "-",
      item.evaluationType === "1.5_months" ? "1,5 Ay" : "5,5 Ay",
      item.successPercentage,
      item.continueEmployment ? "Devam Edebilir" : "Devam Edemez",
      item.evaluatedBy || "-",
      item.createdAt ? new Date(item.createdAt).toLocaleDateString("tr-TR") : "-",
    ]);

    const csv = [headers, ...rows].map((row: any) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `deneme-suresi-degerlendirmeler-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Deneme Süresi Değerlendirmeleri</h1>
          <Button variant="outline" onClick={() => navigate("/")}>
            <Home className="w-4 h-4 mr-2" />
            Ana Sayfa
          </Button>
        </div>

        {/* Filtreler */}
        <Card>
          <CardHeader>
            <CardTitle>Filtreler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>TC No ile Ara</Label>
                <Input
                  placeholder="11 haneli TC No"
                  value={searchTC}
                  onChange={(e: any) => setSearchTC(e.target.value)}
                  maxLength={11}
                />
              </div>
              <div>
                <Label>Şube</Label>
                <Select value={filterBranch} onValueChange={setFilterBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tüm Şubeler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tüm Şubeler</SelectItem>
                    {branches.map((branch: any) => (
                      <SelectItem key={branch} value={branch}>
                        {branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Değerlendirme Dönemi</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tüm Dönemler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tüm Dönemler</SelectItem>
                    <SelectItem value="1.5_months">1,5 Ay</SelectItem>
                    <SelectItem value="5.5_months">5,5 Ay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleExportExcel} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Excel İndir
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Değerlendirmeler Tablosu */}
        <Card>
          <CardHeader>
            <CardTitle>
              Değerlendirmeler ({filteredEvaluations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-gray-500">Yükleniyor...</p>
            ) : filteredEvaluations.length === 0 ? (
              <p className="text-center text-gray-500">Değerlendirme bulunamadı</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>TC No</TableHead>
                      <TableHead>Personel Adı</TableHead>
                      <TableHead>Şube</TableHead>
                      <TableHead>Bölüm</TableHead>
                      <TableHead>Dönem</TableHead>
                      <TableHead>Başarı %</TableHead>
                      <TableHead>Karar</TableHead>
                      <TableHead>Değerlendiren</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvaluations.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">
                          {item.employeeTCNumber}
                        </TableCell>
                        <TableCell>{item.employeeName}</TableCell>
                        <TableCell>{item.branch}</TableCell>
                        <TableCell>{item.department || "-"}</TableCell>
                        <TableCell>
                          {item.evaluationType === "1.5_months" ? "1,5 Ay" : "5,5 Ay"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-bold ${
                              item.successPercentage >= 55
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            %{item.successPercentage}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              item.continueEmployment
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.continueEmployment
                              ? "Devam Edebilir"
                              : "Devam Edemez"}
                          </span>
                        </TableCell>
                        <TableCell>{item.evaluatedBy || "-"}</TableCell>
                        <TableCell>
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString("tr-TR")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadPDF(item)}
                              title="PDF İndir"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                navigate(`/probation-evaluation-detail/${item.id}`)
                              }
                              title="Detayları Görüntüle"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {authData?.user?.role === "admin" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(item.id)}
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
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
    </DashboardLayout>
  );
}
