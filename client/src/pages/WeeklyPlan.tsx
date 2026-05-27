'use client';

import { useState, useMemo } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { Trash2, Edit2, Plus, Download } from 'lucide-react';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const HOURS = Array.from({ length: 9 }, (_, i) => `${9 + i}:00`);

interface DayData {
  time: string;
  branches: Array<{
    id: string;
    time?: string;
    branchName: string;
    plan: string;
    actual: string;
  }>;
}

interface Row {
  id: string;
  data: DayData[];
}

export default function WeeklyPlan() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [rows, setRows] = useState<Row[]>([{ id: '1', data: Array(7).fill(null).map(() => ({ time: '', branches: [] })) }]);
  const [branches, setBranches] = useState<any[]>([]);
  const [regionManagers, setRegionManagers] = useState<any[]>([]);
  const [selectedManager, setSelectedManager] = useState('all');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [statusFormData, setStatusFormData] = useState({ status: 'Planlandı', actualTime: '', actualNotes: '' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterActionType, setFilterActionType] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [searchText, setSearchText] = useState('');

  // Fetch branches
  const { data: branchesData } = (trpc as any).weeklyPlan.getBranchesForForm.useQuery();
  const { data: managersData } = (trpc as any).weeklyPlan.getRegionManagers.useQuery();
  const { data: plansData, refetch: refetchPlans } = (trpc as any).weeklyPlan.getWeeklyPlans.useQuery({
    startDate: currentWeekStart,
    endDate: addDays(currentWeekStart, 6),
    managerId: selectedManager !== 'all' ? selectedManager : undefined,
  });

  const createPlansBatchMutation = (trpc as any).weeklyPlan.createWeeklyPlansBatch.useMutation();
  const updateStatusMutation = (trpc as any).weeklyPlan.updateWeeklyPlanStatus.useMutation();
  const deletePlanMutation = (trpc as any).weeklyPlan.deleteWeeklyPlan.useMutation();

  // Update branches and managers
  useMemo(() => {
    if (branchesData) setBranches(branchesData);
    if (managersData) setRegionManagers(managersData);
  }, [branchesData, managersData]);

  const addRow = () => {
    const newRow: Row = {
      id: Date.now().toString(),
      data: Array(7).fill(null).map(() => ({ time: '', branches: [] })),
    };
    setRows([...rows, newRow]);
  };

  const deleteRow = (rowId: string) => {
    setRows(rows.filter(r => r.id !== rowId));
  };

  const addBranchToDay = (rowId: string, dayIndex: number) => {
    setRows(rows.map(row => {
      if (row.id === rowId) {
        const newData = [...row.data];
        newData[dayIndex].branches.push({ id: Date.now().toString(), branchName: '', plan: '', actual: '' });
        return { ...row, data: newData };
      }
      return row;
    }));
  };

  const updateBranch = (rowId: string, dayIndex: number, branchId: string, field: string, value: string) => {
    setRows(rows.map(row => {
      if (row.id === rowId) {
        const newData = [...row.data];
        newData[dayIndex].branches = newData[dayIndex].branches.map(b =>
          b.id === branchId ? { ...b, [field]: value } : b
        );
        return { ...row, data: newData };
      }
      return row;
    }));
  };

  const deleteBranch = (rowId: string, dayIndex: number, branchId: string) => {
    setRows(rows.map(row => {
      if (row.id === rowId) {
        const newData = [...row.data];
        newData[dayIndex].branches = newData[dayIndex].branches.filter(b => b.id !== branchId);
        return { ...row, data: newData };
      }
      return row;
    }));
  };

  const handleSaveRow = async (rowId: string) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;

    const plansToSave = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayData = row.data[dayIndex];
      const planDate = addDays(currentWeekStart, dayIndex);

      for (const branch of dayData.branches) {
        if (branch.branchName && dayData.time) {
          plansToSave.push({
            branchId: parseInt(branch.branchName) || 0,
            branchName: branches.find(b => b.id.toString() === branch.branchName)?.name || branch.branchName,
            planDate,
            planTime: dayData.time,
            storeName: branch.branchName,
            city: '',
            actionType: 'Diğer',
            priority: 'Orta',
            planDescription: branch.plan,
          });
        }
      }
    }

    try {
      await createPlansBatchMutation.mutateAsync({ plans: plansToSave });
      alert('Planlar başarıyla kaydedildi');
      // Verileri doğru parametrelerle yenile
      await refetchPlans({
        startDate: currentWeekStart,
        endDate: addDays(currentWeekStart, 6),
        managerId: selectedManager !== 'all' ? selectedManager : undefined,
      });
      setRows(rows.filter(r => r.id !== rowId));
    } catch (error) {
      console.error('Kayıt sırasında hata oluştu:', error);
      alert('Kayıt sırasında hata oluştu');
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedPlan) return;

    try {
      await updateStatusMutation.mutateAsync({
        id: selectedPlan.id,
        status: statusFormData.status,
        actualTime: statusFormData.actualTime,
        actualNotes: statusFormData.actualNotes,
      });

      alert('Plan durumu başarıyla güncellendi');
      setIsStatusModalOpen(false);
      await refetchPlans();
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      alert('Durum güncellenirken hata oluştu');
    }
  };

  const handleDeletePlan = async (planId: number) => {
    if (!confirm('Bu planı silmek istediğinizden emin misiniz?')) return;

    try {
      await deletePlanMutation.mutateAsync({ id: planId });
      alert('Plan başarıyla silindi');
      await refetchPlans();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme sırasında hata oluştu');
    }
  };

  const filteredPlans = useMemo(() => {
    if (!plansData) return [];

    const filtered = plansData.filter((plan: any) => {
      if (filterStatus && filterStatus !== 'all' && plan.status !== filterStatus) return false;
      if (filterActionType && plan.actionType !== filterActionType) return false;
      if (filterDateStart && new Date(plan.planDate) < new Date(filterDateStart)) return false;
      if (filterDateEnd && new Date(plan.planDate) > new Date(filterDateEnd)) return false;
      if (searchText) {
        const text = searchText.toLowerCase();
        return (
          plan.branchName?.toLowerCase().includes(text) ||
          plan.storeName?.toLowerCase().includes(text) ||
          plan.managerName?.toLowerCase().includes(text)
        );
      }
      return true;
    });
    
    // Tarih ve saat'e göre büyükten küçüğe sırala (en yeni veriler en üstte)
    return filtered.sort((a: any, b: any) => {
      const dateA = new Date(`${a.planDate}T${a.planTime || '00:00'}`);
      const dateB = new Date(`${b.planDate}T${b.planTime || '00:00'}`);
      return dateB.getTime() - dateA.getTime();
    });
  }, [plansData, filterStatus, filterActionType, filterDateStart, filterDateEnd, searchText]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Tamamlandı':
        return 'bg-green-100 text-green-800';
      case 'Kısmen':
        return 'bg-yellow-100 text-yellow-800';
      case 'Tamamlanmadı':
        return 'bg-red-100 text-red-800';
      case 'Ertelendi':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Bölge Operasyon Müdürlerinin Haftalık İş Planlama ve Takibi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}>← Önceki Hafta</Button>
            <span className="flex items-center">
              {format(currentWeekStart, 'dd/MM/yyyy', { locale: tr })} - {format(addDays(currentWeekStart, 6), 'dd/MM/yyyy', { locale: tr })}
            </span>
            <Button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}>Sonraki Hafta →</Button>
          </div>

          {regionManagers.length > 0 && (
            <Select value={selectedManager} onValueChange={setSelectedManager}>
              <SelectTrigger className="w-64 mb-4">
                <SelectValue placeholder="Bölge Müdürü Seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Bölge Müdürleri</SelectItem>
                {regionManagers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id.toString()}>
                    {manager.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Haftalık Plan Girişleri */}
      <Card className="overflow-x-auto">
        <CardHeader>
          <CardTitle>Haftalık Plan Girişleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm border-collapse">
              <thead>
                <tr className="border-b-2">
                  <th colSpan={2} className="text-center p-2 border-r">İşlem</th>
                  {DAYS.map((day, idx) => (
                    <th key={idx} colSpan={4} className="text-center p-2 border-r font-semibold bg-gray-50">
                      {day}
                      <div className="text-xs text-gray-500">{format(addDays(currentWeekStart, idx), 'dd/MM')}</div>
                    </th>
                  ))}
                </tr>
                <tr className="border-b">
                  <th className="text-center p-2 border-r min-w-[50px]">+</th>
                  {DAYS.map((_, dayIdx) => (
                    <React.Fragment key={dayIdx}>
                      <th className="text-center p-2 border-r min-w-[100px]">Şube Adı</th>
                      <th className="text-center p-2 border-r min-w-[120px]">Plan</th>
                      <th className="text-center p-2 border-r min-w-[120px]">Gerçekleşen</th>
                      <th className="text-center p-2 border-r min-w-[30px]">-</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 border-r text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addBranchToDay(row.id, 0)}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </td>
                    {DAYS.map((_, dayIndex) => (
                      <React.Fragment key={dayIndex}>
                        <td className="p-1 border-r">
                          {row.data[dayIndex]?.branches.map((branch, branchIdx) => (
                            <div key={branch.id} className="flex gap-1 mb-1 items-center">
                              <Input
                                type="time"
                                value={branch.time || ''}
                                onChange={(e) =>
                                  updateBranch(row.id, dayIndex, branch.id, 'time', e.target.value)
                                }
                                className="h-6 text-xs w-16 p-1"
                              />
                              <Select
                                value={branch.branchName}
                                onValueChange={(val) =>
                                  updateBranch(row.id, dayIndex, branch.id, 'branchName', val)
                                }
                              >
                                <SelectTrigger className="h-6 text-xs flex-1 bg-gray-50 cursor-pointer">
                                  <SelectValue placeholder="Şube Seç" />
                                </SelectTrigger>
                                <SelectContent>
                                  {branches && branches.length > 0 ? (
                                    branches.map((b) => (
                                      <SelectItem key={b.id} value={b.id.toString()}>
                                        {b.name}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="no-branches" disabled>
                                      Şube yok
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteBranch(row.id, dayIndex, branch.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </td>
                        <td className="p-1 border-r">
                          {row.data[dayIndex]?.branches.map((branch) => (
                            <Textarea
                              key={`plan-${branch.id}`}
                              placeholder="Plan"
                              value={branch.plan}
                              onChange={(e) =>
                                updateBranch(row.id, dayIndex, branch.id, 'plan', e.target.value)
                              }
                              className="h-16 text-xs p-1 resize-none mb-1 focus:ring-blue-500 focus:ring-2"
                            />
                          ))}
                        </td>
                        <td className="p-1 border-r">
                          {row.data[dayIndex]?.branches.map((branch) => (
                            <Textarea
                              key={`actual-${branch.id}`}
                              placeholder="Gerçekleşen"
                              value={branch.actual}
                              onChange={(e) =>
                                updateBranch(row.id, dayIndex, branch.id, 'actual', e.target.value)
                              }
                              className="h-16 text-xs p-1 resize-none mb-1 focus:ring-green-500 focus:ring-2"
                            />
                          ))}
                        </td>
                        <td className="p-1 border-r text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addBranchToDay(row.id, dayIndex)}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={addRow} variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Yeni Satır Ekle
            </Button>
            {rows.length > 0 && (
              <Button onClick={() => handleSaveRow(rows[0].id)}>
                Planları Kaydet
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Kaydedilen Veriler */}
      <Card>
        <CardHeader>
          <CardTitle>Kaydedilen Veriler ({filteredPlans.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Durum Filtresi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="Planlandı">Planlandı</SelectItem>
                <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                <SelectItem value="Kısmen">Kısmen</SelectItem>
                <SelectItem value="Tamamlanmadı">Tamamlanmadı</SelectItem>
                <SelectItem value="Ertelendi">Ertelendi</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filterDateStart}
              onChange={(e) => setFilterDateStart(e.target.value)}
              placeholder="Başlangıç Tarihi"
            />

            <Input
              type="date"
              value={filterDateEnd}
              onChange={(e) => setFilterDateEnd(e.target.value)}
              placeholder="Bitiş Tarihi"
            />

            <Input
              type="text"
              placeholder="Ara..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />

            <Button
              variant="outline"
              onClick={() => {
                setFilterStatus('');
                setFilterActionType('');
                setFilterDateStart('');
                setFilterDateEnd('');
                setSearchText('');
              }}
            >
              Filtreleri Sıfırla
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Şube</th>
                  <th className="text-left p-2">Bölge Müdürü</th>
                  <th className="text-left p-2">Tarih</th>
                  <th className="text-left p-2">Saat</th>
                  <th className="text-left p-2">Planlama</th>
                  <th className="text-left p-2">Gerçekleşen</th>
                  <th className="text-left p-2">Durum</th>
                  <th className="text-center p-2">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-4 text-gray-500">
                      Veri bulunamadı
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map((plan: any) => (
                    <tr key={plan.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{plan.branchName}</td>
                      <td className="p-2">{plan.managerName}</td>
                      <td className="p-2">{format(new Date(plan.planDate), 'dd/MM/yyyy')}</td>
                      <td className="p-2">{plan.planTime}</td>
                      <td className="p-2 max-w-[150px] truncate">{plan.planDescription}</td>
                      <td className="p-2 max-w-[150px] truncate">{plan.actualNotes}</td>
                      <td className="p-2">
                        <Badge className={getStatusColor(plan.status)}>{plan.status}</Badge>
                      </td>
                      <td className="p-2 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedPlan(plan);
                            setStatusFormData({
                              status: plan.status,
                              actualTime: plan.actualTime || '',
                              actualNotes: plan.actualNotes || '',
                            });
                            setIsStatusModalOpen(true);
                          }}
                          className="h-6 w-6 p-0 mr-1"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePlan(plan.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Durum Güncelleme Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plan Durumunu Güncelle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Durum</label>
              <Select
                value={statusFormData.status}
                onValueChange={(val) =>
                  setStatusFormData({ ...statusFormData, status: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planlandı">Planlandı</SelectItem>
                  <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                  <SelectItem value="Kısmen">Kısmen</SelectItem>
                  <SelectItem value="Tamamlanmadı">Tamamlanmadı</SelectItem>
                  <SelectItem value="Ertelendi">Ertelendi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Gerçekleşen Saat</label>
              <Input
                type="time"
                value={statusFormData.actualTime}
                onChange={(e) =>
                  setStatusFormData({ ...statusFormData, actualTime: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notlar</label>
              <Textarea
                value={statusFormData.actualNotes}
                onChange={(e) =>
                  setStatusFormData({ ...statusFormData, actualNotes: e.target.value })
                }
                placeholder="Notlar..."
                className="h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleStatusUpdate}>Güncelle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React from 'react';
