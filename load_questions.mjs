import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'keban_food',
};

async function loadQuestions() {
  let connection;
  try {
    console.log('📡 Veritabanına bağlanıyor...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Bağlantı başarılı');
    
    console.log('📝 Kategoriler ekleniyor...');
    
    const categories = [
      { name: 'IZGARA / PİŞİRNE', description: 'Izgara ve pişirme alanı standartları' },
      { name: 'KASA - PAKET / PAZARYERİ', description: 'Kasa ve paket alanı standartları' },
      { name: 'RESTORAN TEMİZLİK VE DÜZEN', description: 'Restoran temizlik ve düzen standartları' },
      { name: 'EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ', description: 'Ekipman bakımı ve gıda güvenliği' },
      { name: 'RESTORAN HİZMET VE KALİTE STANDARTLARI', description: 'Restoran hizmet ve kalite standartları' }
    ];
    
    for (const cat of categories) {
      await connection.execute(
        'INSERT IGNORE INTO field_inspection_categories (name, description) VALUES (?, ?)',
        [cat.name, cat.description]
      );
    }
    console.log('✓ Kategoriler eklendi');
    
    console.log('📝 Sorular ekleniyor...');
    
    const questions = [
      { cat: 'IZGARA / PİŞİRNE', text: 'SOĞUTUCU DOLAPLARIN İÇ VE DIŞ TEMİZLİKLERİ YETERLİ Mİ ? ( DERECESİ + 4 ) FİLTÜLERİN DURUMU , KONDANSÖR BAKIMI, YETERLİ Mİ ?', points: 2, critical: 0, deduction: 0, desc: 'Soğutucu dolapların temizlik ve bakım durumunun kontrolü' },
      { cat: 'IZGARA / PİŞİRNE', text: 'IZGARDA KULLANILAN KÜÇÜK EKİPMAN TEMİZLİĞİ YETERLİ Mİ ? ( MAŞA, KÜVET, BIÇAK, KAZYICI VB )', points: 3, critical: 0, deduction: 0, desc: 'Izgara ekipmanlarının temizlik durumu' },
      { cat: 'IZGARA / PİŞİRNE', text: 'ÇÖP KOVALARI PEDALLİ , TEMİZ VE AĞZI KAPALI', points: 2, critical: 0, deduction: 0, desc: 'Çöp kutusu standartları' },
      { cat: 'IZGARA / PİŞİRNE', text: 'ET ÜRÜNLERINDE STANDARTLARA UYGUN MÜHÜRLEME , PİŞİRME VE DİNLENDİRME İŞLEMİ YAPILIYOR MU ?', points: 3, critical: 1, deduction: 5, desc: 'Et ürünleri işleme standartları - KRİTİK' },
      { cat: 'IZGARA / PİŞİRNE', text: 'PLATE SICAKLIĞI ( 180 - 210 ) ARASINDA MI? HER PİŞİRME İŞLEMİNDEN SONRA PLATE KAZINICI İLE TEMİZLENİYOR MU ?', points: 3, critical: 1, deduction: 5, desc: 'Plate sıcaklığı ve temizliği - KRİTİK' },
      { cat: 'IZGARA / PİŞİRNE', text: 'EZME ( KARAMALIZE ) İŞLEMİ UYGUN BİR ŞEKİLDE YAPILIYOR MU?', points: 2, critical: 0, deduction: 0, desc: 'Karamalize işlem kalitesi' },
      { cat: 'IZGARA / PİŞİRNE', text: 'SMASH PİŞİRME İŞLEMİNDE ÇİĞ TARAFA TUZ, PİŞMİŞ TARAFA KARABIBER SERPİLİP YAĞ SÜZDÜRÜLÜYOR MÜ?', points: 5, critical: 0, deduction: 0, desc: 'Smash pişirme tekniği' },
      { cat: 'IZGARA / PİŞİRNE', text: 'SMASH PİŞİRME İŞLEMİ TEMİZ İZGARADA YAPILIYOR MU ? HER PİŞİRME İŞLEMİNDEN SONRA İZGARA TEMİZLENİYOR MU ?', points: 5, critical: 0, deduction: 0, desc: 'Smash pişirme hijyeni' },
      { cat: 'IZGARA / PİŞİRNE', text: 'KARAMELIZE SOĞAN VE MANTAR REÇETEYE UYGUN HAZIRLANMIŞ MI? REÇETEYE UYGUN MİKTARDA KULLANILIYOR MU?', points: 2, critical: 0, deduction: 0, desc: 'Karamelize soğan ve mantar hazırlığı' },
      { cat: 'IZGARA / PİŞİRNE', text: 'EKMEK AÇMA TEZGAHINDA TÜM ÜRÜNLER VE SOSLAR MEVCUT ÜRÜNLERDE BURUŞMA VE SARARMA YOK', points: 3, critical: 0, deduction: 0, desc: 'Ekmek açma tezgahı standartları' },
      { cat: 'IZGARA / PİŞİRNE', text: 'EKMEK SOSLAMA İÇİN UYGUN FİŞEKLER KULLANILIYOR MU? ( BURGER YİYELİM SOS İÇİN FİŞEK AĞZININ KESİLMEMİŞ OLMALI )', points: 3, critical: 0, deduction: 0, desc: 'Ekmek soslama tekniği' },
      { cat: 'IZGARA / PİŞİRNE', text: 'EKMEK SKT KULLANIMA UYGUN YERİ TEMAS EDEN EKMEK KASASI YOK', points: 3, critical: 0, deduction: 0, desc: 'Ekmek SKT kontrol' },
      { cat: 'IZGARA / PİŞİRNE', text: 'EKMEKLER KESME APARATININ İÇERİSİNDE EŞİT BİR ŞEKİLDE KESİLİP, KARAMELIZE EDİLİYOR MU?', points: 3, critical: 0, deduction: 0, desc: 'Ekmek kesme ve karamelize işlemi' },
      { cat: 'IZGARA / PİŞİRNE', text: 'EKMEK SOSLAMA VE GARNİTÜR KULLANIMI REÇETEYE UYGUN MU?', points: 3, critical: 0, deduction: 0, desc: 'Ekmek soslama ve garnitür' },
      { cat: 'IZGARA / PİŞİRNE', text: 'TOASTER TEMİZLİĞİ YETERLİ, TEFLON KULLANIMA UYGUN ( SÜRE 30 SN / 280 C )', points: 3, critical: 0, deduction: 0, desc: 'Toaster temizliği ve kullanımı' },
      { cat: 'IZGARA / PİŞİRNE', text: 'FRİTÖZ YAĞ SEVİYESİ YETERLİ Mİ ( İKİ ÇİZGİ ARASI ) , TPM DEĞERLERİ UYGUN MU ? KARBON TEMİZLİKLERİ YAPILIYOR MU? ( TPM ÜST SINIR 22 )', points: 2, critical: 1, deduction: 5, desc: 'Fritöz yağ seviyesi ve TPM - KRİTİK' },
      { cat: 'IZGARA / PİŞİRNE', text: 'BURGERLER SERVİS EDIRKEN BAYRAK KULLANILIYOR MU ?', points: 3, critical: 0, deduction: 0, desc: 'Burger servis standartları' },
      { cat: 'IZGARA / PİŞİRNE', text: 'PATATES PİŞİRME SÜRELERİNE DİKKAT EDİLİYOR MU ? ( 4 DK ) BAHARATLAMA YAPILIYOR MU ?', points: 3, critical: 1, deduction: 5, desc: 'Patates pişirme süresi ve baharatlandırma - KRİTİK' },
      { cat: 'IZGARA / PİŞİRNE', text: 'PATATES PİŞİRME İŞLEMİ SİPARİŞE GÖRE YAPILIYOR MU ? BEKLEME ÜNİTESİNDE ESKİ PATATES İLE YENİ ÇIKAN KARIŞTIRILIYIOR MU ? DOĞRU', points: 3, critical: 0, deduction: 0, desc: 'Patates pişirme prosesi' },
      { cat: 'IZGARA / PİŞİRNE', text: 'PATATES PIŞIRME SÜRELERİ KONTROL ALTINDA MI?', points: 2, critical: 0, deduction: 0, desc: 'Patates pişirme süresi kontrolü' },
      { cat: 'KASA - PAKET / PAZARYERİ', text: 'KASA ALANINDA TEMİZLİK VE DÜZEN YETERLİ Mİ?', points: 3, critical: 0, deduction: 0, desc: 'Kasa alanı temizlik ve düzeni' },
      { cat: 'KASA - PAKET / PAZARYERİ', text: 'PAKET MALZEMELERİ UYGUN ŞEKİLDE SAKLANMIŞ MI?', points: 2, critical: 0, deduction: 0, desc: 'Paket malzemeleri saklama' },
      { cat: 'KASA - PAKET / PAZARYERİ', text: 'PAZARYERİ ÜRÜNLERI UYGUN KOŞULLARDA SAKLANMIŞ MI?', points: 3, critical: 0, deduction: 0, desc: 'Pazaryeri ürünleri saklama' },
      { cat: 'RESTORAN TEMİZLİK VE DÜZEN', text: 'RESTORAN ALANINDA GENEL TEMİZLİK YETERLİ Mİ?', points: 3, critical: 0, deduction: 0, desc: 'Restoran genel temizliği' },
      { cat: 'RESTORAN TEMİZLİK VE DÜZEN', text: 'MASA VE SANDALYELER TEMİZ VE DÜZENLI Mİ?', points: 2, critical: 0, deduction: 0, desc: 'Masa ve sandalye durumu' },
      { cat: 'RESTORAN TEMİZLİK VE DÜZEN', text: 'ZEMIN TEMİZ VE KAYGAN DEĞİL Mİ?', points: 3, critical: 0, deduction: 0, desc: 'Zemin temizliği ve güvenliği' },
      { cat: 'EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ', text: 'EKİPMANLAR DÜZENLI OLARAK BAKIM YAPILIYOR MU?', points: 3, critical: 0, deduction: 0, desc: 'Ekipman bakım programı' },
      { cat: 'EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ', text: 'GIDA GÜVENLİĞİ SERTIFIKASI MEVCUT MU?', points: 2, critical: 1, deduction: 3, desc: 'Gıda güvenliği sertifikası - KRİTİK' },
      { cat: 'EKİPMAN BAKIMLARI, GEREKLİ EVRAKLAR VE GIDA GÜVENLİĞİ', text: 'GEREKLI YASAL EVRAKLAR HAZIR MI?', points: 2, critical: 0, deduction: 0, desc: 'Yasal evraklar hazırlığı' },
      { cat: 'RESTORAN HİZMET VE KALİTE STANDARTLARI', text: 'PERSONEL ÜNIFORMASI TEMİZ VE UYGUN MU?', points: 2, critical: 0, deduction: 0, desc: 'Personel üniforması standartları' },
      { cat: 'RESTORAN HİZMET VE KALİTE STANDARTLARI', text: 'HİZMET KALİTESİ YETERLİ MU?', points: 3, critical: 0, deduction: 0, desc: 'Hizmet kalitesi' },
      { cat: 'RESTORAN HİZMET VE KALİTE STANDARTLARI', text: 'MÜŞTERI MEMNUNİYETİ YETERLİ MU?', points: 3, critical: 0, deduction: 0, desc: 'Müşteri memnuniyeti' }
    ];
    
    for (const q of questions) {
      const [catResult] = await connection.execute(
        'SELECT id FROM field_inspection_categories WHERE name = ?',
        [q.cat]
      );
      
      if (catResult.length > 0) {
        await connection.execute(
          'INSERT IGNORE INTO field_inspection_questions (category_id, question_text, points, is_critical, point_deduction, description) VALUES (?, ?, ?, ?, ?, ?)',
          [catResult[0].id, q.text, q.points, q.critical, q.deduction, q.desc]
        );
      }
    }
    console.log('✓ Sorular eklendi');
    
    // Trigger oluştur
    console.log('🔒 Koruma Trigger\'ı oluşturuluyor...');
    try {
      await connection.execute('DROP TRIGGER IF EXISTS prevent_critical_question_deletion');
    } catch (e) {
      // ignore
    }
    
    await connection.execute(`
      CREATE TRIGGER prevent_critical_question_deletion 
      BEFORE DELETE ON field_inspection_questions
      FOR EACH ROW
      BEGIN
        IF OLD.is_critical = 1 THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'HATA: Kritik sorular silinemez! Lütfen sistem yöneticisi ile iletişime geçiniz.';
        END IF;
      END
    `);
    console.log('✓ Koruma Trigger\'ı oluşturuldu');
    
    // Doğrulama
    const [[{ total: totalQuestions }]] = await connection.execute('SELECT COUNT(*) as total FROM field_inspection_questions');
    const [[{ total: totalCategories }]] = await connection.execute('SELECT COUNT(*) as total FROM field_inspection_categories');
    const [[{ total: criticalQuestions }]] = await connection.execute('SELECT COUNT(*) as total FROM field_inspection_questions WHERE is_critical = 1');
    
    console.log('\n✅ BAŞARILI!');
    console.log(`📊 Toplam Sorular: ${totalQuestions}`);
    console.log(`📂 Toplam Kategoriler: ${totalCategories}`);
    console.log(`🔴 Kritik Sorular: ${criticalQuestions}`);
    console.log('\n🔒 Kritik sorular silinmesinden korunmaktadır!');
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

loadQuestions();
