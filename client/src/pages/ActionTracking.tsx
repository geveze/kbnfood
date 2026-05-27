import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ChevronDown, ChevronUp, Edit2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ActionTracking() {
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [expandedActionId, setExpandedActionId] = useState<number | null>(null);
  const [editingActionId, setEditingActionId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Kullanıcı bilgisini al
  const { user } = useAuth();

  // Şubeleri getir
  const { data: branches = [] } = trpc.fieldInspection.getBranches.useQuery();

  // Aksiyon planlarını getir
  // Şube müdürü ise otomatik olarak kendi şubesini filtrele
  const effectiveBranchId = user?.role === "branch_manager" ? user?.branchId : selectedBranch;
  
  const { data: actions = [], isLoading, refetch } = trpc.fieldInspection.getAllActions.useQuery(
    {
      branchId: effectiveBranchId || undefined,
      status: selectedStatus as any || undefined,
    },
    { enabled: true }
  );

  // Aksiyon durumunu güncelle
  const updateStatusMutation = trpc.fieldInspection.updateActionStatus.useMutation({
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setEditingActionId(null);
    },
  });

  // Filtrelenmiş aksiyon planları
  const filteredActions = useMemo(() => {
    return actions.filter((action: any) => {
      const matchesSearch =
        action.questionText?.toLowerCase().includes(searchText.toLowerCase()) ||
        action.actionDescription?.toLowerCase().includes(searchText.toLowerCase()) ||
        action.assignedToName?.toLowerCase().includes(searchText.toLowerCase()) ||
        action.branchName?.toLowerCase().includes(searchText.toLowerCase());

      return matchesSearch;
    });
  }, [actions, searchText]);

  // Durum rengini belirle
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Açık":
        return "bg-red-100 text-red-800 border-red-300";
      case "Devam Ediyor":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Tamamlandı":
        return "bg-green-100 text-green-800 border-green-300";
      case "İptal":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Durum ikonunu belirle
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Açık":
        return <AlertCircle className="w-4 h-4" />;
      case "Devam Ediyor":
        return <Clock className="w-4 h-4" />;
      case "Tamamlandı":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Tarih formatla
  const formatDate = (date: any) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("tr-TR");
  };

  // Düzenleme modalını aç
  const openEditDialog = (action: any) => {
    // Şube müdürü sadece kendi şubesinin aksiyon planlarını güncelleyebilir
    if (user?.role === "branch_manager" && action.branchId !== user?.branchId) {
      alert("Sadece kendi şubenizin aksiyon planlarını güncelleyebilirsiniz");
      return;
    }
    setEditingActionId(action.id);
    setEditStatus(action.status);
    setEditNotes(action.completionNotes || "");
    setIsDialogOpen(true);
  };

  // Durum güncelle
  const handleStatusUpdate = () => {
    if (editingActionId && editStatus) {
      updateStatusMutation.mutate({
        actionId: editingActionId,
        status: editStatus as any,
        completionNotes: editNotes,
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Başlık */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Aksiyon Takip Yönetimi</h1>
          <p className="text-gray-600 mt-1">Aksiyon planlarının durumunu izleyin ve güncelleyin</p>
        </div>

        {/* Filtreleme Kartı */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtreleme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Şube Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Şube</label>
                {user?.role === "branch_manager" ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                    {branches.find((b: any) => b.id === user?.branchId)?.name || "Şube Bilgisi Yok"}
                  </div>
                ) : (
                  <select
                    value={selectedBranch || ""}
                    onChange={(e) => setSelectedBranch(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Tüm Şubeler</option>
                    {branches.map((branch: any) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Durum Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
                <select
                  value={selectedStatus || ""}
                  onChange={(e) => setSelectedStatus(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Tüm Durumlar</option>
                  <option value="Açık">Açık</option>
                  <option value="Devam Ediyor">Devam Ediyor</option>
                  <option value="Tamamlandı">Tamamlandı</option>
                  <option value="İptal">İptal</option>
                </select>
              </div>

              {/* Arama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ara</label>
                <Input
                  placeholder="Soru, açıklama, sorumlu kişi..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Filtre Özeti */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
              {selectedBranch && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedBranch(null)}>
                  Şube: {branches.find((b: any) => b.id === selectedBranch)?.name} ✕
                </Badge>
              )}
              {selectedStatus && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedStatus(null)}>
                  Durum: {selectedStatus} ✕
                </Badge>
              )}
              {searchText && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchText("")}>
                  Ara: {searchText} ✕
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {filteredActions.filter((a: any) => a.status === "Açık").length}
                </div>
                <p className="text-sm text-gray-600 mt-1">Açık Aksiyon</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">
                  {filteredActions.filter((a: any) => a.status === "Devam Ediyor").length}
                </div>
                <p className="text-sm text-gray-600 mt-1">Devam Ediyor</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {filteredActions.filter((a: any) => a.status === "Tamamlandı").length}
                </div>
                <p className="text-sm text-gray-600 mt-1">Tamamlandı</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600">
                  {filteredActions.length}
                </div>
                <p className="text-sm text-gray-600 mt-1">Toplam Aksiyon</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aksiyon Planları Listesi */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aksiyon Planları</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Yükleniyor...</p>
              </div>
            ) : filteredActions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Aksiyon planı bulunamadı</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredActions.map((action: any) => (
                  <div key={action.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Başlık Satırı */}
                    <div
                      className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() =>
                        setExpandedActionId(expandedActionId === action.id ? null : action.id)
                      }
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(action.status)}
                            <div>
                              <h3 className="font-semibold text-gray-900">{action.questionText}</h3>
                              <p className="text-sm text-gray-600 mt-1">{action.actionDescription}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <Badge className={getStatusColor(action.status)}>
                            {action.status}
                          </Badge>
                          {expandedActionId === action.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detay Satırı */}
                    {expandedActionId === action.id && (
                      <div className="bg-white p-4 border-t border-gray-200 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Şube</p>
                            <p className="text-sm text-gray-900 mt-1">{action.branchName}</p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Sorumlu Kişi</p>
                            <p className="text-sm text-gray-900 mt-1">
                              {action.assignedToName || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Tamamlanma Tarihi</p>
                            <p className="text-sm text-gray-900 mt-1">
                              {formatDate(action.actionDeadline)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Öncelik</p>
                            <p className="text-sm text-gray-900 mt-1">{action.priority || "-"}</p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Oluşturulma Tarihi</p>
                            <p className="text-sm text-gray-900 mt-1">
                              {formatDate(action.createdAt)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Tamamlanma Tarihi</p>
                            <p className="text-sm text-gray-900 mt-1">
                              {formatDate(action.completedAt)}
                            </p>
                          </div>
                        </div>

                        {action.completionNotes && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Tamamlanma Notları</p>
                            <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-3 rounded">
                              {action.completionNotes}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-4 border-t border-gray-200">
                          <Button
                            onClick={() => openEditDialog(action)}
                            variant="outline"
                            className="gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Durum Güncelle
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Durum Güncelleme Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aksiyon Durumunu Güncelle</DialogTitle>
            <DialogDescription>
              Aksiyon planının durumunu ve tamamlanma notlarını güncelleyin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durum
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Seçiniz</option>
                <option value="Açık">Açık</option>
                <option value="Devam Ediyor">Devam Ediyor</option>
                <option value="Tamamlandı">Tamamlandı</option>
                <option value="İptal">İptal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamamlanma Notları (Opsiyonel)
              </label>
              <Textarea
                placeholder="Aksiyon tamamlandıysa, yapılan işlemleri açıklayınız..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={4}
                className="text-sm"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                İptal
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={!editStatus || updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
