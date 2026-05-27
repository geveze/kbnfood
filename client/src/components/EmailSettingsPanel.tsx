import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, Save, Plus, Trash2 } from "lucide-react";

interface EmailSetting {
  id: number;
  key: string;
  value: string;
  description?: string;
}

export default function EmailSettingsPanel() {
  const [settings, setSettings] = useState<EmailSetting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState("");

  // Backend'den mail ayarlarını çek
  const { data: emailSettings, isLoading: isLoadingSettings } = (trpc as any).emailSettings.getAll.useQuery();
  const updateMutation = (trpc as any).emailSettings.update.useMutation();

  useEffect(() => {
    if (emailSettings) {
      setSettings(emailSettings as EmailSetting[]);
      // Mail alıcılarını ayarlardan yükle
      const recipientsSetting = emailSettings.find((s: any) => s.key === "performance_monitoring_recipients");
      if (recipientsSetting?.value) {
        try {
          const parsed = JSON.parse(recipientsSetting.value);
          setRecipients(Array.isArray(parsed) ? parsed : [recipientsSetting.value]);
        } catch {
          setRecipients([recipientsSetting.value]);
        }
      }
    }
  }, [emailSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const setting of settings) {
        await updateMutation.mutateAsync({
          key: setting.key,
          value: setting.value,
          description: setting.description,
        });
      }
      
      // Mail alıcılarını kaydet
      if (recipients.length > 0) {
        await updateMutation.mutateAsync({
          key: "performance_monitoring_recipients",
          value: JSON.stringify(recipients),
          description: "Performance-monitoring formu doldurulduğunda mail gönderilecek alıcılar",
        });
      }
      
      toast.success("Mail ayarları başarıyla kaydedildi");
    } catch (error: any) {
      toast.error(error?.message || "Mail ayarları kaydedilirken hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingChange = (key: string, field: string, value: string) => {
    setSettings((prev) =>
      prev.map((s) =>
        s.key === key ? { ...s, [field]: value } : s
      )
    );
  };

  const handleAddRecipient = () => {
    if (newRecipient.trim() && !recipients.includes(newRecipient.trim())) {
      setRecipients([...recipients, newRecipient.trim()]);
      setNewRecipient("");
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  if (isLoadingSettings) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Mail Ayarları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Mail Ayarları
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Performance-monitoring formu doldurulduğunda gönderilecek mail adresini, içeriğini ve alıcılarını ayarlayın.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {settings.map((setting) => (
            <div key={`setting-${setting.key}`} className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                {setting.key === "performance_monitoring_email"
                  ? "Varsayılan Mail Adresi"
                  : "Mail İçeriği (Şablonu)"}
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                {setting.description}
              </p>
              {setting.key === "performance_monitoring_email" ? (
                <input
                  type="email"
                  value={setting.value}
                  onChange={(e) =>
                    handleSettingChange(setting.key, "value", e.target.value)
                  }
                  className="filter-input w-full"
                  placeholder="Mail adresi girin"
                />
              ) : (
                <textarea
                  value={setting.value}
                  onChange={(e) =>
                    handleSettingChange(setting.key, "value", e.target.value)
                  }
                  className="filter-input w-full min-h-[150px] resize-none"
                  placeholder="Mail içeriğini girin"
                />
              )}
            </div>
          ))}

          {/* Mail Alıcıları */}
          <div className="space-y-2 border-t pt-6">
            <label className="block text-sm font-medium text-foreground">
              Mail Alıcıları
            </label>
            <p className="text-xs text-muted-foreground mb-4">
              Performance-monitoring formu doldurulduğunda mail gönderilecek alıcıları ekleyin.
            </p>
            
            {/* Alıcı Listesi */}
            <div className="space-y-2">
              {recipients.map((email) => (
                <div
                  key={`recipient-${email}`}
                  className="flex items-center justify-between bg-muted p-3 rounded border border-border"
                >
                  <span className="text-sm text-foreground">{email}</span>
                  <button
                    onClick={() => handleRemoveRecipient(email)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 p-1 rounded transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Yeni Alıcı Ekle */}
            <div className="flex gap-2">
              <input
                type="email"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddRecipient()}
                className="filter-input flex-1"
                placeholder="Mail adresi girin"
              />
              <Button
                onClick={handleAddRecipient}
                size="sm"
                className="bg-primary hover:bg-primary/90 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ekle
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving || updateMutation.isPending}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving || updateMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
