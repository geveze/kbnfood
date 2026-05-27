import { getDb } from './server/db.ts';
import { positions, positionCategories, positionQuestions } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = await getDb();
if (!db) {
  console.log('DB connection failed');
  process.exit(1);
}

// Kategoriler ve sorular
const categoriesData = {
  "Görev Bilinci": [
    "Yaptığı işi en iyi şekilde yapar. İş disiplini ve görev bilinci yüksektir.",
    "Sorumluluğundaki işleri, şirket kural ve prosedürlerine uygun bir biçimde gerçekleştirir.",
    "İşine, kuruma ve kendisine sunulan kaynaklara zarar verecek hiçbir davranış sergilemez.",
    "Ahlaki ve etik değerlere uygun davranır. Davranışlarının sorumluluğunu üstlenir."
  ],
  "İletişim Becerisi": [
    "Karşındakini dinler ve verilmek istenen mesajı doğru bir şekilde anlar.",
    "Söylemek istediklerini, açık, kısa ve net bir biçimde karşı tarafa aktarır.",
    "İşle ilgili konularla ilgili bilgiyi zamanında aktarır ve paylaşır.",
    "Her türlü iletişimde empati kurmaya özen gösterir. Gerektiğinde iletişim tarzını değiştirebilir."
  ],
  "Analitik Düşünme ve Problem Çözme": [
    "Gelişmekte olan problemleri görür, önleyici davranış geliştirir.",
    "Durum ve problem karşısında alacağı hareketin sonucunu bilir.",
    "Mevcut sorunu gidermek için alternatif çözüm yolları geliştirir.",
    "Benzer sorunlar arasında ilişki kurar; geçmişteki deneyimlerden faydalanır."
  ],
  "Kalite Odaklılık": [
    "Mevcut düzen ve iş yapma yöntemine uygun çalışır.",
    "Kaliteyi belirlenen standartlara göre uyarlar.",
    "İş yapma yöntemini sürekli geliştirmeye, verimlilik ve etkililiği artırmaya odaklı çalışır.",
    "İş yapma yöntemine ilişkin akış ve prosedürlerdeki yeniliklere adapte olur."
  ],
  "Takım Çalışması ve İşbirliği": [
    "Çalışma ortamında iyi ilişkiler kurar ve korur.",
    "Takım arkadaşlarının yardıma ihtiyacı olduğunda gerekli destekte bulunur.",
    "Takım arkadaşlarını, ortak başarı için heveslendirir, onları motive eder.",
    "Takımdaki farklı görüşlere karşı toleranslıdır ve destekleyicidir."
  ],
  "Yönetim Becerileri": [
    "Doğru insanları belirleyerek ihtiyaçlar doğrultusunda görev dağılımını yapar.",
    "Ekibine mentorluk yapar, yapıcı geri bildirimlerde bulunur ve yönlendirme sağlar.",
    "Ekibini motive eder, olumsuzluk yaratacak durumların önüne geçmek için proaktif davranır.",
    "Ekip içindeki anlaşmazlıkları kişiselleştirmeden şirket yararını gözetir.",
    "İnsanların yeteneklerini keşfeder ve doğru şekilde değerlendirir.",
    "Görevlerin yerine getirilebilmesi için gerekli olan kaynakları belirler ve organize eder.",
    "Aldığı kararların arkasındadır ve bu kararların sorumluluğunu üstlenir.",
    "Zor durumlarda ve baskı altında en etkili kararı verir.",
    "Çalışanların gelişimi için öğrenme ortamı yaratır. Ekibini ve kendini sürekli geliştirir.",
    "Davranışları ile ekibe örnek olur. Söyledikleri ile yaptıkları tutarlıdır."
  ],
  "İş Disiplini ve Tutum": [
    "Dış görünüşüne dikkat eder. Kurumu ve markayı başarıyla temsil eder.",
    "Şirketin eğitimlerine aktif olarak katılır, çalışanların katılımını sağlar. Eğitim etkinliğini takip eder.",
    "Restoranın KPI'larını bilir, bu hedefleri gerçekleştirmek için gerekli planlamaları yapar.",
    "Mazeret bildirmeden işe gelmemezlik yapmaz."
  ],
  "Restoran Yönetimi": [
    "Ekibine ve müşterilere karşı güleryüzlü ve naziktir.",
    "İnsan Kaynakları ve operasyonel prosedür ve talimatları bilir, uygulanmasını sağlar.",
    "Vardiya planlamalarını verimli bir şekilde yapar.",
    "Restoranın nakit ve avans yönetimini hatasız bir şekilde yapar. Prosedürlere uygun hareket eder.",
    "Restoranın stok ve sipariş yönetimini etkin bir şekilde yapar. Fire ve/veya satış kaybına sebep olmaz.",
    "Müşteri şikayetlerini prosedürler çerçevesinde müşteri kaybına yol açmayacak şekilde yönetir.",
    "Menü fiyatları, pormosyon ve kampanyalarla ilgili bilgilidir. Gerektiği gibi uygulamasını yapar.",
    "Ürünlerle ve içerikleri ile ilgili bilgilidir.",
    "Çalışma süresince Gıda Güvenliği ve İSG kurallarına uygun hareket edilmesini sağlar.",
    "Tüm şube ekipmanlarının özenli ve titiz kullanılmasını sağlar. Temizliklerini yaptırır.",
    "Restoran düzenini sağlar, dağınık ve kirli bir görüntü verilmesine izin vermez.",
    "Zor müşteriler ile iletişim kurabilir, gerekli aksiyonu alır.",
    "Fire ve israfı önler, gerekli önlemleri alır.",
    "Tüm çalışma alanlarının (servis, ızgara, kasa, depo) temizliğini ve hijyenini sağlar.",
    "Bulunduğu şubeye özel satışı arttıracak alternatif öneriler sunar. Müşteri geri bildirimlerini paylaşır.",
    "Pazarlama departmanından gelen görsel ve kampanyaları doğru ve eksiksiz bir biçimde uygular."
  ]
};

// Mevcut kategorileri ve soruları sil
const existingCats = await db.select().from(positionCategories).where(eq(positionCategories.positionId, 6));

for (const cat of existingCats) {
  await db.delete(positionQuestions).where(eq(positionQuestions.categoryId, cat.id));
}

await db.delete(positionCategories).where(eq(positionCategories.positionId, 6));

console.log('Deleted existing categories and questions');

// Yeni kategorileri ve soruları ekle
let totalQuestions = 0;
let questionNumber = 1;

for (const [categoryName, questions] of Object.entries(categoriesData)) {
  // Kategoriyi ekle
  await db.insert(positionCategories).values({
    positionId: 6,
    name: categoryName
  });
  
  // Yeni eklenen kategoriyi al
  const newCats = await db.select().from(positionCategories).where(eq(positionCategories.name, categoryName));
  const categoryId = newCats[newCats.length - 1].id;
  
  // Soruları ekle
  for (const questionText of questions) {
    await db.insert(positionQuestions).values({
      categoryId,
      questionNumber: String(questionNumber),
      questionText,
      order: questionNumber
    });
    questionNumber++;
    totalQuestions++;
  }
  
  console.log(`Added category: ${categoryName} with ${questions.length} questions`);
}

console.log(`\nTotal questions added: ${totalQuestions}`);

process.exit(0);
