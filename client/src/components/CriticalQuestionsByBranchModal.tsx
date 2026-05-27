import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";

interface CriticalQuestion {
  questionId: number;
  questionText: string;
  categoryName: string;
  noCount: number;
  totalCount: number;
  noPercentage: number;
}

interface BranchCriticalData {
  branchId: number;
  branchName: string;
  branchCode: string;
  criticalQuestions: CriticalQuestion[];
}

interface CriticalQuestionsByBranchModalProps {
  data: BranchCriticalData[] | undefined;
  isLoading: boolean;
}

export function CriticalQuestionsByBranchModal({ data, isLoading }: CriticalQuestionsByBranchModalProps) {
  const [selectedBranch, setSelectedBranch] = useState<BranchCriticalData | null>(null);
  const [showModal, setShowModal] = useState(false);

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Kritik Sorular Raporu - Şube Bazında</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Kritik Sorular Raporu - Şube Bazında</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Hayır cevabı verilen kritik soru bulunmamaktadır
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Kritik Sorular Raporu - Şube Bazında</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.map((branch) => (
              <Card key={branch.branchId} className="border-border bg-muted/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{branch.branchName}</CardTitle>
                      <p className="text-sm text-muted-foreground">Kod: {branch.branchCode}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBranch(branch);
                        setShowModal(true);
                      }}
                    >
                      {branch.criticalQuestions.length} Kritik Soru
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && selectedBranch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="border-border w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedBranch.branchName}</CardTitle>
                  <p className="text-sm text-muted-foreground">Kod: {selectedBranch.branchCode}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="text-xl"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedBranch.criticalQuestions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-foreground font-semibold">Kategori</TableHead>
                        <TableHead className="text-foreground font-semibold">Soru</TableHead>
                        <TableHead className="text-right text-foreground font-semibold">Hayır Oranı</TableHead>
                        <TableHead className="text-right text-foreground font-semibold">Hayır Sayısı</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedBranch.criticalQuestions.map((question) => (
                        <TableRow key={question.questionId} className="border-border hover:bg-muted/50">
                          <TableCell className="text-sm text-muted-foreground">
                            <Badge variant="outline">{question.categoryName}</Badge>
                          </TableCell>
                          <TableCell className="font-medium text-foreground max-w-md">
                            {question.questionText}
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold text-red-600">
                            {question.noPercentage}%
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {question.noCount}/{question.totalCount}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Kritik soru bulunmamaktadır
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
