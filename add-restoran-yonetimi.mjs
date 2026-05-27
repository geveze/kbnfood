import { getDb } from './server/db.ts';
import { positions, positionCategories, positionQuestions } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const RESTORAN_YONETIMI_DATA = {
  "Görev Bilinci": [
    "Yaptığı işi en iyi şekilde yapar. İş disiplini ve görev bilinci yüksektir.",
    "Sorumluluğundaki işleri, şirket kural ve prosedürlerine uygun bir biçimde gerçekleştirir.",
    "İşine, kuruma ve kendisine sunulan kaynaklara zarar verecek hiçbir davranış sergilemez.",
    "Ahlaki ve etik değerlere uygun davranır. Davranışlarının sorumluluğunu üstlenir.",
  ],
  "İletişim Becerisi": [
    "Karşındakini dinler ve verilmek istenen mesajı doğru bir şekilde anlar.",
    "Söylemek istediklerini, açık, kısa ve net bir biçimde karşı tarafa aktarır.",
    "İşle ilgili konularla ilgili bilgiyi zamanında aktarır ve paylaşır.",
    "Her türlü iletişimde empati kurmaya özen gösterir. Gerektiğinde iletişim tarzını değiştirebilir.",
  ],
  "Analitik Düşünme ve Problem Çözme": [
    "Gelişmekte olan problemleri görür, önleyici davranış geliştirir.",
    "Durum ve problem karşısında alacağı hareketin sonucunu bilir.",
    "Mevcut sorunu gidermek için alternatif çözüm yolları geliştirir.",
    "Benzer sorunlar arasında ilişki kurar; geçmişteki deneyimlerden faydalanır.",
  ],
  "Kalite Odaklılık": [
    "Mevcut düzen ve iş yapma yöntemine uygun çalışır.",
    "Kaliteyi belirlenen standartlara göre uyarlar.",
    "İş yapma yöntemini sürekli geliştirmeye, verimlilik ve etkililiği artırmaya odaklı çalışır.",
    "İş yapma yöntemine ilişkin akış ve prosedürlerdeki yeniliklere adapte olur.",
  ],
  "Takım Çalışması ve İşbirliği": [
    "Çalışma ortamında iyi ilişkiler kurar ve korur.",
    "Takım arkadaşlarının yardıma ihtiyacı olduğunda gerekli destekte bulunur.",
    "Takım arkadaşlarını, ortak başarı için heveslendirir, onları motive eder.",
    "Takımdaki farklı görüşlere karşı toleranslıdır ve destekleyicidir.",
  ],
  "Yönetim Becerileri": [
    "Doğru insanları belirleyerek ihtiyaçlar doğrultusunda görev dağılımını yapar.",
    "Ekibine mentorluk yapar, yapıcı geri bildirimlerde bulunur ve yönlendirme sağlar.",
    "Ekibini motive eder, olumsuzluk yaratacak durumların önüne geçmek için proaktif davranır.",
    "Ekip içindeki anlaşmazlıkları kişiselleştirmeden şirket yararını gözetir.",
    "İnsanların yeteneklerini keşfeder ve doğru şekilde değerlendirir.",
    "Görevlerin yerine getirilebilmesi için gerekli olan kaynakları belirler.",
    "Aldığı kararların arkasındadır ve bu kararların sorumluluğunu üstlenir.",
    "Zor durumlarda ve baskı altında en etkili kararı verir.",
    "Çalışanların gelişimi için öğrenme ortamı yaratır. Ekibini ve kendini sürekli geliştirir.",
    "Davranışları ile ekibe örnek olur. Söyledikleri ile yaptıkları tutarlıdır.",
  ],
  "İş Disiplini ve Tutum": [
    "Dış görünüşüne dikkat eder. Kurumu ve markayı başarıyla temsil eder.",
    "Şirketin eğitimlerine aktif olarak katılır, çalışanların katılımını sağlar.",
    "Restoranın KPI'larını bilir, bu hedefleri gerçekleştirmek için gerekli aksiyonları alır.",
    "Mazeret bildirmeden işe gelmemezlik yapmaz.",
  ],
  "Restoran Yönetimi": [
    "Ekibine ve müşterilere karşı güleryüzlü ve naziktir.",
    "İnsan Kaynakları ve operasyonel prosedür ve talimatları bilir, uygulanmasını sağlar.",
    "Vardiya planlamalarını verimli bir şekilde yapar.",
    "Restoranın nakit ve avans yönetimini hatasız bir şekilde yapar. Prosedürlere uygun hareket eder.",
    "Restoranın stok ve sipariş yönetimini etkin bir şekilde yapar. Fire ve israfı minimize eder.",
    "Müşteri şikayetlerini prosedürler çerçevesinde müşteri kaybına yol açmadan çözer.",
    "Menü fiyatları, promosyon ve kampanyalarla ilgili bilgilidir. Gerektiğinde bilgi verir.",
    "Ürünlerle ve içerikleri ile ilgili bilgilidir.",
    "Çalışma süresince Gıda Güvenliği ve İSG kurallarına uygun hareket edilmesini sağlar.",
    "Tüm şube ekipmanlarının özenli ve titiz kullanılmasını sağlar. Temizlik ve bakımını yapar.",
    "Restoran düzenini sağlar, dağınık ve kirli bir görüntü verilmesine izin vermez.",
    "Zor müşteriler ile iletişim kurabilir, gerekli aksiyonu alır.",
    "Fire ve israfı önler, gerekli önlemleri alır.",
    "Tüm çalışma alanlarının (servis, ızgara, kasa, depo) temizliğini ve hijyenini sağlar.",
    "Bulunduğu şubeye özel satışı arttıracak alternatif öneriler sunar. Müşteri memnuniyetini ön planda tutar.",
    "Pazarlama departmanından gelen görsel ve kampanyaları doğru ve eksiksizsiz bir şekilde uygulanmasını sağlar.",
  ],
};

async function addRestoranyonetimi() {
  const db = await getDb();
  
  try {
    console.log('Restoran Yönetimi pozisyonunu kontrol ediliyor...');
    
    // Restoran Yönetimi pozisyonunu bul veya oluştur
    let posResult = await db
      .select()
      .from(positions)
      .where(eq(positions.name, 'Restoran Yönetimi'));
    
    let positionId;
    if (posResult.length === 0) {
      console.log('Restoran Yönetimi pozisyonu oluşturuluyor...');
      await db.insert(positions).values({
        name: 'Restoran Yönetimi',
        displayName: 'Restoran Yönetimi',
        description: 'Restoran Yönetimi Ekibi',
        isActive: true,
      });
      
      // Yeni oluşturulan kaydı getir
      const newPos = await db
        .select()
        .from(positions)
        .where(eq(positions.name, 'Restoran Yönetimi'));
      positionId = newPos[0].id;
    } else {
      positionId = posResult[0].id;
    }
    
    console.log(`Pozisyon ID: ${positionId}`);
    
    // Kategorileri ve soruları ekle
    let questionNumber = 1;
    for (const [categoryName, questions] of Object.entries(RESTORAN_YONETIMI_DATA)) {
      console.log(`Kategori ekleniyor: ${categoryName}`);
      
      // Kategoriyi kontrol et
      let catResult = await db
        .select()
        .from(positionCategories)
        .where(eq(positionCategories.positionId, positionId));
      
      let categoryId;
      const existingCat = catResult.find(c => c.name === categoryName);
      
      if (!existingCat) {
        await db.insert(positionCategories).values({
          positionId: positionId,
          name: categoryName,
          order: Object.keys(RESTORAN_YONETIMI_DATA).indexOf(categoryName),
        });
        
        // Yeni oluşturulan kategoriyi getir
        const newCat = await db
          .select()
          .from(positionCategories)
          .where(eq(positionCategories.positionId, positionId));
        categoryId = newCat[newCat.length - 1].id;
      } else {
        categoryId = existingCat.id;
      }
      
      // Soruları ekle
      for (const question of questions) {
        await db.insert(positionQuestions).values({
          categoryId: categoryId,
          questionNumber: questionNumber.toString(),
          questionText: question,
          order: questions.indexOf(question),
        });
        questionNumber++;
      }
      
      console.log(`  ${questions.length} soru eklendi`);
    }
    
    console.log('✓ Restoran Yönetimi soruları başarıyla eklendi!');
    console.log(`Toplam: 50 soru, 8 kategori`);
    
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

addRestoranyonetimi();
