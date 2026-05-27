import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";

export default function CriticalQuestionWarnings() {
  const [selectedWarning, setSelectedWarning] = useState<any>(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Şube bazlı uyarıları getir
  const warningsQuery = trpc.fieldInspection.getWarningsSummary.useQuery();
  
  const resolveWarningMutation = trpc.fieldInspection.resolveWarning.useMutation({
    onSuccess: () => {
      warningsQuery.refetch();
      setResolveModalOpen(false);
      setResolutionNotes("");
      setSelectedWarning(null);
    },
  });

  const handleResolve = () => {
    if (selectedWarning) {
      resolveWarningMutation.mutate({
        warningId: selectedWarning.id,
        notes: resolutionNotes,
      });
    }
  };

  // Veri yapısı: warningsByBranch = { branchId, branchCode, branchName, warningCount, lastWarningDate, warnings: [] }
  const warningsByBranch = Array.isArray(warningsQuery.data) ? warningsQuery.data : [];

  // Aktif ve çözülen uyarıları ayır
  const activeWarnings = warningsByBranch.map((branch: any) => ({
    ...branch,
    warnings: Array.isArray(branch.warnings) 
      ? branch.warnings.filter((w: any) => w.status === "active") 
      : [],
  })).filter((branch: any) => branch.warnings.length > 0);

  const resolvedWarnings = warningsByBranch.map((branch: any) => ({
    ...branch,
    warnings: Array.isArray(branch.warnings) 
      ? branch.warnings.filter((w: any) => w.status === "resolved") 
      : [],
  })).filter((branch: any) => branch.warnings.length > 0);

  const isLoading = warningsQuery.isLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 bg-background">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kritik Soru Uyarıları</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Aynı kritik soruya üst üste 2 defa hayır cevabı verilen şubeler
          </p>
        </div>

        {/* Active Warnings */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Aktif Uyarılar ({activeWarnings.reduce((sum, b) => sum + b.warnings.length, 0)})
            </CardTitle>
            <CardDescription>Acil müdahale gerektiren uyarılar</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
            ) : activeWarnings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aktif uyarı bulunmamaktadır</p>
            ) : (
              <div className="space-y-6">
                {activeWarnings.map((branch: any) => (
                  <div key={branch.branchId} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    {/* Şube Başlığı */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">
                          {branch.branchName} ({branch.branchCode})
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Son uyarı: {new Date(branch.lastWarningDate).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                      <Badge className="bg-red-600">
                        {branch.warnings.length} Uyarı
                      </Badge>
                    </div>

                    {/* Uyarı Detayları */}
                    <div className="space-y-3">
                      {branch.warnings.map((warning: any) => (
                        <div key={warning.id} className="bg-white rounded p-3 border border-red-100">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{warning.categoryName}</p>
                              <p className="text-sm text-muted-foreground mt-1">{warning.questionText}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Uyarı Tarihi: {new Date(warning.createdAt).toLocaleDateString("tr-TR")}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50 ml-2"
                              onClick={() => {
                                setSelectedWarning(warning);
                                setResolveModalOpen(true);
                              }}
                            >
                              Çöz
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resolved Warnings */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Çözülen Uyarılar ({resolvedWarnings.reduce((sum, b) => sum + b.warnings.length, 0)})
            </CardTitle>
            <CardDescription>Müdahale yapılan ve çözülen uyarılar</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
            ) : resolvedWarnings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Çözülen uyarı bulunmamaktadır</p>
            ) : (
              <div className="space-y-6">
                {resolvedWarnings.map((branch: any) => (
                  <div key={branch.branchId} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    {/* Şube Başlığı */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">
                          {branch.branchName} ({branch.branchCode})
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Son çözüm: {new Date(branch.lastWarningDate).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                      <Badge className="bg-green-600">
                        {branch.warnings.length} Çözüldü
                      </Badge>
                    </div>

                    {/* Uyarı Detayları */}
                    <div className="space-y-3">
                      {branch.warnings.map((warning: any) => (
                        <div key={warning.id} className="bg-white rounded p-3 border border-green-100">
                          <div>
                            <p className="font-medium text-foreground">{warning.categoryName}</p>
                            <p className="text-sm text-muted-foreground mt-1">{warning.questionText}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Çözüm Tarihi: {new Date(warning.createdAt).toLocaleDateString("tr-TR")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resolve Warning Modal */}
        <Dialog open={resolveModalOpen} onOpenChange={setResolveModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Uyarıyı Çöz</DialogTitle>
              <DialogDescription>
                {selectedWarning?.categoryName && selectedWarning?.questionText 
                  ? `${selectedWarning.categoryName} - ${selectedWarning.questionText}`
                  : "Uyarı Çözümü"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Çözüm Notları (Opsiyonel)
                </label>
                <Textarea
                  placeholder="Yapılan müdahaleler ve sonuçlar hakkında notlar yazınız..."
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setResolveModalOpen(false)}
                >
                  İptal
                </Button>
                <Button
                  onClick={handleResolve}
                  disabled={resolveWarningMutation.isPending}
                >
                  {resolveWarningMutation.isPending ? "Kaydediliyor..." : "Çözüldü Olarak İşaretle"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
