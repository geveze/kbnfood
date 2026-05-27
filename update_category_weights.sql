-- Saha Denetimi Kategorilerinin Ağırlıklarını Güncelle
-- Her kategoriye etki oranı (weight) atanır

UPDATE field_inspection_categories SET weight = 30 WHERE name = 'IZGARA / PİŞİRNE';
UPDATE field_inspection_categories SET weight = 20 WHERE name = 'KASA - PAKET / PAZARYERİ';
UPDATE field_inspection_categories SET weight = 15 WHERE name = 'RESTORAN TEMİZLİK VE DÜZEN';
UPDATE field_inspection_categories SET weight = 20 WHERE name = 'EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ';
UPDATE field_inspection_categories SET weight = 15 WHERE name = 'RESTORAN HİZMET VE KALİTE STANDARTLARI';

-- Toplam: 30 + 20 + 15 + 20 + 15 = 100%
