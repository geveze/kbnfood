# PİF (Performans İzleme Formu) Analiz Sonuçları

## Dosya Yapısı

### Başlık Bilgileri (Satırlar 5-9)
- Personel Adı Soyadı
- Sicil No
- Şube
- İşe Giriş Tarihi
- Görevi (Ünvan)
- Değerlendirme Tarihi
- Değerlendirme Dönemi: 3. ay, 6. ay, 9. ay, 12. ay

### Değerlendirme Bölümleri

#### 1. DAVRANIŞSAL DEĞERLENDİRME (Satırlar 10-46)
Puanlama: 1-5 (Sütunlar I-M)

**Alt Kategoriler:**
- Görev Bilinci (4 madde)
- İletişim Becerisi (4 madde)
- Analitik Düşünme ve Problem Çözme (4 madde)
- Kalite Odaklılık (4 madde)
- Takım Çalışması ve İşbirliği (4 madde)
- Müşteri Odaklılık (4 madde)
- Yöneticilik Potansiyeli (4 madde)

#### 2. MESLEKI-TEKNİK DEĞERLENDİRME (Satırlar 53-73)
Puanlama: 1-5 (Sütunlar I-M)

**Alt Kategoriler:**
- Teknik Bilgi ve Beceri (4 madde)
- Operasyonel Yetkinlik (4 madde)
- Müşteri Hizmetleri (4 madde)
- Operasyon Yönetimi (4 madde)
- Hijyen ve Temizlik (4 madde)

### Puanlama Sistemi

| Puan | Toplam Puan | Skala | Tanım |
|------|------------|-------|-------|
| 1 | 0-30 | Yetersiz | Beklenen davranışı göstermiyor |
| 2 | 30-49 | Gelişime Açık | Zaman zaman gösteriyor |
| 3 | 50-69 | Beklenen | Beklenen düzeyde davranış sergiliyor |
| 4 | 70-84 | İyi | Beklenenin üzerinde davranış sergiliyor |
| 5 | 85-100 | Çok İyi | Üst düzeyde ve sürekli olarak sergiliyor |

### Formül
Toplam Puan = (1 puan sayısı × 0) + (2 puan sayısı × 0.5) + (3 puan sayısı × 1) + (4 puan sayısı × 1.5) + (5 puan sayısı × 2)

## Veritabanı Tasarımı

### Tablo: performance_evaluations
```
- id: UUID (Primary Key)
- branchId: UUID (Foreign Key → branches)
- evaluationPeriod: VARCHAR (3. ay, 6. ay, 9. ay, 12. ay)
- employeeName: VARCHAR
- employeePosition: VARCHAR (Ünvan - manuel giriş)
- employeeIdNumber: VARCHAR
- hireDate: DATE
- evaluationDate: DATE
- evaluatedByManager: VARCHAR
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
- createdByUserId: UUID (Foreign Key → users)
```

### Tablo: performance_evaluation_items
```
- id: UUID (Primary Key)
- evaluationId: UUID (Foreign Key → performance_evaluations)
- category: VARCHAR (DAVRANIŞSAL, MESLEKI_TEKNIK)
- subcategory: VARCHAR (Görev Bilinci, İletişim Becerisi, vb.)
- itemNumber: INT
- itemDescription: TEXT
- score: INT (1-5)
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
```

### Tablo: evaluation_periods_used
```
- id: UUID (Primary Key)
- branchId: UUID (Foreign Key → branches)
- evaluationPeriod: VARCHAR (3. ay, 6. ay, 9. ay, 12. ay)
- createdAt: TIMESTAMP
```

## Web Sayfası Tasarımı

### Üst Bölüm (Başlık Bilgileri)
- Ünvan: Text input (manuel yazı)
- Değerlendirme Dönemi: Dropdown (3. ay, 6. ay, 9. ay, 12. ay) - Yapılmış dönemler gizlenecek
- Personel Adı: Text input
- Sicil No: Text input
- İşe Giriş Tarihi: Date input
- Değerlendirme Tarihi: Date input
- Değerlendirmeyi Yapan: Text input

### Orta Bölüm (Değerlendirme Maddeleri)
- Davranışsal Değerlendirme başlığı
  - Her madde için 1-5 puan seçimi (Radio buttons veya clickable buttons)
  - Madde açıklaması
  
- Mesleki-Teknik Değerlendirme başlığı
  - Her madde için 1-5 puan seçimi
  - Madde açıklaması

### Alt Bölüm (Sonuçlar)
- Toplam Puan (otomatik hesaplanan)
- Değerlendirme Skalası (Yetersiz, Gelişime Açık, Beklenen, İyi, Çok İyi)
- Yönetici Görüşü: Text area
- İmza alanları (3 adet)

## Excel Çıktı Formatı
- Orijinal Excel formatını tam olarak koruyacak
- Girilen puanlar Excel'de görünecek
- Formüller otomatik olarak hesaplanacak
