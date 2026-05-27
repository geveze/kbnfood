import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle, AlertCircle, Code } from "lucide-react";

export default function MailSystemDocumentation() {
  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Başlık */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Mail className="w-8 h-8" />
            Mail Sistemi Dokümantasyonu
          </h1>
          <p className="text-muted-foreground mt-2">
            Deneme Süresi Değerlendirme formundan sonra otomatik olarak gönderilen mail sistemi hakkında detaylı bilgiler
          </p>
        </div>

        {/* Genel Bilgi */}
        <Card>
          <CardHeader>
            <CardTitle>Sistem Özeti</CardTitle>
            <CardDescription>Mail sistemi nasıl çalışıyor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Otomatik Mail Gönderimi:</strong> Deneme Süresi Değerlendirme formu tamamlandığında (Kaydet butonuna tıklandığında), sistem otomatik olarak İK departmanı ve yöneticilere bildirim maili gönderir.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900">
                <strong>Alıcılar:</strong> Mail, proje sahibi (Abdullah) ve sistem yöneticilerine gönderilir. Gelecekte İK departmanı kullanıcıları da eklenebilir.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Mail Gönderme Süreci */}
        <Card>
          <CardHeader>
            <CardTitle>Mail Gönderme Süreci</CardTitle>
            <CardDescription>Adım adım nasıl çalışıyor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    1
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Değerlendirme Formu Tamamlanır</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Şube müdürü veya bölge sorumlusu Deneme Süresi Değerlendirme formunu doldurur ve <strong>"Kaydet"</strong> butonuna tıklar.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    2
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Veriler Veritabanında Kaydedilir</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tüm değerlendirme verileri (personel bilgileri, kriterler, puanlar, başarı yüzdesi) veritabanında saklanır. Tarih ve saat bilgisi de kaydedilir.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    3
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Mail Oluşturulur</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Backend'de <code className="bg-muted px-2 py-1 rounded text-xs">notifyOwner()</code> fonksiyonu çağrılır ve mail içeriği oluşturulur.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    4
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Mail Gönderilir</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Mail, Manus platformunun bildirim sistemi aracılığıyla proje sahibine gönderilir. Başarılı gönderim <code className="bg-muted px-2 py-1 rounded text-xs">true</code> döndürür.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    5
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Başarı Mesajı Gösterilir</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Frontend'de kullanıcıya "Değerlendirme başarıyla kaydedildi" mesajı gösterilir. Mail gönderimi başarısız olsa da veriler kaydedilmiştir.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mail İçeriği */}
        <Card>
          <CardHeader>
            <CardTitle>Mail İçeriği</CardTitle>
            <CardDescription>Gönderilen mail'de neler var</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg border border-border space-y-3">
              <div>
                <h4 className="font-semibold text-foreground text-sm">Başlık:</h4>
                <p className="text-sm text-muted-foreground">
                  "Deneme Süresi Değerlendirmesi Tamamlandı"
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground text-sm">İçerik:</h4>
                <div className="bg-background p-3 rounded text-sm text-muted-foreground space-y-2 mt-2 font-mono">
                  <p>Merhaba,</p>
                  <p>Deneme Süresi Değerlendirmesi tamamlanmıştır.</p>
                  <p>&nbsp;</p>
                  <p><strong>Personel Bilgileri:</strong></p>
                  <p>• Adı Soyadı: [Personel Adı]</p>
                  <p>• Sicil No / TC No: [Sicil No / TC No]</p>
                  <p>• Şube: [Şube Adı]</p>
                  <p>&nbsp;</p>
                  <p><strong>Değerlendirme Detayları:</strong></p>
                  <p>• Dönem: [1,5 Ay / 5,5 Ay]</p>
                  <p>• Başarı Yüzdesi: [%XX]</p>
                  <p>• Devam Kararı: [Evet / Hayır]</p>
                  <p>• Değerlendirenler: [Değerlendiren Adı]</p>
                  <p>&nbsp;</p>
                  <p>Lütfen sisteme giriş yaparak detaylı raporu görüntüleyin.</p>
                  <p>&nbsp;</p>
                  <p>Saygılarımızla,</p>
                  <p>Keban Food Performans Sistemi</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teknik Detaylar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Teknik Detaylar
            </CardTitle>
            <CardDescription>Backend implementasyonu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Kullanılan Fonksiyon:</h4>
              <div className="bg-muted p-3 rounded-lg border border-border font-mono text-sm overflow-x-auto">
                <code>{`await notifyOwner({
  title: "Deneme Süresi Değerlendirmesi Tamamlandı",
  content: "Personel: [Ad], Sicil: [No], Şube: [Ad], Dönem: [Dönem], Başarı: [%], Karar: [Evet/Hayır], Değerlendirenler: [Ad]"
})`}</code>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Dosya Konumu:</h4>
              <p className="text-sm text-muted-foreground">
                <code className="bg-muted px-2 py-1 rounded">server/probation-evaluation-routers.ts</code> - <code className="bg-muted px-2 py-1 rounded">complete</code> prosedürü içinde
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Gönderim Zamanı:</h4>
              <p className="text-sm text-muted-foreground">
                Değerlendirme formu kaydedildiği anda (Kaydet butonuna tıklandığında) otomatik olarak gönderilir.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Hata Yönetimi:</h4>
              <p className="text-sm text-muted-foreground">
                Mail gönderimi başarısız olsa bile, değerlendirme verileri veritabanında kaydedilir. Sistem <code className="bg-muted px-2 py-1 rounded">true/false</code> döndürerek gönderim durumunu belirtir.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Alıcılar */}
        <Card>
          <CardHeader>
            <CardTitle>Mail Alıcıları</CardTitle>
            <CardDescription>Mail'i kimler alıyor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground">Proje Sahibi (Abdullah)</h4>
                  <p className="text-sm text-muted-foreground">
                    Tüm değerlendirmeler hakkında bildirim alır. Sistem yöneticisi olarak genel gözetim yapabilir.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground">Gelecek Genişleme</h4>
                  <p className="text-sm text-muted-foreground">
                    İK departmanı kullanıcıları ve ilgili yöneticiler mail listesine eklenebilir. Rol bazlı mail gönderimi uygulanabilir.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kullanım Rehberi */}
        <Card>
          <CardHeader>
            <CardTitle>Kullanım Rehberi</CardTitle>
            <CardDescription>Sistem kullanıcıları için adımlar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-foreground text-sm mb-2">1. Değerlendirme Formunu Doldurun</h4>
                <p className="text-sm text-muted-foreground">
                  Sidebar'da "Deneme Süresi Değerlendirme" linkine tıklayın. Personel bilgilerini, kriterleri puanlandırın.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground text-sm mb-2">2. Kaydet Butonuna Tıklayın</h4>
                <p className="text-sm text-muted-foreground">
                  Form tamamlandığında "Kaydet" butonuna tıklayın. Veriler veritabanında kaydedilecek ve mail gönderilecek.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground text-sm mb-2">3. PDF Yazdırın (İsteğe Bağlı)</h4>
                <p className="text-sm text-muted-foreground">
                  "PDF Olarak Yazdır" butonuna tıklayarak değerlendirme formunun PDF'ini indirebilirsiniz.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground text-sm mb-2">4. Geçmişi Görüntüleyin</h4>
                <p className="text-sm text-muted-foreground">
                  Sidebar'da "Değerlendirme Geçmişi" linkine tıklayarak tamamlanan tüm değerlendirmeleri görebilirsiniz.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SSS */}
        <Card>
          <CardHeader>
            <CardTitle>Sık Sorulan Sorular</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-1">Mail gönderimi başarısız olursa ne olur?</h4>
              <p className="text-sm text-muted-foreground">
                Değerlendirme verileri yine de veritabanında kaydedilir. Mail gönderimi başarısız olsa bile, veriler kaybolmaz.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground text-sm mb-1">Mail'i kim alıyor?</h4>
              <p className="text-sm text-muted-foreground">
                Şu anda proje sahibi (Abdullah) alıyor. Gelecekte İK departmanı ve yöneticiler de eklenebilir.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground text-sm mb-1">Mail'i tekrar göndermek mümkün mü?</h4>
              <p className="text-sm text-muted-foreground">
                Şu anda manuel olarak tekrar gönderme özelliği yok. Gelecekte "Mail Yeniden Gönder" butonu eklenebilir.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground text-sm mb-1">Mail şablonunu özelleştirebilir miyim?</h4>
              <p className="text-sm text-muted-foreground">
                Evet, backend'de mail içeriği değiştirilebilir. Sistem yöneticisine başvurun.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
