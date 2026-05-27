import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Question {
  id: number;
  questionNumber: number;
  questionText: string;
  category: string;
  isCritical: boolean;
  noCount: number;
}

interface CategoryQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  questions: Question[];
  totalQuestions: number;
  noAnswerCount: number;
  noAnswerPercentage: number;
}

export function CategoryQuestionsModal({
  isOpen,
  onClose,
  categoryName,
  questions,
  totalQuestions,
  noAnswerCount,
  noAnswerPercentage,
}: CategoryQuestionsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {categoryName}
          </DialogTitle>
          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Toplam Soru:</span>
              <Badge variant="outline">{totalQuestions}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Hayır Sayısı:</span>
              <Badge variant="destructive">{noAnswerCount}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Hayır Oranı:</span>
              <Badge className="bg-red-100 text-red-800">
                {noAnswerPercentage}%
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {questions && questions.length > 0 ? (
              questions.map((question, index) => (
                <div
                  key={question.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm text-gray-600">
                          Soru {question.questionNumber}
                        </span>
                        {question.isCritical && (
                          <Badge className="bg-red-600">KRİTİK</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {question.questionText}
                      </p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <div className="text-2xl font-bold text-red-600">
                        {question.noCount}
                      </div>
                      <div className="text-xs text-gray-600">Hayır</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                Bu kategoriye ait soru bulunamadı
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
