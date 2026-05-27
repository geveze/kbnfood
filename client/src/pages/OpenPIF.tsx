import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

export function OpenPIF() {
  const [step, setStep] = useState<"selection" | "form" | "review">("selection");
  const [branchId, setBranchId] = useState<number>(1);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    employeeName: "",
    employeeIdNumber: "",
    evaluatorName: "",
    evaluationDate: new Date().toString().split("T")[0],
  });
  const [scores, setScores] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pozisyonları getir
  const { data: positions, isLoading: positionsLoading } = (trpc as any).openPif.getPositions.useQuery();

  // Seçilen pozisyonun sorularını getir
  const { data: positionData, isLoading: questionLoading } = (trpc as any).openPif.getPositionWithQuestions.useQuery(
    { positionId: selectedPosition || 0 },
    { enabled: selectedPosition !== null && step === "form" }
  );

  // Değerlendirme oluştur
  const createEvaluation = (trpc as any).openPif.create.useMutation();

  const handlePositionSelect = (positionId: number) => {
    setSelectedPosition(positionId);
    setScores({});
    setStep("form");
  };

  const handleScoreChange = (categoryId: number, score: number) => {
    setScores((prev: any) => ({
      ...prev,
      [categoryId]: score,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await createEvaluation.mutateAsync({
        branchId,
        positionId: selectedPosition!,
        employeeName: formData.employeeName,
        employeeIdNumber: formData.employeeIdNumber,
        evaluatedByName: formData.evaluatorName,
        evaluationDate: new Date(formData.evaluationDate),
        answers: scores,
      });

      // Reset form
      setStep("selection");
      setSelectedPosition(null);
      setFormData({
        employeeName: "",
        employeeIdNumber: "",
        evaluatorName: "",
        evaluationDate: new Date().toString().split("T")[0],
      });
      setScores({});

      alert("Değerlendirme başarıyla kaydedildi!");
    } catch (error: any) {
      console.error("Error submitting evaluation:", error);
      alert("Değerlendirme kaydedilirken hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const allScoresFilled =
    positionData?.categories &&
    positionData.categories.every((cat: any) => scores[cat.id] !== undefined);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Performans İzleme Formu (PİF)
          </h1>
          <p className="text-gray-600">
            Personel performansını değerlendirmek için formu doldurunuz
          </p>
        </div>

        {/* Step 1: Position Selection */}
        {step === "selection" && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Pozisyon Seçimi</CardTitle>
              <CardDescription>
                Değerlendirilecek personelin pozisyonunu seçiniz
              </CardDescription>
            </CardHeader>
            <CardContent>
              {positionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {positions?.map((position: any) => (
                    <Button
                      key={position.id}
                      onClick={() => handlePositionSelect(position.id)}
                      variant="outline"
                      className="h-20 text-lg font-semibold hover:bg-blue-50 hover:border-blue-600"
                    >
                      {position.name}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Evaluation Form */}
        {step === "form" && positionData && (
          <div className="space-y-6">
            {/* Employee Info */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Personel Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employeeName">Personel Adı Soyadı</Label>
                    <Input
                      id="employeeName"
                      value={formData.employeeName}
                      onChange={(e: any) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          employeeName: e.target.value,
                        }))
                      }
                      placeholder="Adı Soyadı"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="employeeIdNumber">Sicil Numarası</Label>
                    <Input
                      id="employeeIdNumber"
                      value={formData.employeeIdNumber}
                      onChange={(e: any) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          employeeIdNumber: e.target.value,
                        }))
                      }
                      placeholder="Sicil Numarası"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="evaluatorName">Değerlendirmeyi Yapan</Label>
                    <Input
                      id="evaluatorName"
                      value={formData.evaluatorName}
                      onChange={(e: any) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          evaluatorName: e.target.value,
                        }))
                      }
                      placeholder="Değerlendirmeyi Yapan Adı"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="evaluationDate">Değerlendirme Tarihi</Label>
                    <Input
                      id="evaluationDate"
                      type="date"
                      value={formData.evaluationDate}
                      onChange={(e: any) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          evaluationDate: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions */}
            {questionLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : (
              positionData.categories?.map((category: any) => (
                <Card key={category.id} className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {category.questions?.map((question: any) => (
                      <div key={question.id} className="space-y-3">
                        <p className="font-medium text-gray-900">
                          {question.questionNumber}. {question.questionText}
                        </p>
                        <RadioGroup
                          value={scores[category.id]?.toString() || ""}
                          onValueChange={(value: any) =>
                            handleScoreChange(category.id, parseInt(value))
                          }
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="1" id={`q${question.id}-1`} />
                            <Label htmlFor={`q${question.id}-1`} className="cursor-pointer">
                              1 - Yetersiz
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="2" id={`q${question.id}-2`} />
                            <Label htmlFor={`q${question.id}-2`} className="cursor-pointer">
                              2 - Gelişime Açık
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="3" id={`q${question.id}-3`} />
                            <Label htmlFor={`q${question.id}-3`} className="cursor-pointer">
                              3 - Beklenen
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="4" id={`q${question.id}-4`} />
                            <Label htmlFor={`q${question.id}-4`} className="cursor-pointer">
                              4 - İyi
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="5" id={`q${question.id}-5`} />
                            <Label htmlFor={`q${question.id}-5`} className="cursor-pointer">
                              5 - Çok İyi
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={() => setStep("selection")}
                variant="outline"
                className="flex-1"
              >
                Geri
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!allScoresFilled || isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  "Değerlendirmeyi Kaydet"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
