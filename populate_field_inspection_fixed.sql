-- Saha Denetimi Kategorileri ve Soruları

-- Kategorileri temizle (varsa)
DELETE FROM field_inspection_questions WHERE categoryId IN (SELECT id FROM field_inspection_categories);
DELETE FROM field_inspection_categories;

-- Kategorileri ekle (id, name, description, weight, order)
INSERT INTO field_inspection_categories (id, name, description, weight, `order`) VALUES
(1, '1. IZGARA / PİŞİRME', 'Izgara işletme ve pişirme standartları', 15, 1),
(2, '2. TAVUK ÜRÜNLERİ', 'Tavuk ürünleri hazırlama ve sunumu', 15, 2),
(3, '3. KASA / PAKET', 'Kasa ve paketleme işlemleri', 10, 3),
(4, '4. PAZARYERLERI', 'Pazaryeri operasyonları', 10, 4),
(5, '5. İÇECEK / LEMONAT', 'İçecek ve lemonat hazırlama', 5, 5),
(6, '6. RESTORAN ORTAMI', 'Restoran ortamı ve temizlik', 10, 6),
(7, '7. PERSONEL', 'Personel yönetimi ve davranışı', 10, 7),
(8, '8. KALİTE / ÜRÜN', 'Ürün kalitesi kontrol', 10, 8),
(9, '9. HİJYEN / GIDA GÜVENLİĞİ', 'Hijyen ve gıda güvenliği standartları', 15, 9);

-- Kategori 1: IZGARA / PİŞİRME (10 soru - kritik)
INSERT INTO field_inspection_questions (categoryId, questionText, points, maxScore, isCritical, `order`) VALUES
(1, 'Izgara sıcaklığı doğru şekilde ayarlanıyor mu?', 5, 5, 1, 1),
(1, 'Pişirme zamanları standartlara uygun mu?', 5, 5, 1, 2),
(1, 'Ürünler doğru sıcaklıkta servis ediliyor mu?', 5, 5, 1, 3),
(1, 'Izgara temizliği düzenli yapılıyor mu?', 5, 5, 1, 4),
(1, 'Pişirme sırasında hijyen kuralları uygulanıyor mu?', 5, 5, 1, 5),
(1, 'Ürün kalitesi kontrol ediliyor mu?', 5, 5, 1, 6),
(1, 'Pişirme ekipmanları bakımı yapılıyor mu?', 5, 5, 1, 7),
(1, 'Ürün saklama koşulları uygun mu?', 5, 5, 1, 8),
(1, 'Pişirme sırasında çapraz kontaminasyon önleniyor mu?', 5, 5, 1, 9),
(1, 'Personel pişirme prosedürlerini biliyor mu?', 5, 5, 1, 10);

-- Kategori 2: TAVUK ÜRÜNLERİ (8 soru - kritik)
INSERT INTO field_inspection_questions (categoryId, questionText, points, maxScore, isCritical, `order`) VALUES
(2, 'Tavuk ürünleri taze ve kaliteli mi?', 5, 5, 1, 1),
(2, 'Tavuk saklama sıcaklığı uygun mu?', 5, 5, 1, 2),
(2, 'Tavuk ürünleri son kullanma tarihine uygun mu?', 5, 5, 1, 3),
(2, 'Tavuk hazırlama alanı hijyenik mi?', 5, 5, 1, 4),
(2, 'Tavuk ürünleri doğru şekilde pişiriliyor mu?', 5, 5, 1, 5),
(2, 'Tavuk ürünleri servis sıcaklığında mı?', 5, 5, 1, 6),
(2, 'Tavuk ürünleri çapraz kontaminasyondan korunuyor mu?', 5, 5, 1, 7),
(2, 'Tavuk ürünleri porsiyon kontrolü yapılıyor mu?', 5, 5, 1, 8);

-- Kategori 3: KASA / PAKET (5 soru)
INSERT INTO field_inspection_questions (categoryId, questionText, points, maxScore, isCritical, `order`) VALUES
(3, 'Kasa işlemleri doğru şekilde yapılıyor mu?', 5, 5, 0, 1),
(3, 'Paketleme malzemeleri uygun mu?', 5, 5, 0, 2),
(3, 'Paketler hijyenik şekilde hazırlanıyor mu?', 5, 5, 0, 3),
(3, 'Kasa alanı temiz ve düzenli mi?', 5, 5, 0, 4),
(3, 'Ödeme işlemleri güvenli mi?', 5, 5, 0, 5);

-- Kategori 4: PAZARYERLERI (8 soru)
INSERT INTO field_inspection_questions (categoryId, questionText, points, maxScore, isCritical, `order`) VALUES
(4, 'Pazaryeri ürünleri taze mi?', 5, 5, 0, 1),
(4, 'Pazaryeri alanı temiz mi?', 5, 5, 0, 2),
(4, 'Pazaryeri ürünleri doğru sıcaklıkta mı?', 5, 5, 0, 3),
(4, 'Pazaryeri personeli eğitimli mi?', 5, 5, 0, 4),
(4, 'Pazaryeri ürünleri son kullanma tarihine uygun mu?', 5, 5, 0, 5),
(4, 'Pazaryeri ürünleri hijyenik şekilde saklanıyor mu?', 5, 5, 0, 6),
(4, 'Pazaryeri alanında pest kontrolü yapılıyor mu?', 5, 5, 0, 7),
(4, 'Pazaryeri ürünleri doğru şekilde servis ediliyor mu?', 5, 5, 0, 8);

-- Kategori 5: İÇECEK / LEMONAT (3 soru)
INSERT INTO field_inspection_questions (categoryId, questionText, points, maxScore, isCritical, `order`) VALUES
(5, 'İçecek ürünleri taze mi?', 5, 5, 0, 1),
(5, 'Lemonat hazırlama alanı hijyenik mi?', 5, 5, 0, 2),
(5, 'İçecek ürünleri doğru sıcaklıkta servis ediliyor mu?', 5, 5, 0, 3);

-- Kategori 6: RESTORAN ORTAMI (4 soru)
INSERT INTO field_inspection_questions (categoryId, questionText, points, maxScore, isCritical, `order`) VALUES
(6, 'Restoran alanı temiz ve düzenli mi?', 5, 5, 0, 1),
(6, 'Tuvalet alanları hijyenik mi?', 5, 5, 0, 2),
(6, 'Restoran dekorasyonu uygun mu?', 5, 5, 0, 3),
(6, 'Müşteri alanı konforlu mu?', 5, 5, 0, 4);

-- Kategori 7: PERSONEL (2 soru)
INSERT INTO field_inspection_questions (categoryId, questionText, points, maxScore, isCritical, `order`) VALUES
(7, 'Personel hijyeni standartlarına uygun mu?', 5, 5, 0, 1),
(7, 'Personel müşteri hizmetinde profesyonel mi?', 5, 5, 0, 2);

-- Kategori 8: KALİTE / ÜRÜN (10 soru)
INSERT INTO field_inspection_questions (categoryId, questionText, points, maxScore, isCritical, `order`) VALUES
(8, 'Ürün kalitesi kontrol ediliyor mu?', 5, 5, 0, 1),
(8, 'Ürün sunumu uygun mu?', 5, 5, 0, 2),
(8, 'Ürün porsiyon kontrolü yapılıyor mu?', 5, 5, 0, 3),
(8, 'Ürün tadı ve dokusu standartlara uygun mu?', 5, 5, 0, 4),
(8, 'Ürün rengi ve görünüşü uygun mu?', 5, 5, 0, 5),
(8, 'Ürün sıcaklığı doğru mu?', 5, 5, 0, 6),
(8, 'Ürün taze ve lezzetli mi?', 5, 5, 0, 7),
(8, 'Ürün sunum şekli uygun mu?', 5, 5, 0, 8),
(8, 'Ürün saklama koşulları uygun mu?', 5, 5, 0, 9),
(8, 'Ürün hazırlama prosedürü doğru mu?', 5, 5, 0, 10);

-- Kategori 9: HİJYEN / GIDA GÜVENLİĞİ (3 soru - kritik)
INSERT INTO field_inspection_questions (categoryId, questionText, points, maxScore, isCritical, `order`) VALUES
(9, 'Gıda güvenliği prosedürleri uygulanıyor mu?', 5, 5, 1, 1),
(9, 'Hijyen standartları sağlanıyor mu?', 5, 5, 1, 2),
(9, 'Pest kontrolü düzenli yapılıyor mu?', 5, 5, 1, 3);

-- Toplam: 53 soru (28 kritik + 25 normal)
