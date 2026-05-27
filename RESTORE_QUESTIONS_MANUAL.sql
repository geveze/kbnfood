-- ============================================================================
-- SAHA DENETİMİ SORULARI - MANUEL RESTORE VE KORUMA
-- ============================================================================
-- Bu SQL'i Management UI'daki Database panelinden çalıştırınız
-- ============================================================================

-- ADIM 1: Kategorileri Ekle
INSERT IGNORE INTO field_inspection_categories (name, description) VALUES
('IZGARA / PİŞİRNE', 'Izgara ve pişirme alanı standartları'),
('KASA - PAKET / PAZARYERİ', 'Kasa ve paket alanı standartları'),
('RESTORAN TEMİZLİK VE DÜZEN', 'Restoran temizlik ve düzen standartları'),
('EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ', 'Ekipman bakımı ve gıda güvenliği'),
('RESTORAN HİZMET VE KALİTE STANDARTLARI', 'Restoran hizmet ve kalite standartları');

-- ADIM 2: Soruları Ekle (32 soru)
INSERT IGNORE INTO field_inspection_questions (category_id, question_text, points, is_critical, point_deduction, description) VALUES
((SELECT id FROM field_inspection_categories WHERE name = 'IZGARA / PİŞİRNE'), 'SOĞUTUCU DOLAPLARIN İÇ VE DIŞ TEMİZLİKLERİ YETERLİ Mİ ? ( DERECESİ + 4 ) FİLTÜLERİN DURUMU , KONDANSÖR BAKIMI, YETERLİ Mİ ?', 2, 0, 0, 'Soğutucu dolapların temizlik ve bakım durumunun kontrolü'),
((SELECT id FROM field_inspection_categories WHERE name = 'IZGARA / PİŞİRNE'), 'IZGARDA KULLANILAN KÜÇÜK EKİPMAN TEMİZLİĞİ YETERLİ Mİ ? ( MAŞA, KÜVET, BIÇAK, KAZYICI VB )', 3, 0, 0, 'Izgara ekipmanlarının temizlik durumu'),
((SELECT id FROM field_inspection_categories WHERE name = 'IZGARA / PİŞİRNE'), 'ÇÖP KOVALARI PEDALLİ , TEMİZ VE AĞZI KAPALI', 2, 0, 0, 'Çöp kutusu standartları'),
((SELECT id FROM field_inspection_categories WHERE name = 'IZGARA / PİŞİRNE'), 'ET ÜRÜNLERINDE STANDARTLARA UYGUN MÜHÜRLEME , PİŞİRME VE DİNLENDİRME İŞLEMİ YAPILIYOR MU ?', 3, 1, 5, 'Et ürünleri işleme standartları - KRİTİK'),
((SELECT id FROM field_inspection_categories WHERE name = 'IZGARA / PİŞİRNE'), 'PLATE SICAKLIĞI ( 180 - 210 ) ARASINDA MI? HER PİŞİRME İŞLEMİNDEN SONRA PLATE KAZINICI İLE TEMİZLENİYOR MU ?', 3, 1, 5, 'Plate sıcaklığı ve temizliği - KRİTİK'),
((SELECT id FROM field_inspection_categories WHERE name = 'IZGARA / PİŞİRNE'), 'EZME ( KARAMALIZE ) İŞLEMİ UYGUN BİR ŞEKİLDE YAPILIYOR MU?', 2, 0, 0, 'Karamalize işlem kalitesi'),
((SELECT id FROM field_inspection_categories WHERE name = 'IZGARA / PİŞİRNE'), 'SMASH PİŞİRME İŞLEMİNDE ÇİĞ TARAFA TUZ, PİŞMİŞ TARAFA KARABIBER SERPİLİP YAĞ SÜZDÜRÜLÜYOR MÜ?', 5, 0, 0, 'Smash pişirme tekniği'),
((SELECT id FROM field_inspection_categories WHERE name = 'IZGARA / PİŞİRNE'), 'SMASH PİŞİRME İŞLEMİ TEMİZ İZGARADA YAPILIYOR MU ? HER PİŞİRME İŞLEMİNDEN SONRA İZGARA TEMİZLENİYOR MU ?', 5, 0, 0, 'Smash pişirme hijyeni'),
((SELECT id FROM field_inspection_categories WHERE name = 'IZGARA / PİŞİRNE'), 'KARAMELIZE SOĞAN VE MANTAR REÇETEYE UYGUN HAZIRLANMIŞ MI? REÇETEYE UYGUN MİKTARDA KULLANILIYOR MU?', 2, 0, 0, 'Karamelize soğan ve mantar hazırlığı'),
((SELECT id FROM field_inspection_categories WHERE name = 'IZGARA / PİŞİRNE'), 'EKMEK AÇMA TEZGAHINDA TÜM ÜRÜNLER VE SOSLAR MEVCUT ÜRÜNLERDE BURUŞMA VE SARARMA YOK', 3, 0, 0, 'Ekmek açma tezgahı standartları'),
((SELECT id FROM field_inspection_categories WHERE name = 'IZGARA / PİŞİRNE'), 'EKMEK SOSLAMA İÇİN UYGUN FİŞEKLER KULLANILIYOR MU? ( BURGER YİYELİM SOS İÇİN FİŞEK AĞZININ KESİLMEMİŞ OLMALI )', 3, 0, 0, 'Ekmek soslama tekniği'),
((SELECT id FROM field_inspection_categories WHERE name = 'IZGARA / PİŞİRNE'), 'EKMEK SKT KULLANIMA UYGUN YERİ TEMAS EDEN EKMEK KASASI YOK', 3, 0, 0, 'Ekmek SKT kontrol'),
((SELECT id FROM field_inspection_categories WHERE name = 'IZGARA / PİŞİRNE'), 'EKMEKLER KESME APARATININ İÇERİSİNDE EŞİT BİR ŞEKİLDE KESİLİP, KARAMELIZE EDİLİYOR MU?', 3, 0, 0, 'Ekmek kesme ve karamelize işlemi'),
((SELECT id FROM field_inspection_categories WHERE name = 'IZGARA / PİŞİRNE'), 'EKMEK SOSLAMA VE GARNİTÜR KULLANIMI REÇETEYE UYGUN MU?', 3, 0, 0, 'Ekmek soslama ve garnitür'),
((SELECT id FROM field_inspection_categories WHERE name = 'IZGARA / PİŞİRNE'), 'TOASTER TEMİZLİĞİ YETERLİ, TEFLON KULLANIMA UYGUN ( SÜRE 30 SN / 280 C )', 3, 0, 0, 'Toaster temizliği ve kullanımı'),
((SELECT id FROM field_inspection_categories WHERE name = 'IZGARA / PİŞİRNE'), 'FRİTÖZ YAĞ SEVİYESİ YETERLİ Mİ ( İKİ ÇİZGİ ARASI ) , TPM DEĞERLERİ UYGUN MU ? KARBON TEMİZLİKLERİ YAPILIYOR MU? ( TPM ÜST SINIR 22 )', 2, 1, 5, 'Fritöz yağ seviyesi ve TPM - KRİTİK'),
((SELECT id FROM field_inspection_categories WHERE name = 'IZGARA / PİŞİRNE'), 'BURGERLER SERVİS EDIRKEN BAYRAK KULLANILIYOR MU ?', 3, 0, 0, 'Burger servis standartları'),
((SELECT id FROM field_inspection_categories WHERE name = 'IZGARA / PİŞİRNE'), 'PATATES PİŞİRME SÜRELERİNE DİKKAT EDİLİYOR MU ? ( 4 DK ) BAHARATLAMA YAPILIYOR MU ?', 3, 1, 5, 'Patates pişirme süresi ve baharatlandırma - KRİTİK'),
((SELECT id FROM field_inspection_categories WHERE name = 'IZGARA / PİŞİRNE'), 'PATATES PİŞİRME İŞLEMİ SİPARİŞE GÖRE YAPILIYOR MU ? BEKLEME ÜNİTESİNDE ESKİ PATATES İLE YENİ ÇIKAN KARIŞTIRILIYIOR MU ? DOĞRU', 3, 0, 0, 'Patates pişirme prosesi'),
((SELECT id FROM field_inspection_categories WHERE name = 'IZGARA / PİŞİRNE'), 'PATATES PIŞIRME SÜRELERİ KONTROL ALTINDA MI?', 2, 0, 0, 'Patates pişirme süresi kontrolü'),
((SELECT id FROM field_inspection_categories WHERE name = 'KASA - PAKET / PAZARYERİ'), 'KASA ALANINDA TEMİZLİK VE DÜZEN YETERLİ Mİ?', 3, 0, 0, 'Kasa alanı temizlik ve düzeni'),
((SELECT id FROM field_inspection_categories WHERE name = 'KASA - PAKET / PAZARYERİ'), 'PAKET MALZEMELERİ UYGUN ŞEKİLDE SAKLANMIŞ MI?', 2, 0, 0, 'Paket malzemeleri saklama'),
((SELECT id FROM field_inspection_categories WHERE name = 'KASA - PAKET / PAZARYERİ'), 'PAZARYERİ ÜRÜNLERI UYGUN KOŞULLARDA SAKLANMIŞ MI?', 3, 0, 0, 'Pazaryeri ürünleri saklama'),
((SELECT id FROM field_inspection_categories WHERE name = 'RESTORAN TEMİZLİK VE DÜZEN'), 'RESTORAN ALANINDA GENEL TEMİZLİK YETERLİ Mİ?', 3, 0, 0, 'Restoran genel temizliği'),
((SELECT id FROM field_inspection_categories WHERE name = 'RESTORAN TEMİZLİK VE DÜZEN'), 'MASA VE SANDALYELER TEMİZ VE DÜZENLI Mİ?', 2, 0, 0, 'Masa ve sandalye durumu'),
((SELECT id FROM field_inspection_categories WHERE name = 'RESTORAN TEMİZLİK VE DÜZEN'), 'ZEMIN TEMİZ VE KAYGAN DEĞİL Mİ?', 3, 0, 0, 'Zemin temizliği ve güvenliği'),
((SELECT id FROM field_inspection_categories WHERE name = 'EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ'), 'EKİPMANLAR DÜZENLI OLARAK BAKIM YAPILIYOR MU?', 3, 0, 0, 'Ekipman bakım programı'),
((SELECT id FROM field_inspection_categories WHERE name = 'EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ'), 'GIDA GÜVENLİĞİ SERTIFIKASI MEVCUT MU?', 2, 1, 3, 'Gıda güvenliği sertifikası - KRİTİK'),
((SELECT id FROM field_inspection_categories WHERE name = 'EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ'), 'GEREKLI YASAL EVRAKLAR HAZIR MI?', 2, 0, 0, 'Yasal evraklar hazırlığı'),
((SELECT id FROM field_inspection_categories WHERE name = 'RESTORAN HİZMET VE KALİTE STANDARTLARI'), 'PERSONEL ÜNIFORMASI TEMİZ VE UYGUN MU?', 2, 0, 0, 'Personel üniforması standartları'),
((SELECT id FROM field_inspection_categories WHERE name = 'RESTORAN HİZMET VE KALİTE STANDARTLARI'), 'HİZMET KALİTESİ YETERLİ MU?', 3, 0, 0, 'Hizmet kalitesi'),
((SELECT id FROM field_inspection_categories WHERE name = 'RESTORAN HİZMET VE KALİTE STANDARTLARI'), 'MÜŞTERI MEMNUNİYETİ YETERLİ MU?', 3, 0, 0, 'Müşteri memnuniyeti');

-- ADIM 3: Koruma Trigger'ı Oluştur
DROP TRIGGER IF EXISTS prevent_critical_question_deletion;
CREATE TRIGGER prevent_critical_question_deletion 
BEFORE DELETE ON field_inspection_questions
FOR EACH ROW
BEGIN
  IF OLD.is_critical = 1 THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'HATA: Kritik sorular silinemez! Lütfen sistem yöneticisi ile iletişime geçiniz.';
  END IF;
END;

-- ADIM 4: Doğrulama
SELECT 
  'Saha Denetimi Soruları Başarıyla Yüklendi!' as status,
  COUNT(*) as total_questions,
  SUM(CASE WHEN is_critical = 1 THEN 1 ELSE 0 END) as critical_questions
FROM field_inspection_questions;
