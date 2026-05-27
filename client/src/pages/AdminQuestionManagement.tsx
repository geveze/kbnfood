import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface Question {
  id: number;
  categoryId: number;
  questionText: string;
  points: number | null;
  maxScore: number | null;
  penaltyPoints: number | null;
  isCritical: boolean | null;
  order: number | null;
}

interface Category {
  id: number;
  name: string;
  order?: number;
  weight?: number;
  questions: Question[];
}

export default function AdminQuestionManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValues, setEditingValues] = useState<Partial<Question>>({});
  const [loading, setLoading] = useState(true);

  // Fetch categories and questions
  const { data: categoriesData } = trpc.fieldInspection.getCategoriesWithQuestions.useQuery({});

  useEffect(() => {
    if (categoriesData) {
      setCategories(categoriesData);
      setLoading(false);
    }
  }, [categoriesData]);

  // Update question mutation
  const updateQuestionMutation = trpc.fieldInspection.updateQuestion.useMutation({
    onSuccess: () => {
      setEditingId(null);
      // Refetch data
      trpc.useUtils().fieldInspection.getCategoriesWithQuestions.invalidate();
    },
    onError: (error) => {
      console.error('Error updating question:', error);
    },
  });

  const handleEdit = (question: Question) => {
    setEditingId(question.id);
    setEditingValues(question);
  };

  const handleSave = async () => {
    if (!editingId) return;

    const question = categories
      .flatMap(c => c.questions)
      .find(q => q.id === editingId);
    
    if (!question) return;

    await updateQuestionMutation.mutateAsync({
      questionId: editingId,
      questionText: question.questionText,
      points: editingValues.points ?? 0,
      penaltyPoints: editingValues.penaltyPoints ?? 0,
      isCritical: editingValues.isCritical ?? false,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingValues({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Soru Yönetimi</h1>

        {categories.map((category) => (
          <Card key={category.id} className="mb-6 p-6">
            <h2 className="text-xl font-semibold mb-4">{category.name}</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Soru</th>
                    <th className="px-4 py-2 text-center">Puan</th>
                    <th className="px-4 py-2 text-center">Puan Düşümü</th>
                    <th className="px-4 py-2 text-center">Kritik</th>
                    <th className="px-4 py-2 text-center">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {category.questions.map((question) => (
                    <tr key={question.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{question.questionText}</td>
                      <td className="px-4 py-3 text-center">
                        {editingId === question.id ? (
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={editingValues.points || 0}
                            onChange={(e) =>
                              setEditingValues({
                                ...editingValues,
                                points: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-20 mx-auto"
                          />
                        ) : (
                          question.points
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {editingId === question.id ? (
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={editingValues.penaltyPoints || 0}
                            onChange={(e) =>
                              setEditingValues({
                                ...editingValues,
                                penaltyPoints: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-20 mx-auto"
                          />
                        ) : (
                          question.penaltyPoints
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {editingId === question.id ? (
                          <Checkbox
                            checked={editingValues.isCritical || false}
                            onCheckedChange={(checked) =>
                              setEditingValues({
                                ...editingValues,
                                isCritical: checked as boolean,
                              })
                            }
                          />
                        ) : question.isCritical ? (
                          '✓'
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {editingId === question.id ? (
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              onClick={handleSave}
                              disabled={updateQuestionMutation.isPending}
                            >
                              Kaydet
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancel}>
                              İptal
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleEdit(question)}>
                            Düzenle
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
