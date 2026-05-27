import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  longtext,
  tinyint,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow with role-based access control.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // Manus OAuth için
  username: varchar("username", { length: 255 }), // Kullanıcı adı (local login)
  passwordHash: varchar("passwordHash", { length: 255 }), // Şifre hash (bcrypt)
  isActive: boolean("isActive").default(true), // Kullanıcı aktif mi
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }), // 'oauth' veya 'local'
  role: mysqlEnum("role", ["user", "admin", "branch_manager", "operations_manager", "region_manager"]).default("user").notNull(),
  branchId: int("branchId"), // Şube ID - null for admin/region managers
  branchName: varchar("branchName", { length: 255 }), // Şube adı
  tcNumber: varchar("tcNumber", { length: 11 }), // TC Kimlik Numarası
  hireDate: timestamp("hireDate"), // İşe giriş tarihi
  inspectorEmail: varchar("inspectorEmail", { length: 320 }), // Denetçi e-posta (Bölge Müdürü)
  restaurantManagerEmail: varchar("restaurantManagerEmail", { length: 320 }), // Restoran Müdürü e-posta
  branchManager: varchar("branchManager", { length: 255 }), // Şube müdürü adı
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Kullanıcı oturumu - Session yönetimi için
 */
export const userSessions = mysqlTable("user_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Kullanıcı ID
  token: varchar("token", { length: 255 }).notNull().unique(), // Session token
  expiresAt: timestamp("expiresAt").notNull(), // Token geçerlilik süresi
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

/**
 * Şubeler tablosu - Keban Food şubelerinin bilgilerini saklar
 */
export const branches = mysqlTable("branches", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Şube adı
  code: varchar("code", { length: 50 }).notNull().unique(), // Şube kodu
  region: varchar("region", { length: 255 }), // Bölge
  manager: varchar("manager", { length: 255 }), // Şube müdürü
  regionManagerId: int("regionManagerId"), // Bölge operasyon müdürü ID
  address: text("address"), // Adres
  phone: varchar("phone", { length: 20 }), // Telefon
  branchEmail: varchar("branchEmail", { length: 320 }), // Şube/Yönetici e-posta
  evaluationPeriod: varchar("evaluationPeriod", { length: 50 }), // Değerlendirme dönemi (2026 Q1 vb)
  status: mysqlEnum("status", ["active", "inactive"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = typeof branches.$inferInsert;

/**
 * KPI Hedef Kartı Tanımları - Her şube için KPI hedeflerini saklar
 */
export const kpiTargets = mysqlTable("kpi_targets", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").notNull(), // Şube ID
  dimension: varchar("dimension", { length: 100 }).notNull(), // Boyut (FİNANS, MÜŞTERİ, İNSAN)
  target: varchar("target", { length: 255 }).notNull(), // Hedef adı
  description: text("description"), // Hedef açıklaması
  unit: varchar("unit", { length: 50 }), // Birim (TL, %, Adet vb)
  frequency: varchar("frequency", { length: 50 }), // Sıklık (Aylık, Üç Aylık vb)
  weight: decimal("weight", { precision: 5, scale: 2 }).default("0"), // Ağırlık %
  lowerLimit: decimal("lowerLimit", { precision: 12, scale: 2 }), // Hedef Alt Limit (80 puan)
  targetValue: decimal("targetValue", { precision: 12, scale: 2 }), // Hedef Değer (100 puan)
  upperLimit: decimal("upperLimit", { precision: 12, scale: 2 }), // Hedef Üst Limit (120 puan)
  period: varchar("period", { length: 50 }).default("2026/1").notNull(), // Dönem (2026/1, 2026/2 vb)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KPITarget = typeof kpiTargets.$inferSelect;
export type InsertKPITarget = typeof kpiTargets.$inferInsert;

/**
 * Performans Verileri - Şubelerin gerçek performans metriklerini saklar
 */
export const performanceData = mysqlTable("performance_data", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").notNull(), // Şube ID
  kpiTargetId: int("kpiTargetId").notNull(), // KPI Hedef ID
  period: varchar("period", { length: 50 }).notNull(), // Dönem (2026-01 vb)
  actualValue: decimal("actualValue", { precision: 12, scale: 2 }).notNull(), // Gerçek değer
  score: decimal("score", { precision: 5, scale: 2 }), // Puan (0-120)
  status: mysqlEnum("status", ["below_target", "on_target", "above_target"]), // Durum
  notes: text("notes"), // Notlar
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PerformanceData = typeof performanceData.$inferSelect;
export type InsertPerformanceData = typeof performanceData.$inferInsert;

/**
 * Finansal Metrikler - Şubelerin finansal performansını detaylı olarak saklar
 */
export const financialMetrics = mysqlTable("financial_metrics", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").notNull(), // Şube ID
  period: varchar("period", { length: 50 }).notNull(), // Dönem
  revenue: decimal("revenue", { precision: 12, scale: 2 }), // Ciro
  hamburgerCount: int("hamburgerCount"), // Hamburger adedi
  profitability: decimal("profitability", { precision: 5, scale: 2 }), // Karlılık %
  sideProductSales: decimal("sideProductSales", { precision: 12, scale: 2 }), // Yan ürün satışı
  energyCost: decimal("energyCost", { precision: 12, scale: 2 }), // Enerji gideri
  foodCost: decimal("foodCost", { precision: 12, scale: 2 }), // Gıda maliyeti
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FinancialMetrics = typeof financialMetrics.$inferSelect;
export type InsertFinancialMetrics = typeof financialMetrics.$inferInsert;

/**
 * Müşteri Metrikleri - Müşteri memnuniyeti ve puanlarını saklar
 */
export const customerMetrics = mysqlTable("customer_metrics", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").notNull(), // Şube ID
  period: varchar("period", { length: 50 }).notNull(), // Dönem
  complaintRate: decimal("complaintRate", { precision: 5, scale: 2 }), // Şikayet oranı %
  googleRating: decimal("googleRating", { precision: 3, scale: 2 }), // Google puanı
  marketplaceRating: decimal("marketplaceRating", { precision: 3, scale: 2 }), // Pazaryeri puanı
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomerMetrics = typeof customerMetrics.$inferSelect;
export type InsertCustomerMetrics = typeof customerMetrics.$inferInsert;

/**
 * İnsan Kaynakları Metrikleri - Personel ve eğitim metriklerini saklar
 */
export const hrMetrics = mysqlTable("hr_metrics", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").notNull(), // Şube ID
  period: varchar("period", { length: 50 }).notNull(), // Dönem
  staffCost: decimal("staffCost", { precision: 12, scale: 2 }), // Personel maliyeti
  turnoverRate: decimal("turnoverRate", { precision: 5, scale: 2 }), // İşgücü devir oranı %
  trainingPerformance: decimal("trainingPerformance", { precision: 5, scale: 2 }), // Eğitim performans oranı %
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HRMetrics = typeof hrMetrics.$inferSelect;
export type InsertHRMetrics = typeof hrMetrics.$inferInsert;

/**
 * Toplu Yükleme Geçmişi - Excel yükleme işlemlerinin kaydını tutar
 */
export const bulkUploadHistory = mysqlTable("bulk_upload_history", {
  id: int("id").autoincrement().primaryKey(),
  uploadedBy: int("uploadedBy").notNull(), // Yükleyen kullanıcı ID
  fileName: varchar("fileName", { length: 255 }).notNull(), // Dosya adı
  recordCount: int("recordCount"), // Yüklenen kayıt sayısı
  status: mysqlEnum("status", ["success", "partial", "failed"]).default("success"),
  errors: json("errors"), // Hata detayları
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BulkUploadHistory = typeof bulkUploadHistory.$inferSelect;
export type InsertBulkUploadHistory = typeof bulkUploadHistory.$inferInsert;

/**
 * Raporlar - Oluşturulan raporların kaydını tutar
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId"), // Şube ID (null = tüm şubeler)
  generatedBy: int("generatedBy").notNull(), // Raporun oluşturulduğu kullanıcı
  reportType: varchar("reportType", { length: 50 }).notNull(), // Rapor türü (KPI, Financial, HR vb)
  period: varchar("period", { length: 50 }), // Dönem
  fileUrl: text("fileUrl"), // Rapor dosyası URL
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Dönem Tanımları - Performans değerlendirme dönemlerini saklar
 */
export const periods = mysqlTable("periods", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(), // Dönem adı (2026/1, 2026/2 vb)
  year: int("year").notNull(), // Yıl
  month: int("month").notNull(), // Ay (1-12)
  startDate: timestamp("startDate").notNull(), // Dönem başlangıç tarihi
  endDate: timestamp("endDate").notNull(), // Dönem bitiş tarihi
  isActive: boolean("isActive").default(true).notNull(), // Aktif dönem mi?
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Period = typeof periods.$inferSelect;
export type InsertPeriod = typeof periods.$inferInsert;

/**
 * KPI Hedef Kartları Detay - Excel'den içe aktarılan şube hedeflerini saklar
 */
export const kpiTargetCardsDetail = mysqlTable("kpi_target_cards_detail", {
  id: int("id").autoincrement().primaryKey(),
  period: varchar("period", { length: 20 }).notNull(),
  branchName: varchar("branchName", { length: 255 }).notNull(),
  branchManager: varchar("branchManager", { length: 255 }).notNull(),
  bolgeSorumlusu: varchar("bolgeSorumlusu", { length: 255 }), // Bölge Sorumlusu
  dimension: varchar("dimension", { length: 100 }).notNull(),
  target: varchar("target", { length: 255 }).notNull(),
  targetDescription: text("targetDescription"),
  unit: varchar("unit", { length: 50 }),
  source: varchar("source", { length: 100 }),
  frequency: varchar("frequency", { length: 50 }),
  weight: int("weight").default(0),
  targetType: varchar("targetType", { length: 20 }),
  lowerLimit: varchar("lowerLimit", { length: 50 }),
  targetValue: varchar("targetValue", { length: 50 }),
  upperLimit: varchar("upperLimit", { length: 50 }),
  actualValue: varchar("actualValue", { length: 50 }),
  score: varchar("score", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KPITargetCardDetail = typeof kpiTargetCardsDetail.$inferSelect;
export type InsertKPITargetCardDetail = typeof kpiTargetCardsDetail.$inferInsert;

/**
 * Deneme Süresi Değerlendirme Formu - Personel değerlendirme formlarını saklar
 * TC No benzersiz anahtar olarak kullanılır
 */
export const performanceEvaluations = mysqlTable("performance_evaluations", {
  id: int("id").autoincrement().primaryKey(),
  employeeTCNumber: varchar("employeeTCNumber", { length: 11 }).notNull().unique(), // TC Numarası (benzersiz anahtar)
  employeeName: varchar("employeeName", { length: 255 }).notNull(), // Personel adı soyadı
  // Sicil No kaldırıldı - sadece TC No ve Adı Soyadı kullanılacak
  branch: varchar("branch", { length: 255 }).notNull(), // Şube adı
  department: varchar("department", { length: 255 }), // Bölüm
  hireDate: varchar("hireDate", { length: 50 }), // İşe giriş tarihi
  evaluationType: mysqlEnum("evaluationType", ["1.5_months", "5.5_months"]).notNull(), // Değerlendirme türü (1.5 Ay, 5.5 Ay)
  evaluationMonth: varchar("evaluationMonth", { length: 50 }).notNull(), // Değerlendirme ayı (2026/3 gibi)
  scores: json("scores"), // Tüm sorular ve cevaplar (JSON) - 15 kriter + 5 yetkinlik
  successPercentage: varchar("successPercentage", { length: 10 }), // Başarı yüzdesi (string olarak sakla)
  continueEmployment: boolean("continueEmployment"), // Devam kararı (true/false)
  continueEmploymentReason: text("continueEmploymentReason"), // Hayır cevabı için detaylı açıklama
  managerOpinion: text("managerOpinion"), // Yönetici Görüşü
  overallComments: text("overallComments"), // Genel görüş ve yorum
  evaluatedBy: varchar("evaluatedBy", { length: 255 }), // Değerlendiren kişi (1. Amir)
  evaluatedByDate: varchar("evaluatedByDate", { length: 50 }), // 1. Amir imza tarihi
  evaluatedBySecond: varchar("evaluatedBySecond", { length: 255 }), // 2. Amir (opsiyonel)
  evaluatedBySecondDate: varchar("evaluatedBySecondDate", { length: 50 }), // 2. Amir imza tarihi
  hrReviewedBy: varchar("hrReviewedBy", { length: 255 }), // İK tarafından incelenen
  hrReviewedByDate: varchar("hrReviewedByDate", { length: 50 }), // İK imza tarihi
  pdfUrl: text("pdfUrl"), // S3'te saklanmış PDF'in URL'si
  createdByUserId: varchar("createdByUserId", { length: 50 }), // Formu oluşturan kullanıcı
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PerformanceEvaluation = typeof performanceEvaluations.$inferSelect;
export type InsertPerformanceEvaluation = typeof performanceEvaluations.$inferInsert;


// Performans İzleme Formu (PİF) Değerlendirmeleri
export const openPifEvaluations = mysqlTable("openPifEvaluations", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId"),
  employeeName: varchar("employeeName", { length: 255 }).notNull(),
  employeePosition: varchar("employeePosition", { length: 255 }).notNull(),
  employeeIdNumber: varchar("employeeIdNumber", { length: 50 }),
  hireDate: timestamp("hireDate"),
  evaluationDate: timestamp("evaluationDate"),
  evaluationPeriod: varchar("evaluationPeriod", { length: 50 }),
  evaluatedByManager: varchar("evaluatedByManager", { length: 255 }),
  items: json("items"), // Değerlendirme maddeleri ve puanlar
  scoreExplanations: json("scoreExplanations"), // 1 veya 5 puan için açıklamalar {itemId: explanation}
  managerOpinion: text("managerOpinion"),
  totalScore: int("totalScore"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OpenPifEvaluation = typeof openPifEvaluations.$inferSelect;
export type InsertOpenPifEvaluation = typeof openPifEvaluations.$inferInsert;


// Pozisyon Kategorileri
export const positionCategories = mysqlTable("position_categories", {
  id: int("id").autoincrement().primaryKey(),
  positionId: int("positionId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  order: int("order"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PositionCategory = typeof positionCategories.$inferSelect;
export type InsertPositionCategory = typeof positionCategories.$inferInsert;

// Pozisyon Soruları
export const positionQuestions = mysqlTable("position_questions", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  questionNumber: int("questionNumber").notNull(),
  questionText: text("questionText").notNull(),
  points: int("points").default(0), // Soru puanı
  isCritical: boolean("isCritical").default(false), // Kritik soru mu
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PositionQuestion = typeof positionQuestions.$inferSelect;
export type InsertPositionQuestion = typeof positionQuestions.$inferInsert;


// Pozisyonlar
export const positions = mysqlTable("positions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Position = typeof positions.$inferSelect;
export type InsertPosition = typeof positions.$inferInsert;

/**
 * Deneme Süresi Değerlendirme Formu - Probation Evaluation
 * Personel değerlendirme formlarını saklar (15 Kriter + 4 Yetkinlik)
 */
export const probationEvaluations = mysqlTable("probation_evaluations", {
  id: int("id").autoincrement().primaryKey(),
  employeeTCNumber: varchar("employeeTCNumber", { length: 11 }).notNull(), // TC Numarası
  employeeName: varchar("employeeName", { length: 255 }).notNull(), // Personel adı soyadı
  branchId: int("branchId"), // Şube ID
  branchName: varchar("branchName", { length: 255 }).notNull(), // Şube adı
  department: varchar("department", { length: 255 }), // Bölüm/Görevi
  hireDate: varchar("hireDate", { length: 50 }), // İşe giriş tarihi
  evaluationPeriod: mysqlEnum("evaluationPeriod", ["1.5_months", "5.5_months"]).notNull(), // Değerlendirme dönemi
  evaluationDate: varchar("evaluationDate", { length: 50 }).notNull(), // Değerlendirme tarihi
  
  // 15 Değerlendirme Kriteri (1-15)
  criteria1Score: int("criteria1Score"), // Teknik ve mesleki bilgi
  criteria2Score: int("criteria2Score"), // Yöneticileriyle iletişim
  criteria3Score: int("criteria3Score"), // İş arkadaşları ile iletişim
  criteria4Score: int("criteria4Score"), // Şirketi temsil yeteneği
  criteria5Score: int("criteria5Score"), // Verilen işi doğru ve zamanında yerine getirme
  criteria6Score: int("criteria6Score"), // Şirket kural ve talimatlarına uyma
  criteria7Score: int("criteria7Score"), // Araştırmaya ve öğrenmeye ilgisi
  criteria8Score: int("criteria8Score"), // Sorumluluk alma ve işi sahiplenme
  criteria9Score: int("criteria9Score"), // İşe değer katma, yeni fikirler üretme
  criteria10Score: int("criteria10Score"), // Değişen koşullara uyum sağlama
  criteria11Score: int("criteria11Score"), // Olumlu, yapıcı ve pozitif yaklaşım
  criteria12Score: int("criteria12Score"), // Etkin planlama ve zaman yönetimi
  criteria13Score: int("criteria13Score"), // İşe adapte olma ve motive çalışma
  criteria14Score: int("criteria14Score"), // Muhakeme yeteneği
  criteria15Score: int("criteria15Score"), // Etik ve dürüst çalışma
  
  // 4 Temel Yetkinlik
  competency1Score: int("competency1Score"), // Analiz Etme ve Problem Çözme
  competency2Score: int("competency2Score"), // Görev Bilinci
  competency3Score: int("competency3Score"), // İletişim Becerisi
  competency4Score: int("competency4Score"), // Kalite Odaklılık
  
  // Hesaplanan puanlar
  totalScore: int("totalScore"), // Toplam puan (1-5 ortalaması)
  successPercentage: decimal("successPercentage", { precision: 5, scale: 2 }), // Başarı yüzdesi (0-100)
  evaluationScale: varchar("evaluationScale", { length: 50 }), // Değerlendirme skalası (Yetersiz, Gelişime Açık, vb)
  
  // Karar ve görüşler
  continueEmployment: boolean("continueEmployment"), // Devam kararı
  continueEmploymentReason: text("continueEmploymentReason"), // Hayır cevabı için açıklama
  managerOpinion: text("managerOpinion"), // Yönetici görüşü
  overallComments: text("overallComments"), // Genel yorum
  
  // İmzalar ve tarihler
  evaluatedBy: varchar("evaluatedBy", { length: 255 }), // Değerlendiren (1. Amir)
  evaluatedByDate: varchar("evaluatedByDate", { length: 50 }), // 1. Amir imza tarihi
  evaluatedBySecond: varchar("evaluatedBySecond", { length: 255 }), // 2. Amir (opsiyonel)
  evaluatedBySecondDate: varchar("evaluatedBySecondDate", { length: 50 }), // 2. Amir imza tarihi
  hrReviewedBy: varchar("hrReviewedBy", { length: 255 }), // İK tarafından incelenen
  hrReviewedByDate: varchar("hrReviewedByDate", { length: 50 }), // İK imza tarihi
  
  // PDF ve dosya
  pdfUrl: text("pdfUrl"), // S3'te saklanmış PDF'in URL'si
  
  // Metadata
  createdByUserId: varchar("createdByUserId", { length: 50 }), // Formu oluşturan kullanıcı
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProbationEvaluation = typeof probationEvaluations.$inferSelect;
export type InsertProbationEvaluation = typeof probationEvaluations.$inferInsert;


/**
 * Saha Denetim Kategorileri
 */
export const fieldInspectionCategories = mysqlTable("field_inspection_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Kategori adı (Izgara, Kasa, Hijyen vb.)
  weight: decimal("weight", { precision: 5, scale: 2 }).default("0"), // Ağırlık %
  description: text("description"), // Kategori açıklaması
  order: int("order").default(0), // Sıra
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FieldInspectionCategory = typeof fieldInspectionCategories.$inferSelect;
export type InsertFieldInspectionCategory = typeof fieldInspectionCategories.$inferInsert;

/**
 * Saha Denetim Soruları
 */
export const fieldInspectionQuestions = mysqlTable("field_inspection_questions", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull().references(() => fieldInspectionCategories.id, { onDelete: 'restrict', onUpdate: 'no action' }), // Kategori ID - restrict silme
  questionText: text("questionText").notNull(), // Soru metni
  points: int("points").default(1), // Soru puan değeri (Excel B sütunundaki değer)
  maxScore: int("maxScore").default(5), // Maksimum puan (1-5)
  penaltyPoints: int("pointDeduction").default(0), // Puan düşümü (Hayır cevabında uygulanır)
  isCritical: boolean("isCritical").default(false), // Kritik soru mu?
  order: int("order").default(0), // Sıra
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FieldInspectionQuestion = typeof fieldInspectionQuestions.$inferSelect;
export type InsertFieldInspectionQuestion = typeof fieldInspectionQuestions.$inferInsert;

/**
 * Saha Denetimleri
 */
export const fieldInspections = mysqlTable("field_inspections", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").notNull(), // Şube ID
  branchCode: varchar("branchCode", { length: 50 }), // Şube kodu (30017 vb.)
  branchName: varchar("branchName", { length: 255 }), // Şube adı
  inspectorId: int("inspectorId").notNull(), // Denetçi (Bölge Müdürü) ID
  inspectorName: varchar("inspectorName", { length: 255 }), // Denetçi adı
  inspectorEmail: varchar("inspectorEmail", { length: 320 }), // Denetçi e-posta
  restaurantManagerEmail: varchar("restaurantManagerEmail", { length: 320 }), // Restoran Müdürü e-posta
  restaurantManagerName: varchar("restaurantManagerName", { length: 255 }), // Restoran Müdürü adı
  inspectionDate: timestamp("inspectionDate").notNull(), // Denetim tarihi
  totalScore: decimal("totalScore", { precision: 5, scale: 2 }).default("0.00"), // Toplam skor (100 üzerinden)
  generalAssessment: longtext("generalAssessment"), // Denetçi genel değerlendirmesi
  status: mysqlEnum("status", ["draft", "completed", "sent"]).default("draft"), // Durum
  pdfUrl: varchar("pdfUrl", { length: 500 }), // PDF dosyası URL
  additionalEmail: varchar("additionalEmail", { length: 320 }), // Ek e-posta
});

export type FieldInspection = typeof fieldInspections.$inferSelect;
export type InsertFieldInspection = typeof fieldInspections.$inferInsert;

/**
 * Saha Denetim Cevapları
 */
export const fieldInspectionAnswers = mysqlTable("field_inspection_answers", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspectionId").notNull(), // Denetim ID
  questionId: int("questionId").notNull(), // Soru ID
  answer: varchar("answer", { length: 1 }).notNull(), // Evet (E) / Hayır (H)
  earnedPoints: int("earnedPoints").notNull(), // Kazanılan puan (Evet ise questionPoints, Hayır ise 0)
  questionPoints: int("questionPoints").notNull(), // Soru puanı
  penaltyPoints: int("point_deduction").default(0), // Puan düşümü (Hayır cevabında uygulanır)
  explanation: text("explanation"), // Açıklama (opsiyonel)
  isCritical: boolean("isCritical").default(false), // Kritik soru mu?
  photoUrls: json("photoUrls"), // Fotoğraf URL'leri (JSON array, Base64 string'ler için)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FieldInspectionAnswer = typeof fieldInspectionAnswers.$inferSelect;
export type InsertFieldInspectionAnswer = typeof fieldInspectionAnswers.$inferInsert;

/**
 * Denetim Uyarıları - Aynı maddeden 3 kere üst üste "Hayır" alan şubeler için uyarılar
 */
export const inspectionWarnings = mysqlTable("inspection_warnings", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").notNull(), // Şube ID
  branchCode: varchar("branchCode", { length: 50 }), // Şube kodu
  branchName: varchar("branchName", { length: 255 }), // Şube adı
  questionId: int("questionId").notNull(), // Soru ID
  questionText: text("questionText").notNull(), // Soru metni
  categoryId: int("categoryId"), // Kategori ID
  categoryName: varchar("categoryName", { length: 255 }), // Kategori adı
  consecutiveNoCount: int("consecutiveNoCount").default(3), // Üst üste "Hayır" sayısı
  lastInspectionId: int("lastInspectionId").notNull(), // Son denetim ID
  lastInspectionDate: timestamp("lastInspectionDate"), // Son denetim tarihi
  inspectorId: int("inspectorId"), // Denetçi (Bölge Müdürü) ID
  inspectorEmail: varchar("inspectorEmail", { length: 320 }), // Denetçi e-posta
  status: mysqlEnum("status", ["active", "resolved", "dismissed"]).default("active"), // Uyarı durumu
  resolvedAt: timestamp("resolvedAt"), // Çözüm tarihi
  resolvedBy: int("resolvedBy"), // Çözen kişi ID
  notes: text("notes"), // Notlar
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InspectionWarning = typeof inspectionWarnings.$inferSelect;
export type InsertInspectionWarning = typeof inspectionWarnings.$inferInsert;

/**
 * Haftalık Saha Planı - Bölge müdürleri tarafından haftalık iş planlaması
 */
export const weeklyPlans = mysqlTable("weekly_plans", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").notNull(), // Şube ID
  branchCode: varchar("branchCode", { length: 50 }), // Şube kodu
  branchName: varchar("branchName", { length: 255 }), // Şube adı
  managerId: int("managerId").notNull(), // Bölge Müdürü ID
  managerName: varchar("managerName", { length: 255 }), // Bölge Müdürü adı
  managerEmail: varchar("managerEmail", { length: 320 }), // Bölge Müdürü e-posta
  planDate: timestamp("planDate").notNull(), // Plan tarihi (Pazartesi - Cumartesi)
  planTime: varchar("planTime", { length: 5 }), // Plan saati (HH:MM)
  storeName: varchar("storeName", { length: 255 }).notNull(), // Mağaza adı
  city: varchar("city", { length: 100 }).notNull(), // Şehir
  actionType: mysqlEnum("actionType", ["Denetim", "Eğitim", "Ürün Tanıtımı", "Sorun Çözümü", "Diğer"]).notNull(), // Aksiyon tipi
  priority: mysqlEnum("priority", ["Yüksek", "Orta", "Düşük"]).default("Orta"), // Öncelik
  planDescription: text("planDescription"), // Plan açıklaması
  
  // Gerçekleşme bilgileri
  status: mysqlEnum("status", ["Planlandı", "Tamamlandı", "Kısmen", "Tamamlanmadı", "Ertelendi"]).default("Planlandı"), // Gerçekleşme durumu
  actualTime: varchar("actualTime", { length: 5 }), // Gerçekleşen saat (HH:MM)
  actualNotes: text("actualNotes"), // Gerçekleşme notu
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WeeklyPlan = typeof weeklyPlans.$inferSelect;
export type InsertWeeklyPlan = typeof weeklyPlans.$inferInsert;

/**
 * Bildirim Tercihleri - Kullanıcıların bildirim tercihlerini saklar
 */
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // Kullanıcı ID
  emailNotifications: boolean("emailNotifications").default(true).notNull(), // E-posta bildirimleri
  smsNotifications: boolean("smsNotifications").default(false).notNull(), // SMS bildirimleri
  weeklyPlanCompleted: boolean("weeklyPlanCompleted").default(true).notNull(), // Haftalık plan tamamlandı
  weeklyPlanFailed: boolean("weeklyPlanFailed").default(true).notNull(), // Haftalık plan başarısız
  inspectionResults: boolean("inspectionResults").default(true).notNull(), // Denetim sonuçları
  performanceAlerts: boolean("performanceAlerts").default(true).notNull(), // Performans uyarıları
  systemUpdates: boolean("systemUpdates").default(false).notNull(), // Sistem güncellemeleri
  phoneNumber: varchar("phoneNumber", { length: 20 }), // Telefon numarası (SMS için)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;


/**
 * Ziyaret Planları - Bölge müdürleri tarafından şubelere yapılacak ziyaretlerin planlanması
 */
export const visitPlans = mysqlTable("visit_plans", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").notNull(), // Şube ID
  branchName: varchar("branchName", { length: 255 }).notNull(), // Şube adı
  visitDate: timestamp("visitDate").notNull(), // Ziyaret tarihi
  visitTime: varchar("visitTime", { length: 5 }).notNull(), // Ziyaret saati (HH:MM)
  visitType: mysqlEnum("visitType", ["Denetim", "Eğitim", "Ürün Tanıtımı", "Sorun Çözümü", "Diğer"]).notNull(), // Ziyaret türü
  visitDescription: text("visitDescription").notNull(), // Ziyaret açıklaması
  visitManagerId: int("visitManagerId").notNull(), // Ziyaret yapacak yönetici ID
  visitManager: varchar("visitManager", { length: 255 }).notNull(), // Ziyaret yapacak yönetici adı
  status: mysqlEnum("status", ["Planlandı", "Gerçekleşti", "İptal"]).default("Planlandı").notNull(), // Ziyaret durumu
  notes: text("notes"), // Ek notlar
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VisitPlan = typeof visitPlans.$inferSelect;
export type InsertVisitPlan = typeof visitPlans.$inferInsert;

/**
 * Denetim Aksiyon Planları - Denetim sırasında "Hayır" cevabı verilen sorular için aksiyon planları
 */
export const inspectionActions = mysqlTable("inspection_actions", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspectionId").notNull(), // Denetim ID
  answerId: int("answerId").notNull(), // Cevap ID (fieldInspectionAnswers)
  questionId: int("questionId").notNull(), // Soru ID
  questionText: text("questionText").notNull(), // Soru metni
  branchId: int("branchId").notNull(), // Şube ID
  branchName: varchar("branchName", { length: 255 }).notNull(), // Şube adı
  actionDescription: text("actionDescription").notNull(), // Aksiyon açıklaması
  actionDeadline: timestamp("actionDeadline"), // Aksiyon tamamlanma tarihi
  assignedTo: int("assignedTo").default(0), // Sorumlu kişi ID (isteğe bağlı)
  assignedToName: varchar("assignedToName", { length: 255 }), // Sorumlu kişi adı
  priority: mysqlEnum("priority", ["Yüksek", "Orta", "Düşük"]).default("Orta").notNull(), // Öncelik
  status: mysqlEnum("status", ["Açık", "Devam Ediyor", "Tamamlandı", "İptal"]).default("Açık").notNull(), // Aksiyon durumu
  completionNotes: text("completionNotes"), // Tamamlama notları
  completedAt: timestamp("completedAt"), // Tamamlanma tarihi
  completedBy: int("completedBy"), // Tamamlayan kişi ID
  approved: tinyint("approved"), // Aksiyon onayı mı? (1=Evet, 0=Hayır, null=Belirsiz)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InspectionAction = typeof inspectionActions.$inferSelect;
export type InsertInspectionAction = typeof inspectionActions.$inferInsert;



/**
 * Kritik Sorular - Saha denetiminde kritik olarak işaretlenen sorular
 * Admin tarafından her kritik soru için kategori ve puan düşümü tanımlanır
 */
export const criticalQuestions = mysqlTable("critical_questions", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("questionId").notNull().unique(), // Soru ID (inspection_questions tablosundan)
  questionText: text("questionText").notNull(), // Soru metni (referans için)
  category: varchar("category", { length: 255 }).notNull(), // Kategori (Hijyen, Güvenlik, vb - admin tarafından tanımlanır)
  penaltyPoints: int("penaltyPoints").notNull().default(0), // Puan düşümü (Hayır cevabı verilirse bu kadar puan düşer)
  description: text("description"), // Açıklama (neden kritik olduğu)
  isActive: boolean("isActive").default(true).notNull(), // Aktif mi?
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CriticalQuestion = typeof criticalQuestions.$inferSelect;
export type InsertCriticalQuestion = typeof criticalQuestions.$inferInsert;


/**
 * Denetim Değerlendirme Skalası - Puan aralıklarına göre değerlendirme
 */
export const inspectionEvaluationScale = mysqlTable("inspection_evaluation_scale", {
  id: int("id").autoincrement().primaryKey(),
  minScore: int("minScore").notNull(), // Minimum puan (örn: 79)
  maxScore: int("maxScore"), // Maksimum puan (örn: 85, null = sınırsız)
  label: varchar("label", { length: 100 }).notNull(), // Değerlendirme etiketi (Başarısız, Geliştirilebilir, vb)
  description: text("description"), // Açıklama
  color: varchar("color", { length: 20 }), // Renk kodu (UI için)
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InspectionEvaluationScale = typeof inspectionEvaluationScale.$inferSelect;
export type InsertInspectionEvaluationScale = typeof inspectionEvaluationScale.$inferInsert;

/**
 * Denetçi Genel Değerlendirmesi - Her denetim için genel açıklama
 */
export const inspectorGeneralEvaluation = mysqlTable("inspector_general_evaluation", {
  id: int("id").autoincrement().primaryKey(),
  fieldInspectionId: int("fieldInspectionId").notNull(), // Saha Denetimi ID
  evaluationScaleId: int("evaluationScaleId"), // Denetim Değerlendirme Skalası ID
  generalComments: longtext("generalComments"), // Denetçi genel açıklaması
  strengths: longtext("strengths"), // Güçlü yönler
  improvements: longtext("improvements"), // İyileştirilmesi gereken alanlar
  recommendations: longtext("recommendations"), // Öneriler
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InspectorGeneralEvaluation = typeof inspectorGeneralEvaluation.$inferSelect;
export type InsertInspectorGeneralEvaluation = typeof inspectorGeneralEvaluation.$inferInsert;

/**
 * Login Denemesi Günlüğü - Başarısız login denemelerini takip et
 */
export const loginAttempts = mysqlTable("login_attempts", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 100 }).notNull(), // Kullanıcı adı
  ipAddress: varchar("ipAddress", { length: 45 }), // IP adresi
  success: boolean("success").default(false).notNull(), // Başarılı mı?
  attemptTime: timestamp("attemptTime").defaultNow().notNull(), // Deneme zamanı
  userAgent: text("userAgent"), // User-Agent
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type InsertLoginAttempt = typeof loginAttempts.$inferInsert;
