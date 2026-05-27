import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, X, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ActualValueInputFormProps {
  onClose: () => void;
}

export default function ActualValueInputForm({ onClose }: ActualValueInputFormProps) {
  const { user, isAuthenticated } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkValue, setBulkValue] = useState<string>("");
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Dönemleri al
  const { data: periodsList } = (trpc as any).periods.listActive.useQuery();
  const periods = periodsList?.map((p: any) => ({ period: p.name })) || [];

  // Şubeleri al
  const { data: branches } = (trpc as any).branches.list.useQuery();

  // Seçili dönem ve şubeye ait hedef kartlarını al
  const { data: targetCards, refetch } = (trpc as any).kpiTargetCards.list.useQuery(
    {
      period: selectedPeriod,
      branchName: selectedBranch,
    },
    { enabled: !!selectedPeriod && !!selectedBranch }
  );

  // Gerçekleşen değeri güncelle
  const updateMutation = (trpc as any).kpiTargetCards.updateActualValue.useMutation({
    onSuccess: () => {
      toast.success("Gerçekleşen değer başarıyla güncellendi");
      setEditingId(null);
      setEditingValue("");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Güncelleme başarısız");
    },
  });

  // Toplu güncelleme mutation
  const bulkUpdateMutation = (trpc as any).kpiTargetCards.updateActualValue.useMutation({
    onSuccess: () => {
      toast.success(`${selectedIds.size} hedef başarıyla güncellendi`);
      setSelectedIds(new Set());
      setBulkValue("");
      setShowBulkModal(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Toplu güncelleme başarısız");
    },
  });

  // Rol kontrolü
  if (user?.role !== "admin" && user?.role !== "branch_manager" && user?.role !== "operations_manager") {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="border-border w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Bu sayfaya erişim izniniz yok
                </p>
                <Button onClick={onClose} variant="outline">
                  Kapat
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleSaveValue = (id: number) => {
    if (!editingValue.trim()) {
      toast.error("Lütfen bir değer girin");
      return;
    }

    updateMutation.mutate({
      id,
      actualValue: editingValue,
    });
  };

  const handleSelectAll = () => {
    if (targetCards && targetCards.length > 0) {
      if (selectedIds.size === targetCards.length) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set(targetCards.map((card: any) => card.id)));
      }
    }
  };

  const handleSelectCard = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkUpdate = () => {
    if (!bulkValue.trim()) {
      toast.error("Lütfen bir değer girin");
      return;
    }

    if (selectedIds.size === 0) {
      toast.error("Lütfen en az bir hedef seçin");
      return;
    }

    // Her seçili ID için ayrı ayrı güncelleme yap
    Array.from(selectedIds).forEach((id) => {
      bulkUpdateMutation.mutate({
        id: id as number,
        actualValue: bulkValue,
      });
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center p-4 pt-8">
        <div className="bg-background rounded-lg shadow-lg w-full max-w-6xl">
          {/* Header */}
          <div className="border-b border-border p-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Gerçekleşen KPI Veri Giriş
              </h2>
              <p className="text-sm text-muted-foreground">
                Şube hedeflerinin gerçekleşen değerlerini girin
              </p>
            </div>
            <Button onClick={onClose} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kapat
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Filtreler */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Filtreleme</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Dönem Seçin
                    </label>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Dönem seçin..." />
                      </SelectTrigger>
                      <SelectContent>
                        {periods?.map((p: any) => (
                          <SelectItem key={p.period} value={p.period}>
                            {p.period}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Şube Seçin
                    </label>
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                      <SelectTrigger>
                        <SelectValue placeholder="Şube seçin..." />
                      </SelectTrigger>
                      <SelectContent>
                        {branches?.map((b: any) => (
                          <SelectItem key={b.branchName} value={b.branchName}>
                            {b.branchName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hedef Kartları Tablosu */}
            {targetCards && targetCards.length > 0 ? (
              <Card key="target-cards-table" className="border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    Hedef Kartları ({targetCards.length} kayıt)
                  </CardTitle>
                  {selectedIds.size > 0 && (
                    <div className="flex gap-2">
                      <span className="text-sm text-muted-foreground">
                        {selectedIds.size} seçili
                      </span>
                      <Button
                        size="sm"
                        onClick={() => setShowBulkModal(true)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Toplu Güncelle
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr key="header-row">
                          <th>
                            <button
                              onClick={handleSelectAll}
                              className="p-2 hover:bg-muted rounded"
                              title={
                                selectedIds.size === targetCards.length
                                  ? "Tümünü kaldır"
                                  : "Tümünü seç"
                              }
                            >
                              {selectedIds.size === targetCards.length ? (
                                <CheckSquare className="w-4 h-4 text-primary" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </th>
                          <th>Hedef</th>
                          <th>Boyut</th>
                          <th>Birim</th>
                          <th>Ağırlık %</th>
                          <th>Hedef Değeri</th>
                          <th>Gerçekleşen</th>
                          <th>Puan</th>
                          <th>Hedef Puanı</th>
                          <th>İşlem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {targetCards.map((card: any, index: number) => (
                          <tr
                            key={`card-${card.id}-${index}`}
                            className={`hover:bg-muted/50 ${
                              selectedIds.has(card.id) ? "bg-primary/5" : ""
                            }`}
                          >
                            <td>
                              <button
                                onClick={() => handleSelectCard(card.id)}
                                className="p-2 hover:bg-muted rounded"
                              >
                                {selectedIds.has(card.id) ? (
                                  <CheckSquare className="w-4 h-4 text-primary" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                            <td className="font-medium">{card.target}</td>
                            <td>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                {card.dimension}
                              </span>
                            </td>
                            <td>{card.unit || "-"}</td>
                            <td className="text-center">{card.weight || "-"}%</td>
                            <td className="font-semibold text-primary">
                              {card.targetValue || "-"}
                            </td>
                            <td>
                              {editingId === card.id ? (
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    className="w-24"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveValue(card.id)}
                                    disabled={updateMutation.isPending}
                                  >
                                    <Save className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingId(null);
                                      setEditingValue("");
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingId(card.id);
                                    setEditingValue(card.actualValue || "");
                                  }}
                                >
                                  {card.actualValue || "Gir"}
                                </Button>
                              )}
                            </td>
                            <td className="font-semibold">
                              {card.score ? parseFloat(card.score).toFixed(2) : "-"}
                            </td>
                            <td className="font-semibold text-primary">
                              {card.weightedScore
                                ? parseFloat(card.weightedScore).toFixed(2)
                                : "-"}
                            </td>
                            <td>
                              {editingId === card.id ? (
                                <span className="text-xs text-muted-foreground">
                                  Düzenleniyor...
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  Hazır
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : selectedPeriod && selectedBranch ? (
              <Card key="no-target-found" className="border-border">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Seçili dönem ve şube için hedef bulunamadı
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card key="select-period-branch" className="border-border">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Lütfen dönem ve şube seçin
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Toplu Güncelleme Modal */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Toplu Güncelleme</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Gerçekleşen Değer ({selectedIds.size} hedef için)
              </label>
              <Input
                type="number"
                step="0.01"
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                placeholder="Değer girin..."
                autoFocus
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Bu işlem seçili tüm hedeflerin gerçekleşen değerini günceller ve puanları otomatik olarak hesaplar.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkModal(false)}
            >
              İptal
            </Button>
            <Button
              onClick={handleBulkUpdate}
              disabled={bulkUpdateMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {bulkUpdateMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
