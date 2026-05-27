# Saha Denetimi Soruları - Kalıcı Seed Verisi

Bu dosya, Keban Food Şube Performans Yönetim Sistemi'nde 89 Saha Denetimi sorusunun kalıcı olarak veritabanında tutulmasını sağlar.

## 📋 Dosyalar

1. **seed-field-inspection-questions.mjs** - Node.js seed script'i (Excel dosyasından soruları yükler)
2. **drizzle/0_seed_field_inspection_questions.sql** - SQL migration dosyası (doğrudan veritabanına INSERT eder)

## 🚀 Kullanım

### Seçenek 1: Node.js Script ile (Önerilen)
```bash
pnpm seed
```

### Seçenek 2: SQL Migration ile
```bash
pnpm seed:sql
```

### Seçenek 3: Manuel MySQL ile
```bash
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < drizzle/0_seed_field_inspection_questions.sql
```

## 📊 Veriler

**5 Kategori:**
1. IZGARA / PİŞİRNE (33 soru)
2. KASA - PAKET / PAZARYERİ (16 soru)
3. RESTORAN TEMİZLİK VE DÜZEN (13 soru)
4. EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ (13 soru)
5. RESTORAN HİZMET VE KALİTE STANDARTLARI (14 soru)

**Toplam: 89 Soru**

## 🔒 Silinmesini Önleme

SQL migration dosyasında bir trigger oluşturulmuştur:
- **Kritik sorular** yanlışlıkla silinmesini önlemek için DELETE işlemi engellenir
- Hata mesajı: "Kritik sorular silinemez. Lütfen admin ile iletişime geçiniz."

## ⚙️ Deployment Sırasında

Deployment sırasında soruların otomatik olarak yüklenmesi için:

1. **Dockerfile'da** (eğer varsa):
```dockerfile
RUN pnpm seed
```

2. **Build script'inde**:
```bash
npm run seed
```

3. **Manus Platform'da** (otomatik):
- Deployment sırasında `pnpm seed` komutu otomatik çalıştırılır

## 📝 Notlar

- Soruların INSERT IGNORE kullanıldığı için, tekrar çalıştırılsa bile duplicate oluşmaz
- Her soru benzersiz olarak tanımlanır (kategori_id + question_text)
- Soruların puan, kritik durumu ve açıklaması veritabanında saklanır

## 🔄 Güncelleme

Yeni sorular eklemek için:

1. **seed-field-inspection-questions.mjs** dosyasında `questions` array'ine yeni soru ekle
2. `pnpm seed` komutunu çalıştır

veya

1. **drizzle/0_seed_field_inspection_questions.sql** dosyasına INSERT satırı ekle
2. `pnpm seed:sql` komutunu çalıştır
