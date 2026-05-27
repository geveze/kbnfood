-- Apply schema changes first
ALTER TABLE `position_questions` MODIFY COLUMN `questionNumber` int NOT NULL;
ALTER TABLE `positions` ADD COLUMN IF NOT EXISTS `displayName` varchar(255);
ALTER TABLE `positions` ADD COLUMN IF NOT EXISTS `isActive` boolean DEFAULT true;

-- Clear existing data to avoid duplicates
DELETE FROM position_questions WHERE id > 0;
DELETE FROM position_categories WHERE id > 0;
DELETE FROM positions WHERE id > 0;

-- Insert positions data
INSERT INTO positions (id, name, displayName, description, isActive, createdAt, updatedAt) VALUES
(5,'SERVIS','Servis','',1,'2026-03-17 14:17:48','2026-03-17 14:17:48'),
(6,'RESTORAN_YONETIMI','Restoran Yönetimi','',1,'2026-03-17 14:17:48','2026-03-17 14:17:48'),
(7,'IZGARA_YONETICI','Izgara Yöneticisi','',1,'2026-03-17 14:17:48','2026-03-17 14:17:48'),
(8,'KASA','Kasa','',1,'2026-03-17 14:17:48','2026-03-17 14:17:48'),
(90002,'IZGARA','IZGARA','',1,'2026-03-18 05:21:19','2026-03-18 05:21:19');

-- Insert position_categories data
INSERT INTO position_categories (id, positionId, name, `order`, createdAt, updatedAt) VALUES
(150002,4,'Görev Bilinci',0,'2026-03-24 05:55:18','2026-03-24 05:55:18'),
(150003,4,'İletişim Becerisi',1,'2026-03-24 05:55:19','2026-03-24 05:55:19'),
(150004,4,'Analitik Düşünme ve Problem Çözme',2,'2026-03-24 05:55:34','2026-03-24 05:55:34'),
(150005,4,'Kalite Odaklılık',3,'2026-03-24 05:55:35','2026-03-24 05:55:35'),
(150006,4,'Takım Çalışması ve İşbirliği',4,'2026-03-24 05:55:47','2026-03-24 05:55:47'),
(150007,4,'Müşteri Odaklılık',5,'2026-03-24 05:55:49','2026-03-24 05:55:49'),
(150008,4,'Ticari Bakış',6,'2026-03-24 05:56:03','2026-03-24 05:56:03'),
(150009,4,'Planlama ve Organize Etme',7,'2026-03-24 05:56:04','2026-03-24 05:56:04'),
(150010,4,'İş Disiplini ve Tutum',8,'2026-03-24 05:56:05','2026-03-24 05:56:05'),
(150011,4,'Kasa',9,'2026-03-24 05:56:18','2026-03-24 05:56:18'),
(150012,8,'Görev Bilinci',0,'2026-03-24 06:01:58','2026-03-24 06:01:58'),
(150013,8,'İletişim Becerisi',1,'2026-03-24 06:01:58','2026-03-24 06:01:58'),
(150014,8,'Analitik Düşünme ve Problem Çözme',2,'2026-03-24 06:01:58','2026-03-24 06:01:58'),
(150015,8,'Kalite Odaklılık',3,'2026-03-24 06:01:58','2026-03-24 06:01:58'),
(150016,8,'Takım Çalışması ve İşbirliği',4,'2026-03-24 06:01:59','2026-03-24 06:01:59'),
(150017,8,'Müşteri Odaklılık',5,'2026-03-24 06:01:59','2026-03-24 06:01:59'),
(150018,8,'Ticari Bakış',6,'2026-03-24 06:01:59','2026-03-24 06:01:59'),
(150019,8,'Planlama ve Organize Etme',7,'2026-03-24 06:01:59','2026-03-24 06:01:59'),
(150020,8,'İş Disiplini ve Tutum',8,'2026-03-24 06:01:59','2026-03-24 06:01:59'),
(150021,8,'Kasa',9,'2026-03-24 06:02:00','2026-03-24 06:02:00'),
(150042,5,'Görev Bilinci',1,'2026-03-24 06:11:17','2026-03-24 06:11:17'),
(150043,5,'İletişim Becerisi',2,'2026-03-24 06:11:18','2026-03-24 06:11:18'),
(150044,5,'Analitik Düşünme ve Problem Çözme',3,'2026-03-24 06:11:18','2026-03-24 06:11:18'),
(150045,5,'Kalite Odaklılık',4,'2026-03-24 06:11:18','2026-03-24 06:11:18'),
(150046,5,'Takım Çalışması ve İşbirliği',5,'2026-03-24 06:11:18','2026-03-24 06:11:18'),
(150047,5,'Müşteri Odaklılık',6,'2026-03-24 06:11:19','2026-03-24 06:11:19'),
(150048,5,'Ticari Bakış',7,'2026-03-24 06:11:19','2026-03-24 06:11:19'),
(150049,5,'Planlama ve Organize Etme',8,'2026-03-24 06:11:19','2026-03-24 06:11:19'),
(150050,5,'İş Disiplini ve Tutum',9,'2026-03-24 06:11:19','2026-03-24 06:11:19'),
(150051,5,'Servis',10,'2026-03-24 06:11:19','2026-03-31 06:02:58'),
(240002,90002,'Görev Bilinci',1,'2026-04-03 05:25:14','2026-04-03 05:25:14'),
(240003,90002,'İletişim Becerisi',2,'2026-04-03 05:25:14','2026-04-03 05:25:14'),
(240004,90002,'Analitik Düşünme ve Problem Çözme',3,'2026-04-03 05:25:15','2026-04-03 05:25:15'),
(240005,90002,'Kalite Odaklılık',4,'2026-04-03 05:25:15','2026-04-03 05:25:15'),
(240006,90002,'Takım Çalışması ve İşbirliği',5,'2026-04-03 05:25:15','2026-04-03 05:25:15'),
(240007,90002,'Yönetim Becerileri ',6,'2026-04-03 05:25:15','2026-04-03 05:25:15'),
(240008,90002,'İş Disiplini ve Tutum',7,'2026-04-03 05:25:16','2026-04-03 05:25:16'),
(240009,90002,'Ürün Kalitesi ve Standartlara Uyum',8,'2026-04-03 05:25:16','2026-04-03 05:25:16'),
(240010,90002,'Gıda Güvenliği ve Hijyen',9,'2026-04-03 05:25:17','2026-04-03 05:25:17'),
(240011,90002,'İstasyon Yönetimi',10,'2026-04-03 05:25:17','2026-04-03 05:25:17'),
(240012,7,'Görev Bilinci',1,'2026-04-03 05:25:17','2026-04-03 05:25:17'),
(240013,7,'İletişim Becerisi',2,'2026-04-03 05:25:18','2026-04-03 05:25:18'),
(240014,7,'Analitik Düşünme ve Problem Çözme',3,'2026-04-03 05:25:18','2026-04-03 05:25:18'),
(240015,7,'Kalite Odaklılık',4,'2026-04-03 05:25:18','2026-04-03 05:25:18'),
(240016,7,'Takım Çalışması ve İşbirliği',5,'2026-04-03 05:25:18','2026-04-03 05:25:18'),
(240017,7,'Yönetim Becerileri ',6,'2026-04-03 05:25:19','2026-04-03 05:25:19'),
(240018,7,'İş Disiplini ve Tutum',7,'2026-04-03 05:25:19','2026-04-03 05:25:19'),
(240019,7,'Ürün Kalitesi ve Standartlara Uyum',8,'2026-04-03 05:25:20','2026-04-03 05:25:20'),
(240020,7,'Gıda Güvenliği ve Hijyen',9,'2026-04-03 05:25:20','2026-04-03 05:25:20'),
(240021,7,'İstasyon Yönetimi',10,'2026-04-03 05:25:21','2026-04-03 05:25:21'),
(270015,6,'Görev Bilinci',0,'2026-04-03 10:26:18','2026-04-03 10:26:18'),
(270016,6,'İletişim Becerisi',0,'2026-04-03 10:26:20','2026-04-03 10:26:20'),
(270017,6,'Analitik Düşünme ve Problem Çözme',0,'2026-04-03 10:26:21','2026-04-03 10:26:21'),
(270018,6,'Kalite Odaklılık',0,'2026-04-03 10:26:22','2026-04-03 10:26:22'),
(270019,6,'Takım Çalışması ve İşbirliği',0,'2026-04-03 10:26:24','2026-04-03 10:26:24'),
(270020,6,'Yönetim Becerileri',0,'2026-04-03 10:26:25','2026-04-03 10:26:25'),
(270021,6,'İş Disiplini ve Tutum',0,'2026-04-03 10:26:28','2026-04-03 10:26:28'),
(270022,6,'Restoran Yönetimi',0,'2026-04-03 10:26:29','2026-04-03 10:26:29');

-- Insert position_questions data (sample - first 10 rows for brevity)
INSERT INTO position_questions (id, categoryId, questionNumber, questionText, `order`, createdAt, updatedAt) VALUES
(150102,150012,1,'Yaptığı işi en iyi şekilde yapar. İş disiplini ve görev bilinci yüksektir.',1,'2026-03-24 06:02:25','2026-03-24 06:02:25'),
(150103,150012,2,'Sorumluluğundaki işleri, şirket kural ve prosedürlerine uygun bir biçimde gerçekleştirir.',2,'2026-03-24 06:02:25','2026-03-24 06:02:25'),
(150104,150012,3,'İşine, kuruma ve kendisine sunulan kaynaklara zarar verecek hiçbir davranış sergilemez.',3,'2026-03-24 06:02:25','2026-03-24 06:02:25'),
(150105,150012,4,'Ahlaki ve etik değerlere uygun davranır.',4,'2026-03-24 06:02:25','2026-03-24 06:02:25'),
(150106,150013,6,'Karşındakini dinler ve verilmek istenen mesajı doğru bir şekilde anlar.',1,'2026-03-24 06:02:26','2026-03-24 06:02:26'),
(150107,150013,7,'Söylemek istediklerini, açık, kısa ve net bir biçimde karşı tarafa aktarır. ',2,'2026-03-24 06:02:26','2026-03-24 06:02:26'),
(150108,150013,8,'İşle ilgili konularla ilgili bilgiyi zamanında aktarır ve paylaşır.',3,'2026-03-24 06:02:26','2026-03-24 06:02:26'),
(150109,150013,9,'Her türlü iletişimde empati kurmaya özen gösterir.',4,'2026-03-24 06:02:26','2026-03-24 06:02:26'),
(150110,150014,11,'Gelişmekte olan problemleri görür, önleyici davranış geliştirir.',1,'2026-03-24 06:02:26','2026-03-24 06:02:26'),
(150111,150014,12,'Durum ve problem karşısında alacağı hareketin sonucunu bilir. ',2,'2026-03-24 06:02:27','2026-03-24 06:02:27');
