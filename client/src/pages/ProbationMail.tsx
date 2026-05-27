import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertCircle, Mail, CheckCircle2 } from "lucide-react";

interface MailScheduleItem {
  id: number;
  employeeName: string;
  employeeTCNumber: string;
  branchName: string;
  hireDate: string;
  daysSinceHire: number;
  nextMailDay: number;
  daysUntilNextMail: number;
  shouldSendMail: boolean;
}

export function ProbationMail() {
  const { user } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [mailType, setMailType] = useState<"45days" | "165days" | "180days">("45days");
  const [sendingMail, setSendingMail] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Mail takvimi getir
  const { data: mailSchedule = [], isLoading } = (trpc as any).probationEvaluation.getMailSchedule.useQuery({
    branch: selectedBranch === "all" ? undefined : selectedBranch,
  });

  // Mail gönder mutation
  const sendMailMutation = (trpc as any).probationEvaluation.sendProbationEmails.useMutation({
    onSuccess: (data: any) => {
      setSendingMail(false);
      setSuccessMessage(`${data.sentCount} personel için mail gönderildi`);
      setSelectedItems([]);
      setTimeout(() => setSuccessMessage(""), 5000);
    },
    onError: (error: any) => {
      setSendingMail(false);
      alert(`Hata: ${error.message}`);
    },
  });

  const handleSelectAll = () => {
    if (selectedItems.length === mailSchedule.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(mailSchedule.map((item: any) => item.id));
    }
  };

  const handleSelectItem = (id: number) => {
    setSelectedItems((prev: any) =>
      prev.includes(id) ? prev.filter((item: any) => item !== id) : [...prev, id]
    );
  };

  const handleSendMail = async () => {
    if (selectedItems.length === 0) {
      alert("Lütfen en az bir personel seçiniz");
      return;
    }

    setSendingMail(true);
    await sendMailMutation.mutateAsync({
      evaluationIds: selectedItems,
      mailType,
    });
  };

  // Şubeler listesi
  const branches = Array.from(new Set(mailSchedule.map((item: any) => item.branchName)));

  // Filtrelenmiş veriler
  const filteredData = selectedBranch && selectedBranch !== "all"
    ? mailSchedule.filter((item: any) => item.branchName === selectedBranch)
    : mailSchedule;

  const mailTypeLabel = {
    "45days": "1,5 Ay Değerlendirmesi",
    "165days": "5,5 Ay Değerlendirmesi",
    "180days": "180 Gün Deneme Süresi Sonu",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Deneme Süresi Mail Sistemi</h1>
        <p className="text-gray-600 mt-2">
          45. gün, 165. gün ve 180. günde deneme süresi hatırlatıcı maillerini gönderin
        </p>
      </div>

      {/* Başarı Mesajı */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      {/* Filtreleme */}
      <Card>
        <CardHeader>
          <CardTitle>Filtreleme ve Mail Gönderme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Şube Seçimi */}
            <div>
              <label className="block text-sm font-medium mb-2">Şube</label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm Şubeler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Şubeler</SelectItem>
                  {branches.map((branch: any) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mail Tipi Seçimi */}
            <div>
              <label className="block text-sm font-medium mb-2">Mail Tipi</label>
              <Select value={mailType} onValueChange={(value: any) => setMailType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="45days">1,5 Ay Değerlendirmesi</SelectItem>
                  <SelectItem value="165days">5,5 Ay Değerlendirmesi</SelectItem>
                  <SelectItem value="180days">180 Gün Deneme Süresi Sonu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Seçili Personel Sayısı */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800">
              {selectedItems.length} personel seçildi ({filteredData.length} toplam)
            </span>
          </div>

          {/* Mail Gönder Butonu */}
          <Button
            onClick={handleSendMail}
            disabled={sendingMail || selectedItems.length === 0}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Mail className="w-4 h-4 mr-2" />
            {sendingMail ? "Mail Gönderiliyor..." : "Seçili Personele Mail Gönder"}
          </Button>
        </CardContent>
      </Card>

      {/* Mail Takvimi Tablosu */}
      <Card>
        <CardHeader>
          <CardTitle>Mail Gönderilmesi Gereken Personeller</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            {filteredData.length} personel için mail gönderilmesi gerekiyor
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Yükleniyor...</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Mail gönderilmesi gereken personel yok</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">
                      <Checkbox
                        checked={selectedItems.length === filteredData.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">Personel Adı</th>
                    <th className="text-left py-3 px-4 font-semibold">T.C. Numarası</th>
                    <th className="text-left py-3 px-4 font-semibold">Şube</th>
                    <th className="text-left py-3 px-4 font-semibold">İşe Giriş Tarihi</th>
                    <th className="text-left py-3 px-4 font-semibold">Gün Farkı</th>
                    <th className="text-left py-3 px-4 font-semibold">Sonraki Mail</th>
                    <th className="text-left py-3 px-4 font-semibold">Gün Kaldı</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item: MailScheduleItem) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => handleSelectItem(item.id)}
                        />
                      </td>
                      <td className="py-3 px-4 font-medium">{item.employeeName}</td>
                      <td className="py-3 px-4">{item.employeeTCNumber}</td>
                      <td className="py-3 px-4">{item.branchName}</td>
                      <td className="py-3 px-4">{item.hireDate}</td>
                      <td className="py-3 px-4">{item.daysSinceHire} gün</td>
                      <td className="py-3 px-4">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {item.nextMailDay === 45
                            ? "1,5 Ay"
                            : item.nextMailDay === 165
                              ? "5,5 Ay"
                              : "180 Gün"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-sm font-medium ${
                            item.daysUntilNextMail <= 0
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {item.daysUntilNextMail} gün
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {filteredData.filter((item: any) => item.nextMailDay === 45).length}
              </div>
              <p className="text-sm text-gray-600 mt-2">1,5 Ay Değerlendirmesi Bekleyen</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {filteredData.filter((item: any) => item.nextMailDay === 165).length}
              </div>
              <p className="text-sm text-gray-600 mt-2">5,5 Ay Değerlendirmesi Bekleyen</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {filteredData.filter((item: any) => item.nextMailDay === 180).length}
              </div>
              <p className="text-sm text-gray-600 mt-2">180 Gün Sonu Bekleyen</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
