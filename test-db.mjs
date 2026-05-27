import mysql from 'mysql2/promise';

async function testConnection() {
  const dbUrl = process.env.DATABASE_URL;
  console.log('📌 DATABASE_URL:', dbUrl?.substring(0, 50) + '...');
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL tanımlanmamış');
    return;
  }

  try {
    const urlObj = new URL(dbUrl);
    console.log('📌 Host:', urlObj.hostname);
    console.log('📌 Port:', urlObj.port);
    console.log('📌 Database:', urlObj.pathname.split('/')[1]);

    const connection = await mysql.createConnection({
      host: urlObj.hostname,
      port: urlObj.port,
      user: urlObj.username,
      password: urlObj.password,
      database: urlObj.pathname.split('/')[1],
      ssl: {
        rejectUnauthorized: false,
      },
    });

    console.log('✅ Veritabanına bağlandı');

    // Kategorileri kontrol et
    const [categories] = await connection.execute('SELECT COUNT(*) as count FROM field_inspection_categories');
    console.log('📌 Kategoriler:', categories[0].count);

    // Soruları kontrol et
    const [questions] = await connection.execute('SELECT COUNT(*) as count FROM field_inspection_questions');
    console.log('📌 Sorular:', questions[0].count);

    // Soruları yükle
    const questionData = [
      [1, 'IZGARA DÖKÜMLERİ VE DABLUMBAZLARIN TEMİZLİĞİ YETERLİ Mİ?', 4, 4, 1, 3, 'MARKA STANDARTLARI/GÜVENLİK', 1],
      [1, 'SOĞUTUCU DOLAPLARIN İÇ VE DIŞ TEMİZLİKLERİ YETERLİ Mİ?', 2, 2, 0, 0, '', 2],
      [1, 'IZGARADA KULLANILAN KÜÇÜK EKİPMAN TEMİZLİĞİ YETERLİ Mİ?', 3, 3, 0, 0, '', 3],
      [1, 'ÇÖP KOVALARI PEDALLI, TEMİZ VE AĞZI KAPALI', 2, 2, 0, 0, '', 4],
      [1, 'ET ÜRÜNLERİNDE STANDARTLARA UYGUN MÜHÜRLEME YAPILIYOR MU?', 2, 2, 1, 3, 'MARKA STANDARTLARI/GÜVENLİK', 5],
      [1, 'PLATE SICAKLIĞI (180-210) ARASINDA MI?', 7, 7, 1, 0, 'MARKA STANDARTLARI/GÜVENLİK', 6],
      [1, 'EZME (KARAMALİZE) İŞLEMİ UYGUN BİR ŞEKİLDE YAPILIYOR MU?', 4, 4, 0, 0, '', 7],
      [1, 'SMASH PİŞİRME İŞLEMİNDE ÇİĞ TARAFA TUZ SERPİLİYOR MU?', 3, 3, 0, 0, '', 8],
      [1, 'SMASH PİŞİRME İŞLEMİ TEMİZ IZGARADA YAPILIYOR MU?', 5, 5, 0, 0, '', 9],
      [1, 'KARAMELİZE SOĞAN VE MANTAR REÇETEYE UYGUN HAZIRLANMIŞ MI?', 2, 2, 0, 0, '', 10],
      [1, 'EKMEK AÇMA TEZGAHINDA TÜM ÜRÜNLER MEVCUT MU?', 3, 3, 0, 0, '', 11],
      [1, 'EKMEK SOSLAMA İÇİN UYGUN FİŞEKLER KULLANILIYOR MU?', 2, 2, 0, 0, '', 12],
      [1, 'EKMEK SKT KULLANIMA UYGUN MU?', 3, 3, 0, 0, '', 13],
      [1, 'EKMEKLER KESME APARATINDA EŞİT BİR ŞEKİLDE KESİLİYOR MU?', 3, 3, 0, 0, '', 14],
      [1, 'EKMEK SOSLAMA VE GARNİTÜR KULLANIMI REÇETEYE UYGUN MU?', 3, 3, 0, 0, '', 15],
      [1, 'TOASTER TEMİZLİĞİ YETERLİ, TEFLON KULLANIMA UYGUN MU?', 3, 3, 0, 0, '', 16],
      [1, 'FRİTÖZ YAĞ SEVİYESİ YETERLİ Mİ?', 2, 2, 1, 0, 'MARKA STANDARTLARI/GÜVENLİK', 17],
      [1, 'BURGERLER SERVİS EDİLİRKEN BAYRAK KULLANILIYOR MU?', 3, 3, 0, 0, '', 18],
      [1, 'PATATES PİŞİRME SÜRELERİNE DİKKAT EDİLİYOR MU?', 3, 3, 1, 0, 'MARKA STANDARTLARI', 19],
      [1, 'PATATES PİŞİRME İŞLEMİ SİPARİŞE GÖRE YAPILIYOR MU?', 5, 5, 1, 0, 'MARKA STANDARTLARI', 20],
      [1, 'GIDA GÜVENLİĞİ KONTROL ÇİZELGESİ GÜNCEL TUTULUYOR MU?', 5, 5, 1, 0, 'GIDA GÜVENLİĞİ', 21],
      [1, 'SKT GEÇMİŞ ÜRÜN BULUNMUYOR MU?', 3, 3, 1, 3, 'GIDA GÜVENLİĞİ', 22],
      [1, 'IZGARA PERSONELİ KIYAFET YÖNETMELİĞİNE UYGUN GİYİNİYOR MU?', 2, 2, 0, 0, '', 23],
      [1, 'IZGARA BÖLÜMÜNDE AYDINLATMALAR YETERLİ Mİ?', 2, 2, 0, 0, '', 24],
      [1, 'COLESLOVE REÇETEYE GÖRE HAZIRLANMIŞ MI?', 3, 3, 0, 0, '', 25],
      [1, 'TAVUK UNLAMA ÜNİTESİ TEMİZ Mİ?', 3, 3, 0, 0, '', 26],
      [1, 'TAVUK ÜRÜNLERİ AĞIZI KAPAKLI GASTRO KÜVETLERDE TUTULUYOR MU?', 2, 2, 1, 0, 'MARKA STANDARTLARI/GIDA GÜVENLİĞİ', 27],
      [1, 'BUTTER SOS REÇETEYE UYGUN YAPILMIŞ MI?', 3, 3, 0, 0, '', 28],
      [1, 'TAVUK ÜRÜNLERİ SOĞUTUCU DOLAP DERECESİ UYGUN MU?', 2, 2, 1, 0, 'MARKA STANDARTLARI/GIDA GÜVENLİĞİ', 29],
      [1, 'ÜRÜNLERDE KOKU, RENK DEĞİŞİMİ SORUNU YOK MU?', 3, 3, 1, 3, 'MARKA STANDARTLARI/GIDA GÜVENLİĞİ', 30],
      [1, 'KAPLAMALI TAVUKLAR REÇETEYE UYGUN OLARAK PİŞRİLİYOR MU?', 3, 3, 0, 0, '', 31],
      [1, 'TAVUK BEKLETME ÜNİTESİ TEMİZLİĞİ VE ISI DERECESİ YETERLİ Mİ?', 3, 3, 0, 0, '', 32],
      [1, 'PİŞEN ÜRÜNLERİN SÜRELERİNİN TAKİBİ İÇİN KRONOMETRE MEVCUT MU?', 2, 2, 0, 0, '', 33],
      [2, 'KASA VE PAKET BÖLÜMÜ PERSONELİNİN KIYAFETLERİ UYGUN MU?', 6, 6, 1, 0, 'MARKA STANDARTLARI', 34],
      [2, 'KASAYA GELEN MİSAFİRE GÜNÜN SAATİNE UYGUN KARŞILAMA YAPILIYOR MU?', 12, 12, 0, 0, '', 35],
      [2, 'MODPOS KASA PAKET ENTEGRASYONLARI AKTİF Mİ?', 10, 10, 1, 0, 'YASAL SÜREÇ', 36],
      [2, 'MODPOS EKRANLARINDA GÜNCEL VİDEO VEYA KAMPANYA GÖRSELİ AKTİF Mİ?', 6, 6, 0, 0, '', 37],
      [2, 'PAZARYERLERİ AÇIK MI?', 4, 4, 0, 0, '', 38],
      [2, 'MERKEZİN BELİRLEMİŞ OLDUĞU KAMPANYALAR AÇIK MI?', 4, 4, 1, 0, 'MARKA STANDARTLARI', 39],
      [2, 'KASA ÖNÜNDE YAN ÜRÜN VE TATLI GÖRSELLERİ MEVCUT MU?', 4, 4, 0, 0, '', 40],
      [2, 'ÖNERİLİ SATIŞ YAPILIYOR MU?', 6, 6, 0, 0, '', 41],
      [2, 'PAKET BÖLÜMÜNDE KULLANILAN TÜM SARF VE SOS ÜRÜNLERİ MEVCUT MU?', 3, 3, 0, 0, '', 42],
      [2, 'PAZARYERLERİ YAZARKASA ENTEGRASYONU VAR MI?', 12, 12, 0, 0, '', 43],
      [2, 'PAZAR YERİ PUANLARI (TRENDYOL 4.5- YEMEK SEPETİ 4.5) UYGUN MU?', 8, 8, 0, 0, '', 44],
      [2, 'GOOGLE PUANI MİNİMUM ÜZERİNDE Mİ? (4.5)', 8, 8, 0, 0, '', 45],
      [2, 'MENÜBORD VE FİYAT LİSTELERİNDEKİ FİYAT DEĞİŞİM TARİHLERİ DOĞRU MU?', 3, 3, 0, 0, '', 46],
      [2, 'LİMONATA YETERLİ VE MUSLUK TEMİZ Mİ?', 4, 4, 0, 0, '', 47],
      [2, 'İÇECEK DOLAPLARI TEMİZ VE DERECESİ UYGUN MU?', 2, 2, 0, 0, '', 48],
      [2, 'PAZARYERİ KURYELERİNE PAKET TESLİM SIRASINDAN DOĞRU MU?', 8, 8, 0, 0, '', 49],
      [3, 'RESTORAN DIŞ GÖRÜNÜMÜ (TABELA & CAMLAR) TEMİZ Mİ?', 10, 10, 0, 0, '', 50],
      [3, 'RESTORAN SALON DÜZENİ VE TEMİZLİĞİ YETERLİ Mİ?', 9, 9, 0, 0, '', 51],
      [3, 'RESTORANDA AYDİNLATMA VE GÖRSELLER ÇALIŞIYOR MU?', 9, 9, 0, 0, '', 52],
      [3, 'RESTORAN ORTAM ISISI YETERLİ Mİ?', 9, 9, 0, 0, '', 53],
      [3, 'SALONDA BULUNAN İÇECEK DOLAPLARIN TEMİZLİĞİ UYGUN MU?', 9, 9, 0, 0, '', 54],
      [3, 'SOS STANTI VEYA AHŞAP SOSLUKLARIN TEMİZLİĞİ YETERLİ Mİ?', 7, 7, 0, 0, '', 55],
      [3, 'SERVANTLARIN GENEL TEMİZLİĞİ UYGUN MU?', 5, 5, 0, 0, '', 56],
      [3, 'MAMA SANDALYESİ YETERLİ Mİ? TEMİZLİĞİ UYGUN MU?', 8, 8, 0, 0, '', 57],
      [3, 'KLİMALAR VE HAVA PERDESİ ÇALIŞIYOR MU?', 8, 8, 0, 0, '', 58],
      [3, 'RESTORANDA KIRIK-FAYANS KALEBODUR, CAM SORUNU YOK MU?', 5, 5, 0, 0, '', 59],
      [3, 'HAZIRLIK MUTFAĞI TEMİZLİĞİ VE DÜZENİ YETERLİ Mİ?', 6, 6, 0, 0, '', 60],
      [3, 'YANGIN TÜPLERİNİN BASINÇLARI UYGUN MU?', 8, 8, 1, 0, 'GÜVENLİK', 61],
      [3, 'SMG MÜZİK SİSTEMİ AKTİF ÇALIŞIYOR MU?', 7, 7, 0, 0, '', 62],
      [3, 'SALON TEMİZ VE DÜZENLİ Mİ?', 5, 5, 0, 0, '', 63],
      [4, 'BACA TEMİZLİĞİ EVRAKLARI MEVCUT VE GÜNCEL Mİ?', 13, 13, 1, 0, 'GÜVENLİK', 64],
      [4, 'ATIK YAĞ EVRAKLARI MEVCUT MU VE GÜNCEL Mİ?', 6, 6, 0, 0, '', 65],
      [4, 'HAŞERE İLAÇLAMA EVRAKLARI MEVCUT VE GÜNCEL Mİ?', 6, 6, 1, 0, 'YASAL SÜREÇ', 66],
      [4, 'ESP FİLTRE TEMİZLİĞİ EVRAKLARI MEVCUT MU?', 8, 8, 0, 0, '', 67],
      [4, 'TABELA TEMİZ VE ÇALIŞIYOR MU?', 8, 8, 0, 0, '', 68],
      [4, 'ENERJİ TASARUF KURALLARINA DİKKAT EDİLİYOR MU?', 3, 3, 0, 0, '', 69],
      [4, 'EFK CİHAZLARI ÇALIŞIYOR MU?', 9, 9, 0, 0, '', 70],
      [4, 'RESTORANDA SOĞUTUCU (1C°/4C°) VE DONDURUCULAR UYGUN MU?', 9, 9, 1, 0, 'GIDA GÜVENLİĞİ', 71],
      [4, 'DEPODAKI ÜRÜNLER YERDEN 15 CM YÜKSEKTE Mİ?', 9, 9, 0, 0, '', 72],
      [4, 'GIDA VE TEMİZLİK ÜRÜNLERİ AYRI YERLERDE DEPOLANIYOR MU?', 8, 8, 0, 0, '', 73],
      [4, 'BÜTÜN ÇALIŞANLARIN HİJYEN EĞİTİMLERİ VAR MI?', 3, 3, 0, 0, '', 74],
      [4, 'PERSONEL EĞİTİM DOSYALARI MEVCUT MU?', 10, 10, 1, 0, 'EĞİTİM', 75],
      [4, 'GÜNLÜK ENVANTER DÜZENLİ OLARAK TUTULUYOR MU?', 8, 8, 0, 0, '', 76],
      [5, 'VARDİYA DA YÖNETİCİ BULUNUYOR MU?', 20, 20, 1, 0, 'MARKA STANDARTLARI', 77],
      [5, 'VARDİYA SAATİNE GÖRE YETERLİ PERSONEL VAR MI?', 8, 8, 0, 0, '', 78],
      [5, 'MİSAFİR GİRİŞ VEYA ÇIKIŞ YAPTIĞINDA GÜNÜN SAATİNE GÖRE UYGUN MU?', 7, 7, 0, 0, '', 79],
      [5, 'GÜN İÇİNDE RESTORAN GİRİŞİ VE SALON TEMİZLİĞİNE GEREKEN ÖNEM VERİLİYOR MU?', 6, 6, 0, 0, '', 80],
      [5, 'WC\'LERDE KAĞIT HAVLU, SABUN, TUVALET KAĞIDI YETERLİ Mİ?', 5, 5, 0, 0, '', 81],
      [5, 'RESTORAN GİRİŞİNDE HİJYENİK PASPAS KULLANILIYOR MU?', 5, 5, 0, 0, '', 82],
      [5, 'PERSONEL KIYAFETLERİ YÖNETMELİĞE UYGUN MU?', 10, 10, 0, 0, '', 83],
      [5, 'PERSONELİN DAVRANIŞLARI VE BİRBİRİNE HİTABI UYGUN MU?', 4, 4, 0, 0, '', 84],
      [5, 'RESTORANDA GÜNCEL KAMPANYA GÖRSELLERİ MEVCUT MU?', 5, 5, 0, 0, '', 85],
      [5, 'RESTORAN GİRİŞİNDE FİYAT LİSTESİ ASILI MI?', 7, 7, 0, 0, '', 86],
      [5, 'KAPALI ALANDA SİGARA İÇİLMEZ LEVHASI ASILI MI?', 5, 5, 0, 0, '', 87],
      [5, 'SALON VE KASA ÇALIŞANLARI EĞİTİMLERİNİ TAMAMLANMIŞ MI?', 8, 8, 0, 0, '', 88],
      [5, 'RESTORANDA GEÇERLİ OLAN ÖDEME YÖNTEMLERİ GÖRSELLENDİRİLMİŞ Mİ?', 5, 5, 0, 0, '', 89],
    ];

    let count = 0;
    for (const q of questionData) {
      try {
        await connection.execute(
          'INSERT INTO field_inspection_questions (categoryId, questionText, points, maxScore, isCritical, criticalPenalty, criticalCategory, `order`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          q
        );
        count++;
      } catch (err) {
        // Sessiz geç
      }
    }
    console.log('✅ Sorular eklendi:', count);

    // Kontrol et
    const [final] = await connection.execute('SELECT COUNT(*) as count FROM field_inspection_questions');
    console.log('📌 Toplam sorular:', final[0].count);

    await connection.end();
  } catch (err) {
    console.error('❌ Hata:', err.message);
  }
}

testConnection();
