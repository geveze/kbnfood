'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Trash2, Calendar, MapPin, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { trpc } from '@/lib/trpc';

interface VisitPlanForm {
  branchName: string;
  branchId: number;
  visitDate: string;
  visitTime: string;
  visitType: 'Denetim' | 'Eğitim' | 'Ürün Tanıtımı' | 'Sorun Çözümü' | 'Diğer';
  visitDescription: string;
  visitManager: string;
  visitManagerId: number;
  notes: string;
}

const visitTypeColors: Record<string, string> = {
  'Denetim': 'bg-purple-100 text-purple-800',
  'Eğitim': 'bg-blue-100 text-blue-800',
  'Ürün Tanıtımı': 'bg-green-100 text-green-800',
  'Sorun Çözümü': 'bg-orange-100 text-orange-800',
  'Diğer': 'bg-gray-100 text-gray-800'
};

const statusColors: Record<string, string> = {
  'Planlandı': 'bg-yellow-100 text-yellow-800',
  'Gerçekleşti': 'bg-green-100 text-green-800',
  'İptal': 'bg-red-100 text-red-800'
};

export default function VisitPlans() {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<VisitPlanForm>({
    branchName: '',
    branchId: 0,
    visitDate: format(new Date(), 'yyyy-MM-dd'),
    visitTime: '09:00',
    visitType: 'Denetim',
    visitDescription: '',
    visitManager: '',
    visitManagerId: 0,
    notes: ''
  });

  // tRPC queries and mutations
  const { data: visitPlans = [], isLoading, refetch } = (trpc as any).visitPlans.getAll.useQuery({
    status: statusFilter !== 'all' ? (statusFilter as any) : undefined
  });

  const createMutation = (trpc as any).visitPlans.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowForm(false);
      setFormData({
        branchName: '',
        branchId: 0,
        visitDate: format(new Date(), 'yyyy-MM-dd'),
        visitTime: '09:00',
        visitType: 'Denetim',
        visitDescription: '',
        visitManager: '',
        visitManagerId: 0,
        notes: ''
      });
    }
  });

  const updateMutation = (trpc as any).visitPlans.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditingId(null);
      setShowForm(false);
    }
  });

  const deleteMutation = (trpc as any).visitPlans.delete.useMutation({
    onSuccess: () => {
      refetch();
    }
  });

  const filteredPlans = useMemo(() => {
    return visitPlans.filter((plan: any) => {
      const matchesSearch = searchText === '' || 
        plan.branchName.toLowerCase().includes(searchText.toLowerCase()) ||
        plan.visitDescription.toLowerCase().includes(searchText.toLowerCase()) ||
        plan.visitManager.toLowerCase().includes(searchText.toLowerCase());
      
      return matchesSearch;
    });
  }, [visitPlans, searchText]);

  const handleAddPlan = async () => {
    if (!formData.branchName || !formData.visitDescription) {
      alert('Lütfen şube adı ve ziyaret açıklaması girin');
      return;
    }

    if (editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        visitDate: new Date(formData.visitDate),
        visitTime: formData.visitTime,
        visitType: formData.visitType,
        visitDescription: formData.visitDescription,
        notes: formData.notes
      });
    } else {
      await createMutation.mutateAsync({
        branchId: formData.branchId,
        branchName: formData.branchName,
        visitDate: new Date(formData.visitDate),
        visitTime: formData.visitTime,
        visitType: formData.visitType,
        visitDescription: formData.visitDescription,
        visitManagerId: formData.visitManagerId,
        visitManager: formData.visitManager,
        notes: formData.notes
      });
    }
  };

  const handleEdit = (plan: any) => {
    setEditingId(plan.id);
    setFormData({
      branchName: plan.branchName,
      branchId: plan.branchId,
      visitDate: format(new Date(plan.visitDate), 'yyyy-MM-dd'),
      visitTime: plan.visitTime,
      visitType: plan.visitType,
      visitDescription: plan.visitDescription,
      visitManager: plan.visitManager,
      visitManagerId: plan.visitManagerId,
      notes: plan.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bu ziyaret planını silmek istediğinizden emin misiniz?')) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      branchName: '',
      branchId: 0,
      visitDate: format(new Date(), 'yyyy-MM-dd'),
      visitTime: '09:00',
      visitType: 'Denetim',
      visitDescription: '',
      visitManager: '',
      visitManagerId: 0,
      notes: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Ziyaret Planları</h1>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Yeni Ziyaret Planı
        </Button>
      </div>

      {showForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>{editingId ? 'Ziyaret Planını Düzenle' : 'Yeni Ziyaret Planı Oluştur'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Şube Adı</label>
                <Input
                  value={formData.branchName}
                  onChange={(e: any) => setFormData({ ...formData, branchName: e.target.value })}
                  placeholder="Şube adını girin"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ziyaret Tarihi</label>
                <Input
                  type="date"
                  value={formData.visitDate}
                  onChange={(e: any) => setFormData({ ...formData, visitDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ziyaret Saati</label>
                <Input
                  type="time"
                  value={formData.visitTime}
                  onChange={(e: any) => setFormData({ ...formData, visitTime: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ziyaret Türü</label>
                <select
                  value={formData.visitType}
                  onChange={(e: any) => setFormData({ ...formData, visitType: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option>Denetim</option>
                  <option>Eğitim</option>
                  <option>Ürün Tanıtımı</option>
                  <option>Sorun Çözümü</option>
                  <option>Diğer</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Ziyaret Açıklaması</label>
                <textarea
                  value={formData.visitDescription}
                  onChange={(e: any) => setFormData({ ...formData, visitDescription: e.target.value })}
                  placeholder="Ziyaret açıklamasını girin"
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ziyaret Yöneticisi</label>
                <Input
                  value={formData.visitManager}
                  onChange={(e: any) => setFormData({ ...formData, visitManager: e.target.value })}
                  placeholder="Yönetici adını girin"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notlar</label>
                <Input
                  value={formData.notes}
                  onChange={(e: any) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ek notlar"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddPlan} disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingId ? 'Güncelle' : 'Kaydet'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>İptal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Input
          placeholder="Ara..."
          value={searchText}
          onChange={(e: any) => setSearchText(e.target.value)}
          className="flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e: any) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="Planlandı">Planlandı</option>
          <option value="Gerçekleşti">Gerçekleşti</option>
          <option value="İptal">İptal</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ziyaret Planları Listesi ({filteredPlans.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Şube</th>
                    <th className="text-left py-3 px-4">Tarih</th>
                    <th className="text-left py-3 px-4">Saat</th>
                    <th className="text-left py-3 px-4">Ziyaret Türü</th>
                    <th className="text-left py-3 px-4">Açıklama</th>
                    <th className="text-left py-3 px-4">Yönetici</th>
                    <th className="text-left py-3 px-4">Durum</th>
                    <th className="text-left py-3 px-4">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlans.map((plan: any) => (
                    <tr key={plan.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{plan.branchName}</td>
                      <td className="py-3 px-4">{format(new Date(plan.visitDate), 'dd/MM/yyyy', { locale: tr })}</td>
                      <td className="py-3 px-4">{plan.visitTime}</td>
                      <td className="py-3 px-4">
                        <Badge className={visitTypeColors[plan.visitType]}>
                          {plan.visitType}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">{plan.visitDescription}</td>
                      <td className="py-3 px-4">{plan.visitManager}</td>
                      <td className="py-3 px-4">
                        <Badge className={statusColors[plan.status]}>
                          {plan.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(plan)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(plan.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
