import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface DayEntry {
  id: string;
  saat: string;
  subeAdi: string;
  plan: string;
  gerceklesen: string;
}

interface Row {
  id: string;
  entries: (DayEntry[] | undefined)[];
}

interface EditingPlan {
  id: number;
  actualNotes: string;
  status?: string;
}

export function WeeklyPlans() {
  const { data: user } = (trpc as any).auth.me.useQuery();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rows, setRows] = useState<Row[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [editingPlan, setEditingPlan] = useState<EditingPlan | null>(null);
  
  // Filtre state'leri
  const [filterBranchName, setFilterBranchName] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Fetch branches
  const { data: branchesData } = (trpc as any).branches.list.useQuery();
  
  useEffect(() => {
    if (branchesData) {
      setBranches(branchesData);
    }
  }, [branchesData]);

  // tRPC queries
  const { data: savedPlans } = (trpc as any).weeklyPlan.getPlans.useQuery({
    startDate: filterStartDate ? new Date(filterStartDate) : new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
    endDate: filterEndDate ? new Date(filterEndDate) : new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 6),
    branchName: filterBranchName,
    status: filterStatus,
  });

  const saveWeeklyPlanMutation = (trpc as any).weeklyPlan.savePlans.useMutation();
  const exportToICSMutation = (trpc as any).weeklyPlan.exportToICS.useMutation();
  const updatePlanMutation = (trpc as any).weeklyPlan.updateWeeklyPlanEntry.useMutation();
  const deletePlan = trpc.weeklyPlan.deletePlan.useMutation();

  // Week calculations
  const weekStart = useMemo(() => {
    const date = new Date(currentDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }, [currentDate]);

  const dayNames = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2);
    const minutes = (i % 2) * 30;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  });

  // Row management
  const handleAddRow = () => {
    const newRow: Row = {
      id: Date.now().toString(),
      entries: Array(7).fill(undefined).map(() => []),
    };
    setRows([...rows, newRow]);
  };

  const handleRemoveRow = (rowId: string) => {
    setRows(rows.filter((r: any) => r.id !== rowId));
  };

  const handleAddDayEntry = (rowId: string, dayIdx: number) => {
    setRows(
      rows.map((row: any) => {
        if (row.id === rowId) {
          const newEntries = [...row.entries];
          if (!newEntries[dayIdx]) {
            newEntries[dayIdx] = [];
          }
          newEntries[dayIdx]!.push({
            id: Date.now().toString(),
            saat: "",
            subeAdi: "",
            plan: "",
            gerceklesen: "",
          });
          return { ...row, entries: newEntries };
        }
        return row;
      })
    );
  };

  const handleRemoveDayEntry = (rowId: string, dayIdx: number, entryId: string) => {
    setRows(
      rows.map((row: any) => {
        if (row.id === rowId) {
          const newEntries = [...row.entries];
          if (newEntries[dayIdx]) {
            newEntries[dayIdx] = newEntries[dayIdx]!.filter((e: any) => e.id !== entryId);
          }
          return { ...row, entries: newEntries };
        }
        return row;
      })
    );
  };

  const handleUpdateEntry = (rowId: string, dayIdx: number, entryId: string, field: string, value: string) => {
    setRows(
      rows.map((row: any) => {
        if (row.id === rowId) {
          const newEntries = [...row.entries];
          if (newEntries[dayIdx]) {
            newEntries[dayIdx] = newEntries[dayIdx]!.map((e: any) => {
              if (e.id === entryId) {
                return { ...e, [field]: value };
              }
              return e;
            });
          }
          return { ...row, entries: newEntries };
        }
        return row;
      })
    );
  };

  const handleSavePlans = async () => {
    try {
      const entries = rows.flatMap((row: any) =>
        row.entries.flatMap((dayEntries: any, dayIdx: number) =>
          (dayEntries || []).map((entry: any) => {
            const planDateObj = new Date(weekStart.getTime() + dayIdx * 24 * 60 * 60 * 1000);
            const year = planDateObj.getFullYear();
            const month = String(planDateObj.getMonth() + 1).padStart(2, '0');
            const day = String(planDateObj.getDate()).padStart(2, '0');
            const planDateStr = `${year}-${month}-${day}`;
            
            return {
              planDate: planDateStr,
              planTime: entry.saat,
              branchName: entry.subeAdi,
              planDescription: entry.plan,
              actualValue: entry.gerceklesen,
            };
          })
        )
      );

      if (entries.length === 0) {
        toast.error("Lütfen en az bir plan girin");
        return;
      }

      await saveWeeklyPlanMutation.mutateAsync({
        weekStart: weekStart.toISOString().split("T")[0],
        weekEnd: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        entries,
      });

      toast.success("Planlar başarıyla kaydedildi");
      setRows([]);
    } catch (error: any) {
      toast.error(error.message || "Planlar kaydedilirken hata oluştu");
    }
  };

  const handleExportToICS = async () => {
    try {
      const startDate = new Date(weekStart);
      const endDate = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

      const response = await exportToICSMutation.mutateAsync({
        startDate,
        endDate,
        managerId: user?.id?.toString(),
      });

      // Create a blob and download
      const icsContent = typeof response === 'string' ? response : response.content;
      const blob = new Blob([icsContent], { type: "text/calendar" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `haftalik-plan-${new Date().toISOString().split("T")[0]}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Takvim dosyası indirildi");
    } catch (error: any) {
      toast.error(error.message || "Takvim dosyası indirilirken hata oluştu");
    }
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Haftalık Plan Girişleri */}
        <Card>
          <CardHeader>
            <CardTitle>Haftalık Plan Girişleri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hafta Navigasyonu */}
            <div className="flex items-center justify-between">
              <Button onClick={handlePreviousWeek} variant="outline" size="sm">
                ← Önceki Hafta
              </Button>
              <span className="text-sm font-semibold">
                {weekStart.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })} -
                {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })}
              </span>
              <Button onClick={handleNextWeek} variant="outline" size="sm">
                Sonraki Hafta →
              </Button>
            </div>

            {/* Tablo - Resimdeki formata sadık */}
            <div className="overflow-x-auto">
              <table className="border-collapse border border-border" style={{ minWidth: "1400px" }}>
                <thead>
                  <tr className="bg-red-600 text-white">
                    <th className="border border-border p-2 text-xs font-semibold w-16">İşlem</th>
                    {dayNames.map((day, idx) => (
                      <th key={idx} className="border border-border p-2 text-xs font-semibold" style={{ minWidth: "160px" }}>
                        <div className="font-bold whitespace-nowrap">{day}</div>
                        <div className="text-xs whitespace-nowrap">
                          {new Date(weekStart.getTime() + idx * 24 * 60 * 60 * 1000).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })}
                        </div>
                      </th>
                    ))}
                  </tr>
                  {/* Alt başlıklar: Şube Adı | Plan | Gerçekleşen | - */}
                  <tr className="bg-gray-200">
                    <th className="border border-border p-2 text-xs font-semibold w-16"></th>
                    {dayNames.map((_, idx) => (
                      <th key={idx} className="border border-border p-1" style={{ minWidth: "160px" }}>
                        <div className="grid grid-cols-4 gap-0 text-xs">
                          <div className="border-r border-border p-1 text-center whitespace-nowrap text-xs">Şube</div>
                          <div className="border-r border-border p-1 text-center whitespace-nowrap text-xs">Plan</div>
                          <div className="border-r border-border p-1 text-center whitespace-nowrap text-xs">Ger.</div>
                          <div className="p-1 text-center whitespace-nowrap text-xs">-</div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row: any) => (
                    <tr key={row.id} className="border-b border-border">
                      <td className="border border-border p-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRow(row.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          ✕
                        </Button>
                      </td>
                      {dayNames.map((_, dayIdx) => (
                        <td key={dayIdx} className="border border-border p-1">
                          <div className="space-y-1">
                            {row.entries[dayIdx]?.map((entry: any, entryIdx: number) => (
                              <div key={entry.id} className="grid grid-cols-4 gap-0 text-xs">
                                {/* Saat */}
                                <div className="border-r border-border p-0 min-w-0">
                                  <Select value={entry.saat} onValueChange={(val: any) => handleUpdateEntry(row.id, dayIdx, entry.id, "saat", val)}>
                                    <SelectTrigger className="h-8 text-xs border-0 rounded-none p-1 w-full">
                                      <SelectValue placeholder="Saat" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: 48 }, (_, i) => {
                                        const hour = Math.floor(i / 2);
                                        const minute = (i % 2) * 30;
                                        const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
                                        return (
                                          <SelectItem key={time} value={time}>
                                            {time}
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                </div>
                                {/* Şube Adı */}
                                <div className="border-r border-border p-0 min-w-0">
                                  <Input
                                    type="text"
                                    placeholder="Şube"
                                    value={entry.subeAdi}
                                    onChange={(e: any) => handleUpdateEntry(row.id, dayIdx, entry.id, "subeAdi", e.target.value)}
                                    list={`branches-${row.id}-${dayIdx}-${entry.id}`}
                                    className="h-8 text-xs p-1 border-0 rounded-none w-full"
                                  />
                                  <datalist id={`branches-${row.id}-${dayIdx}-${entry.id}`}>
                                    {branches?.map((branch: any) => (
                                      <option key={branch.id} value={branch.name} />
                                    ))}
                                  </datalist>
                                </div>
                                {/* Plan */}
                                <div className="border-r border-border p-0 min-w-0">
                                  <Input
                                    type="text"
                                    placeholder="Plan"
                                    value={entry.plan}
                                    onChange={(e: any) => handleUpdateEntry(row.id, dayIdx, entry.id, "plan", e.target.value)}
                                    className="h-8 text-xs p-1 border-0 rounded-none w-full"
                                  />
                                </div>
                                {/* Gerçekleşen */}
                                <div className="border-r border-border p-0 min-w-0">
                                  <Input
                                    type="text"
                                    placeholder="Ger."
                                    value={entry.gerceklesen}
                                    onChange={(e: any) => handleUpdateEntry(row.id, dayIdx, entry.id, "gerceklesen", e.target.value)}
                                    className="h-8 text-xs p-1 border-0 rounded-none w-full"
                                  />
                                </div>
                                {/* İşlem: Sil ve Ekle */}
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveDayEntry(row.id, dayIdx, entry.id)}
                                    className="h-5 w-5 p-0 text-red-600 hover:text-red-700 text-xs"
                                  >
                                    −
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddDayEntry(row.id, dayIdx)}
                                    className="h-5 w-5 p-0 text-green-600 hover:text-green-700 text-xs"
                                  >
                                    +
                                  </Button>
                                </div>
                              </div>
                            ))}
                            {/* İlk entry ekle butonu */}
                            {(!row.entries[dayIdx] || row.entries[dayIdx]!.length === 0) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAddDayEntry(row.id, dayIdx)}
                                className="h-5 w-5 p-0 text-green-600 hover:text-green-700 text-xs"
                              >
                                +
                              </Button>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Butonlar */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button onClick={handleAddRow} variant="outline" size="sm">
                + Yeni Satır Ekle
              </Button>
              <Button onClick={handleSavePlans} variant="default" size="sm" className="bg-red-600 hover:bg-red-700">
                Planları Kaydet
              </Button>
              <Button onClick={handleExportToICS} variant="outline" size="sm">
                ↓ Outlook/Teams'e Aktar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Kaydedilen Veriler */}
        <Card>
          <CardHeader>
            <CardTitle>Kaydedilen Veriler ({savedPlans?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtre Alanları */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded border border-border">
              <div>
                <label className="text-xs font-semibold">Şube Adı</label>
                <Input
                  type="text"
                  placeholder="Şube adı girin"
                  value={filterBranchName}
                  onChange={(e: any) => setFilterBranchName(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Başlangıç Tarihi</label>
                <Input
                  type="date"
                  value={filterStartDate}
                  onChange={(e: any) => setFilterStartDate(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Bitiş Tarihi</label>
                <Input
                  type="date"
                  value={filterEndDate}
                  onChange={(e: any) => setFilterEndDate(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Durum</label>
                <select 
                  value={filterStatus}
                  onChange={(e: any) => setFilterStatus(e.target.value)}
                  className="mt-1 w-full px-2 py-1 text-xs border border-border rounded"
                >
                  <option value="">Tümü</option>
                  <option value="Planlandı">Planlandı</option>
                  <option value="Tamamlandı">Tamamlandı</option>
                  <option value="Kısmen">Kısmen</option>
                  <option value="Ertelendi">Ertelendi</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-border p-2">Şube</th>
                    <th className="border border-border p-2">Bölge Müdürü</th>
                    <th className="border border-border p-2">Tarih</th>
                    <th className="border border-border p-2">Saat</th>
                    <th className="border border-border p-2">Planlama</th>
                    <th className="border border-border p-2">Gerçekleşen</th>
                    <th className="border border-border p-2">Durum</th>
                    <th className="border border-border p-2">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {savedPlans?.map((plan: any) => (
                    <tr key={plan.id} className="border-b border-border hover:bg-gray-50">
                      <td className="border border-border p-2">{plan.branchName}</td>
                      <td className="border border-border p-2">{plan.managerName}</td>
                      <td className="border border-border p-2">
                        {new Date(plan.planDate).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="border border-border p-2">{plan.planTime}</td>
                      <td className="border border-border p-2">{plan.planDescription || "-"}</td>
                      <td className="border border-border p-2">
                        <Input
                          type="text"
                          value={plan.actualNotes || ""}
                          onChange={(e: any) => {
                            // Inline edit - gerçekleşen verisi güncellenebilir
                            const updatedPlans = savedPlans?.map((p: any) =>
                              p.id === plan.id ? { ...p, actualNotes: e.target.value } : p
                            );
                            // setSavedPlans(updatedPlans);
                          }}
                          placeholder="Gerçekleşen girin"
                          className="text-xs h-8"
                        />
                      </td>
                      <td className="border border-border p-2">
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          {plan.status}
                        </span>
                      </td>
                          <td className="px-4 py-2 text-xs">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => setEditingPlan({ id: plan.id, actualNotes: plan.actualNotes || "" })}
                          >
                            ✎
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-red-600 hover:text-red-700"
                            onClick={() => handleDeletePlan(plan.id)}
                          >
                            🗑
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Düzenleme Modal'ı */}
        {editingPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Plan Düzenle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Gerçekleşen Verisi</label>
                  <Input
                    type="text"
                    placeholder="Gerçekleşen verisi girin"
                    value={editingPlan.actualNotes}
                    onChange={(e: any) => setEditingPlan({ ...editingPlan, actualNotes: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Durum</label>
                  <div className="flex gap-2 mt-2">
                    {['Tamamlandı', 'Ertelendi', 'Tamamlanamadı'].map((status: any) => (
                      <Button
                        key={status}
                        variant={editingPlan.status === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEditingPlan({ ...editingPlan, status })}
                        className={editingPlan.status === status ? 'bg-red-600 hover:bg-red-700' : ''}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPlan(null)}
                  >
                    İptal
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={async () => {
                      if (!editingPlan) return;
                      try {
                        await updatePlanMutation.mutateAsync({
                          id: editingPlan.id,
                          actualNotes: editingPlan.actualNotes,
                          status: editingPlan.status,
                        });
                        toast.success("Plan başarıyla güncellendi");
                        setEditingPlan(null);
                        // Verileri yenile
                        await (trpc as any).weeklyPlan.getPlans.refetch();
                      } catch (error: any) {
                        toast.error("Plan güncellenirken hata oluştu");
                      }
                    }}
                  >
                    Kaydet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );

  const handleDeletePlan = async (planId: number) => {
    if (!confirm("Bu planı silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      await deletePlan.mutateAsync({ id: planId });
      toast.success("Plan başarıyla silindi");
      // Verileri yenile
      const utils = trpc.useUtils();
      await utils.weeklyPlan.getPlans.invalidate();
    } catch (error: any) {
      toast.error(error.message || "Plan silinirken hata oluştu");
    }
  };
}
