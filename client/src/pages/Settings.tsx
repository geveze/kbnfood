import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function Settings() {
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    weeklyPlanCompleted: true,
    weeklyPlanFailed: true,
    inspectionResults: true,
    performanceAlerts: true,
    systemUpdates: false,
    phoneNumber: "",
  });

  // Bildirim tercihlerini getir
  const { data: currentPreferences, isLoading: isLoadingPreferences } =
    (trpc as any).notificationPreferences.getPreferences.useQuery();

  // Bildirim tercihlerini güncelle
  const updateMutation = (trpc as any).notificationPreferences.updatePreferences.useMutation({
    onSuccess: () => {
      console.log("Bildirim tercihleri başarıyla kaydedildi");
    },
    onError: (error: any) => {
      console.error("Bildirim tercihleri kaydedilirken hata oluştu:", error);
    },
  });

  // Tercihler yüklendiğinde state'i güncelle
  useEffect(() => {
    if (currentPreferences) {
      setPreferences({
        emailNotifications: currentPreferences.emailNotifications ?? true,
        smsNotifications: currentPreferences.smsNotifications ?? false,
        weeklyPlanCompleted: currentPreferences.weeklyPlanCompleted ?? true,
        weeklyPlanFailed: currentPreferences.weeklyPlanFailed ?? true,
        inspectionResults: currentPreferences.inspectionResults ?? true,
        performanceAlerts: currentPreferences.performanceAlerts ?? true,
        systemUpdates: currentPreferences.systemUpdates ?? false,
        phoneNumber: currentPreferences.phoneNumber ?? "",
      });
    }
  }, [currentPreferences]);

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev: any) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences((prev: any) => ({
      ...prev,
      phoneNumber: e.target.value,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateMutation.mutateAsync(preferences);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingPreferences) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Ayarlar</h1>
          <p className="text-muted-foreground mt-2">Bildirim tercihlerinizi yönetin</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bildirim Tercihleri</CardTitle>
            <CardDescription>
              Hangi bildirimleri almak istediğinizi seçin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* E-posta Bildirimleri */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base font-semibold">E-posta Bildirimleri</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Tüm bildirimleri e-posta ile alın
                </p>
              </div>
              <Switch
                checked={preferences.emailNotifications}
                onCheckedChange={() => handleToggle("emailNotifications")}
              />
            </div>

            {/* SMS Bildirimleri */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base font-semibold">SMS Bildirimleri</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Acil bildirimleri SMS ile alın
                </p>
              </div>
              <Switch
                checked={preferences.smsNotifications}
                onCheckedChange={() => handleToggle("smsNotifications")}
              />
            </div>

            {/* Telefon Numarası */}
            {preferences.smsNotifications && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <Label htmlFor="phone" className="text-base font-semibold">
                  Telefon Numarası
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+90 5XX XXX XXXX"
                  value={preferences.phoneNumber}
                  onChange={handlePhoneChange}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  SMS bildirimleri almak için telefon numaranız gereklidir
                </p>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Bildirim Türleri</h3>

              {/* Haftalık Plan Tamamlandı */}
              <div className="flex items-center justify-between p-3 mb-3 border rounded">
                <Label className="text-sm">Haftalık Plan Tamamlandı</Label>
                <Switch
                  checked={preferences.weeklyPlanCompleted}
                  onCheckedChange={() => handleToggle("weeklyPlanCompleted")}
                />
              </div>

              {/* Haftalık Plan Başarısız */}
              <div className="flex items-center justify-between p-3 mb-3 border rounded">
                <Label className="text-sm">Haftalık Plan Başarısız</Label>
                <Switch
                  checked={preferences.weeklyPlanFailed}
                  onCheckedChange={() => handleToggle("weeklyPlanFailed")}
                />
              </div>

              {/* Denetim Sonuçları */}
              <div className="flex items-center justify-between p-3 mb-3 border rounded">
                <Label className="text-sm">Denetim Sonuçları</Label>
                <Switch
                  checked={preferences.inspectionResults}
                  onCheckedChange={() => handleToggle("inspectionResults")}
                />
              </div>

              {/* Performans Uyarıları */}
              <div className="flex items-center justify-between p-3 mb-3 border rounded">
                <Label className="text-sm">Performans Uyarıları</Label>
                <Switch
                  checked={preferences.performanceAlerts}
                  onCheckedChange={() => handleToggle("performanceAlerts")}
                />
              </div>

              {/* Sistem Güncellemeleri */}
              <div className="flex items-center justify-between p-3 border rounded">
                <Label className="text-sm">Sistem Güncellemeleri</Label>
                <Switch
                  checked={preferences.systemUpdates}
                  onCheckedChange={() => handleToggle("systemUpdates")}
                />
              </div>
            </div>

            {/* Kaydet Butonu */}
            <div className="flex gap-3 pt-6">
              <Button
                onClick={handleSave}
                disabled={isLoading || updateMutation.isPending}
                className="w-full"
              >
                {isLoading || updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  "Değişiklikleri Kaydet"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
