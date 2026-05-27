# Etki Oranlarını (Weight) Manuel Olarak Güncelleme Rehberi

## Yöntem 1: SQL Sorgusu ile (Hızlı)

Veritabanında `field_inspection_categories` tablosundaki `weight` alanını doğrudan güncelleyebilirsiniz.

### Örnek SQL Komutları:

```sql
-- Tüm kategorileri görmek
SELECT id, name, weight FROM field_inspection_categories ORDER BY id;

-- Tek bir kategoriyi güncellemek
UPDATE field_inspection_categories 
SET weight = 42.5 
WHERE id = 1;  -- 1.IZGARA / PİŞİRME

-- Tüm kategorileri güncellemek
UPDATE field_inspection_categories SET weight = 42.5 WHERE id = 1;
UPDATE field_inspection_categories SET weight = 12.5 WHERE id = 2;
UPDATE field_inspection_categories SET weight = 12.5 WHERE id = 3;
UPDATE field_inspection_categories SET weight = 15.0 WHERE id = 4;
UPDATE field_inspection_categories SET weight = 17.5 WHERE id = 5;

-- Güncellemeden sonra doğrulama
SELECT id, name, weight FROM field_inspection_categories ORDER BY id;
```

### Kategori ID'leri:
- 1: IZGARA / PİŞİRME
- 2: KASA - PAKET / PAZARYERİ
- 3: RESTORAN TEMİZLİK VE DÜZEN
- 4: EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ
- 5: RESTORAN HİZMET VE KALİTE STANDARTLARI

---

## Yöntem 2: Node.js Script ile (Programatik)

Aşağıdaki script'i çalıştırarak etki oranlarını güncelleyebilirsiniz:

### Script Dosyası: `update-weights.mjs`

```javascript
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  user: '2UkMMcfEvYMQNtS.root',
  password: 'pRancyW9vAymmp8c',
  database: 'keban_app',
  port: 4000,
  ssl: { rejectUnauthorized: false },
});

try {
  // Güncellenecek etki oranları
  const updates = [
    { id: 1, name: 'IZGARA / PİŞİRME', weight: 42.5 },
    { id: 2, name: 'KASA - PAKET / PAZARYERİ', weight: 12.5 },
    { id: 3, name: 'RESTORAN TEMİZLİK VE DÜZEN', weight: 12.5 },
    { id: 4, name: 'EKİPMAN BAKIMLARI, GIDA GÜVENLİĞİ', weight: 15.0 },
    { id: 5, name: 'RESTORAN HİZMET VE KALİTE STANDARTLARI', weight: 17.5 },
  ];

  console.log('Etki oranları güncelleniyor...\n');

  for (const update of updates) {
    await connection.execute(
      'UPDATE field_inspection_categories SET weight = ? WHERE id = ?',
      [update.weight, update.id]
    );
    console.log(`✅ ${update.name}: ${update.weight}%`);
  }

  // Doğrulama
  console.log('\n📊 Güncellenen değerler:');
  const [categories] = await connection.execute(
    'SELECT id, name, weight FROM field_inspection_categories ORDER BY id'
  );
  
  let totalWeight = 0;
  categories.forEach((cat) => {
    console.log(`  - ${cat.name}: ${cat.weight}%`);
    totalWeight += cat.weight;
  });
  
  console.log(`\n✅ Toplam Ağırlık: ${totalWeight}%`);
  
  if (totalWeight === 100) {
    console.log('✅ Tüm ağırlıklar doğru şekilde ayarlandı!');
  } else {
    console.log(`⚠️ Uyarı: Toplam ağırlık 100 olmalıdır, şu anda: ${totalWeight}`);
  }

} catch (error) {
  console.error(`❌ Hata: ${error.message}`);
} finally {
  await connection.end();
}
```

### Script'i Çalıştırma:

```bash
cd /home/ubuntu/keban_food_performance
node update-weights.mjs
```

---

## Yöntem 3: Frontend UI ile (Gelecek)

İleride admin panelinde kategorilerin etki oranlarını direkt olarak güncelleyebileceğiniz bir arayüz eklenecektir.

---

## Önemli Notlar:

1. **Toplam Ağırlık 100% Olmalı:** Tüm kategorilerin ağırlıklarının toplamı 100 olması gerekmektedir.

2. **Değişiklikler Hemen Uygulanır:** Veritabanında yapılan değişiklikler sayfayı yeniledikten sonra hemen görünür.

3. **Yedek Alın:** Büyük değişiklikler yapmadan önce veritabanının yedek bir kopyasını alın.

4. **Doğrulama:** Güncelleme sonrası `SELECT` sorgusu ile değerleri kontrol edin.

---

## Örnek: Etki Oranlarını Değiştirme

Diyelim ki IZGARA kategorisinin etki oranını 50% yapmak istiyorsunuz:

```sql
UPDATE field_inspection_categories 
SET weight = 50 
WHERE id = 1;
```

Sonra diğer kategorilerin ağırlıklarını ayarlayarak toplamı 100'e tamamlayın:

```sql
UPDATE field_inspection_categories SET weight = 10 WHERE id = 2;
UPDATE field_inspection_categories SET weight = 10 WHERE id = 3;
UPDATE field_inspection_categories SET weight = 15 WHERE id = 4;
UPDATE field_inspection_categories SET weight = 15 WHERE id = 5;
```

Doğrulama:
```sql
SELECT SUM(weight) as total_weight FROM field_inspection_categories;
-- Sonuç: 100
```
