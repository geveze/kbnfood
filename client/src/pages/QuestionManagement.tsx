import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Edit, Plus } from 'lucide-react';

interface Question {
  id?: number;
  categoryId: number;
  questionText: string;
  points: number;
  maxScore: number;
  isCritical: boolean;
  criticalPenalty: number;
  criticalCategory: string;
  order: number;
}

export function QuestionManagement() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Question>({
    categoryId: 1,
    questionText: '',
    points: 1,
    maxScore: 5,
    isCritical: false,
    criticalPenalty: 0,
    criticalCategory: '',
    order: 1,
  });

  // Kategorileri ve soruları getir
  const categoriesWithQuestionsQuery = (trpc as any).fieldInspection.getCategoriesWithQuestions.useQuery({});
  const categoriesData = categoriesWithQuestionsQuery.data || [];
  const categories = categoriesData.map((cat: any) => ({ id: cat.id, name: cat.name, order: cat.order }));
  const questions = selectedCategory 
    ? categoriesData.find((cat: any) => cat.id === parseInt(selectedCategory))?.questions || []
    : [];

  // Soru ekleme/güncelleme
  const upsertMutation = trpc.fieldInspection.upsertQuestion.useMutation({
    onSuccess: () => {
      categoriesWithQuestionsQuery.refetch();
      setEditingQuestion(null);
      setIsAddingNew(false);
      setNewQuestion({
        categoryId: 1,
        questionText: '',
        points: 1,
        maxScore: 5,
        isCritical: false,
        criticalPenalty: 0,
        criticalCategory: '',
        order: 1,
      });
    },
  });

  // Soru silme
  const deleteMutation = trpc.fieldInspection.deleteQuestion.useMutation({
    onSuccess: () => {
      categoriesWithQuestionsQuery.refetch();
    },
  });

  const handleSaveQuestion = () => {
    if (editingQuestion) {
      upsertMutation.mutate(editingQuestion);
    } else if (isAddingNew) {
      upsertMutation.mutate(newQuestion);
    }
  };

  const handleDeleteQuestion = (id: number) => {
    if (confirm('Bu soruyu silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin - Soru Yönetimi</CardTitle>
          <CardDescription>Sorular ekleyin, düzenleyin veya silin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Kategori Seçimi */}
          <div>
            <label className="text-sm font-medium">Kategori Seçin</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçin..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Yeni Soru Ekleme Butonu */}
          {selectedCategory && (
            <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
              <DialogTrigger asChild>
                <Button className="w-full" onClick={() => setIsAddingNew(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Soru Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Yeni Soru Ekle</DialogTitle>
                  <DialogDescription>Yeni bir soru oluşturun</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Soru Metni</label>
                    <Textarea
                      value={newQuestion.questionText}
                      onChange={(e: any) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                      placeholder="Soru metnini girin..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Puan</label>
                      <Input
                        type="number"
                        value={newQuestion.points}
                        onChange={(e: any) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Maksimum Puan</label>
                      <Input
                        type="number"
                        value={newQuestion.maxScore}
                        onChange={(e: any) => setNewQuestion({ ...newQuestion, maxScore: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Kritik Soru?</label>
                      <Select value={newQuestion.isCritical ? 'yes' : 'no'} onValueChange={(val: any) => setNewQuestion({ ...newQuestion, isCritical: val === 'yes' })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">Hayır</SelectItem>
                          <SelectItem value="yes">Evet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Kritik Puan Düşümü</label>
                      <Input
                        type="number"
                        value={newQuestion.criticalPenalty}
                        onChange={(e: any) => setNewQuestion({ ...newQuestion, criticalPenalty: parseInt(e.target.value) })}
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Kritik Kategori</label>
                    <Input
                      value={newQuestion.criticalCategory}
                      onChange={(e: any) => setNewQuestion({ ...newQuestion, criticalCategory: e.target.value })}
                      placeholder="Örn: MARKA STANDARTLARI, GIDA GÜVENLİĞİ"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Sıra</label>
                    <Input
                      type="number"
                      value={newQuestion.order}
                      onChange={(e: any) => setNewQuestion({ ...newQuestion, order: parseInt(e.target.value) })}
                      min="1"
                    />
                  </div>
                  <Button onClick={handleSaveQuestion} className="w-full" disabled={upsertMutation.isPending}>
                    {upsertMutation.isPending ? 'Kaydediliyor...' : 'Soruyu Kaydet'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Sorular Listesi */}
          {selectedCategory && (
            <div className="space-y-3 mt-6">
              <h3 className="font-semibold">Sorular ({questions.length})</h3>
              {questions.length === 0 ? (
                <p className="text-sm text-gray-500">Bu kategoride soru bulunmamaktadır.</p>
              ) : (
                <div className="space-y-2">
                  {questions.map((question: any) => (
                    <Card key={question.id} className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{question.questionText}</p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-600">
                            <span>Puan: {question.points}/{question.maxScore}</span>
                            {question.isCritical && <span className="text-red-600 font-semibold">Kritik Soru</span>}
                            {question.criticalCategory && <span className="text-orange-600">{question.criticalCategory}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingQuestion(question)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Soruyu Düzenle</DialogTitle>
                                <DialogDescription>Soru bilgilerini güncelleyin</DialogDescription>
                              </DialogHeader>
                              {editingQuestion && (
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium">Soru Metni</label>
                                    <Textarea
                                      value={editingQuestion.questionText}
                                      onChange={(e: any) => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                                      placeholder="Soru metnini girin..."
                                      rows={3}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Puan</label>
                                      <Input
                                        type="number"
                                        value={editingQuestion.points}
                                        onChange={(e: any) => setEditingQuestion({ ...editingQuestion, points: parseInt(e.target.value) })}
                                        min="1"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Maksimum Puan</label>
                                      <Input
                                        type="number"
                                        value={editingQuestion.maxScore}
                                        onChange={(e: any) => setEditingQuestion({ ...editingQuestion, maxScore: parseInt(e.target.value) })}
                                        min="1"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Kritik Soru?</label>
                                      <Select value={editingQuestion.isCritical ? 'yes' : 'no'} onValueChange={(val: any) => setEditingQuestion({ ...editingQuestion, isCritical: val === 'yes' })}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="no">Hayır</SelectItem>
                                          <SelectItem value="yes">Evet</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Kritik Puan Düşümü</label>
                                      <Input
                                        type="number"
                                        value={editingQuestion.criticalPenalty}
                                        onChange={(e: any) => setEditingQuestion({ ...editingQuestion, criticalPenalty: parseInt(e.target.value) })}
                                        min="0"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Kritik Kategori</label>
                                    <Input
                                      value={editingQuestion.criticalCategory}
                                      onChange={(e: any) => setEditingQuestion({ ...editingQuestion, criticalCategory: e.target.value })}
                                      placeholder="Örn: MARKA STANDARTLARI, GIDA GÜVENLİĞİ"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Sıra</label>
                                    <Input
                                      type="number"
                                      value={editingQuestion.order}
                                      onChange={(e: any) => setEditingQuestion({ ...editingQuestion, order: parseInt(e.target.value) })}
                                      min="1"
                                    />
                                  </div>
                                  <Button onClick={handleSaveQuestion} className="w-full" disabled={upsertMutation.isPending}>
                                    {upsertMutation.isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                                  </Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteQuestion(question.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
