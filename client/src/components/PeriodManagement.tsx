import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function PeriodManagement() {
  const { data: periods, refetch } = (trpc as any).periods.list.useQuery();
  const createPeriodMutation = (trpc as any).periods.create.useMutation();
  const updatePeriodMutation = (trpc as any).periods.update.useMutation();
  const deletePeriodMutation = (trpc as any).periods.delete.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    startDate: "",
    endDate: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDate || !formData.endDate) {
      toast.error("Başlangıç ve bitiş tarihlerini giriniz");
      return;
    }

    try {
      if (editingId) {
        await updatePeriodMutation.mutateAsync({
          id: editingId,
          name: `${formData.year}/${formData.month}`,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
        });
        toast.success("Dönem başarıyla güncellendi");
      } else {
        await createPeriodMutation.mutateAsync({
          name: `${formData.year}/${formData.month}`,
          year: formData.year,
          month: formData.month,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
        });
        toast.success("Dönem başarıyla oluşturuldu");
      }

      setFormData({
        name: "",
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        startDate: "",
        endDate: "",
      });
      setEditingId(null);
      setShowForm(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "İşlem başarısız");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu dönemi silmek istediğinizden emin misiniz?")) return;

    try {
      await deletePeriodMutation.mutateAsync({ id });
      toast.success("Dönem başarıyla silindi");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Silme başarısız");
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Dönem Yönetimi</CardTitle>
        <Button
          size="sm"
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              name: "",
              year: new Date().getFullYear(),
              month: new Date().getMonth() + 1,
              startDate: "",
              endDate: "",
            });
          }}
          className="bg-primary hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Yeni Dönem
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Dönem Adı (örn: 2026/1)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="filter-input"
                  placeholder="2026/1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ay
                </label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                  className="filter-input"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {month}. Ay
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="filter-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="filter-input"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 flex-1"
                disabled={createPeriodMutation.isPending || updatePeriodMutation.isPending}
              >
                {editingId ? "Güncelle" : "Oluştur"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                İptal
              </Button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 font-medium">Dönem Adı</th>
                <th className="text-left py-2 px-2 font-medium">Yıl/Ay</th>
                <th className="text-left py-2 px-2 font-medium">Başlangıç</th>
                <th className="text-left py-2 px-2 font-medium">Bitiş</th>
                <th className="text-left py-2 px-2 font-medium">Durum</th>
                <th className="text-left py-2 px-2 font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {periods?.map((period: any) => (
                <tr key={period.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-2 px-2 font-medium">{period.name}</td>
                  <td className="py-2 px-2 text-sm">
                    {period.year}/{String(period.month).padStart(2, "0")}
                  </td>
                  <td className="py-2 px-2 text-sm">
                    {new Date(period.startDate).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="py-2 px-2 text-sm">
                    {new Date(period.endDate).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="py-2 px-2">
                    {period.isActive ? (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        Aktif
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <XCircle className="w-4 h-4" />
                        Pasif
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(period.id);
                          setFormData({
                            name: period.name,
                            year: period.year,
                            month: period.month,
                            startDate: period.startDate.split("T")[0],
                            endDate: period.endDate.split("T")[0],
                          });
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(period.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(!periods || periods.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            Henüz dönem tanımlanmamış
          </div>
        )}
      </CardContent>
    </Card>
  );
}
