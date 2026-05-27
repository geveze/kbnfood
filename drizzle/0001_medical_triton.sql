CREATE TABLE `bulk_upload_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uploadedBy` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`recordCount` int,
	`status` enum('success','partial','failed') DEFAULT 'success',
	`errors` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bulk_upload_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`period` varchar(50) NOT NULL,
	`complaintRate` decimal(5,2),
	`googleRating` decimal(3,2),
	`marketplaceRating` decimal(3,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `field_inspection_answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inspectionId` int NOT NULL,
	`questionId` int NOT NULL,
	`answer` varchar(1) NOT NULL,
	`earnedPoints` int NOT NULL,
	`questionPoints` int NOT NULL,
	`explanation` text,
	`isCritical` boolean DEFAULT false,
	`photoUrls` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `field_inspection_answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `field_inspection_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`weight` decimal(5,2) DEFAULT '0',
	`description` text,
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `field_inspection_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `field_inspection_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`questionText` text NOT NULL,
	`points` int DEFAULT 1,
	`maxScore` int DEFAULT 5,
	`isCritical` boolean DEFAULT false,
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `field_inspection_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `field_inspections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`branchCode` varchar(50),
	`branchName` varchar(255),
	`inspectorId` int NOT NULL,
	`inspectorName` varchar(255),
	`inspectorEmail` varchar(320),
	`restaurantManagerEmail` varchar(320),
	`inspectionDate` timestamp NOT NULL,
	`totalScore` decimal(5,2) DEFAULT '0',
	`status` enum('draft','completed','sent') DEFAULT 'draft',
	`pdfUrl` varchar(500),
	CONSTRAINT `field_inspections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financial_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`period` varchar(50) NOT NULL,
	`revenue` decimal(12,2),
	`hamburgerCount` int,
	`profitability` decimal(5,2),
	`sideProductSales` decimal(12,2),
	`energyCost` decimal(12,2),
	`foodCost` decimal(12,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financial_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hr_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`period` varchar(50) NOT NULL,
	`staffCost` decimal(12,2),
	`turnoverRate` decimal(5,2),
	`trainingPerformance` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hr_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inspection_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inspectionId` int NOT NULL,
	`answerId` int NOT NULL,
	`questionId` int NOT NULL,
	`questionText` text NOT NULL,
	`branchId` int NOT NULL,
	`branchName` varchar(255) NOT NULL,
	`actionDescription` text NOT NULL,
	`actionDeadline` timestamp,
	`assignedTo` int,
	`assignedToName` varchar(255),
	`priority` enum('Yüksek','Orta','Düşük') NOT NULL DEFAULT 'Orta',
	`status` enum('Açık','Devam Ediyor','Tamamlandı','İptal') NOT NULL DEFAULT 'Açık',
	`completionNotes` text,
	`completedAt` timestamp,
	`completedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspection_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inspection_warnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`branchCode` varchar(50),
	`branchName` varchar(255),
	`questionId` int NOT NULL,
	`questionText` text NOT NULL,
	`categoryId` int,
	`categoryName` varchar(255),
	`consecutiveNoCount` int DEFAULT 3,
	`lastInspectionId` int NOT NULL,
	`lastInspectionDate` timestamp,
	`inspectorId` int,
	`inspectorEmail` varchar(320),
	`status` enum('active','resolved','dismissed') DEFAULT 'active',
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspection_warnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kpi_target_cards_detail` (
	`id` int AUTO_INCREMENT NOT NULL,
	`period` varchar(20) NOT NULL,
	`branchName` varchar(255) NOT NULL,
	`branchManager` varchar(255) NOT NULL,
	`bolgeSorumlusu` varchar(255),
	`dimension` varchar(100) NOT NULL,
	`target` varchar(255) NOT NULL,
	`targetDescription` text,
	`unit` varchar(50),
	`source` varchar(100),
	`frequency` varchar(50),
	`weight` int DEFAULT 0,
	`targetType` varchar(20),
	`lowerLimit` varchar(50),
	`targetValue` varchar(50),
	`upperLimit` varchar(50),
	`actualValue` varchar(50),
	`score` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kpi_target_cards_detail_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kpi_targets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`dimension` varchar(100) NOT NULL,
	`target` varchar(255) NOT NULL,
	`description` text,
	`unit` varchar(50),
	`frequency` varchar(50),
	`weight` decimal(5,2) DEFAULT '0',
	`lowerLimit` decimal(12,2),
	`targetValue` decimal(12,2),
	`upperLimit` decimal(12,2),
	`period` varchar(50) NOT NULL DEFAULT '2026/1',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kpi_targets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emailNotifications` boolean NOT NULL DEFAULT true,
	`smsNotifications` boolean NOT NULL DEFAULT false,
	`weeklyPlanCompleted` boolean NOT NULL DEFAULT true,
	`weeklyPlanFailed` boolean NOT NULL DEFAULT true,
	`inspectionResults` boolean NOT NULL DEFAULT true,
	`performanceAlerts` boolean NOT NULL DEFAULT true,
	`systemUpdates` boolean NOT NULL DEFAULT false,
	`phoneNumber` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `performance_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`kpiTargetId` int NOT NULL,
	`period` varchar(50) NOT NULL,
	`actualValue` decimal(12,2) NOT NULL,
	`score` decimal(5,2),
	`status` enum('below_target','on_target','above_target'),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `performance_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeTCNumber` varchar(11) NOT NULL,
	`employeeName` varchar(255) NOT NULL,
	`branch` varchar(255) NOT NULL,
	`department` varchar(255),
	`hireDate` varchar(50),
	`evaluationType` enum('1.5_months','5.5_months') NOT NULL,
	`evaluationMonth` varchar(50) NOT NULL,
	`scores` json,
	`successPercentage` varchar(10),
	`continueEmployment` boolean,
	`continueEmploymentReason` text,
	`managerOpinion` text,
	`overallComments` text,
	`evaluatedBy` varchar(255),
	`evaluatedByDate` varchar(50),
	`evaluatedBySecond` varchar(255),
	`evaluatedBySecondDate` varchar(50),
	`hrReviewedBy` varchar(255),
	`hrReviewedByDate` varchar(50),
	`pdfUrl` text,
	`createdByUserId` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `performance_evaluations_id` PRIMARY KEY(`id`),
	CONSTRAINT `performance_evaluations_employeeTCNumber_unique` UNIQUE(`employeeTCNumber`)
);
--> statement-breakpoint
CREATE TABLE `periods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`year` int NOT NULL,
	`month` int NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `periods_id` PRIMARY KEY(`id`),
	CONSTRAINT `periods_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `positions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `probation_evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeTCNumber` varchar(11) NOT NULL,
	`employeeName` varchar(255) NOT NULL,
	`branchId` int,
	`branchName` varchar(255) NOT NULL,
	`department` varchar(255),
	`hireDate` varchar(50),
	`evaluationPeriod` enum('1.5_months','5.5_months') NOT NULL,
	`evaluationDate` varchar(50) NOT NULL,
	`criteria1Score` int,
	`criteria2Score` int,
	`criteria3Score` int,
	`criteria4Score` int,
	`criteria5Score` int,
	`criteria6Score` int,
	`criteria7Score` int,
	`criteria8Score` int,
	`criteria9Score` int,
	`criteria10Score` int,
	`criteria11Score` int,
	`criteria12Score` int,
	`criteria13Score` int,
	`criteria14Score` int,
	`criteria15Score` int,
	`competency1Score` int,
	`competency2Score` int,
	`competency3Score` int,
	`competency4Score` int,
	`totalScore` int,
	`successPercentage` decimal(5,2),
	`evaluationScale` varchar(50),
	`continueEmployment` boolean,
	`continueEmploymentReason` text,
	`managerOpinion` text,
	`overallComments` text,
	`evaluatedBy` varchar(255),
	`evaluatedByDate` varchar(50),
	`evaluatedBySecond` varchar(255),
	`evaluatedBySecondDate` varchar(50),
	`hrReviewedBy` varchar(255),
	`hrReviewedByDate` varchar(50),
	`pdfUrl` text,
	`createdByUserId` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `probation_evaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int,
	`generatedBy` int NOT NULL,
	`reportType` varchar(50) NOT NULL,
	`period` varchar(50),
	`fileUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_sessions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `visit_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`branchName` varchar(255) NOT NULL,
	`visitDate` timestamp NOT NULL,
	`visitTime` varchar(5) NOT NULL,
	`visitType` enum('Denetim','Eğitim','Ürün Tanıtımı','Sorun Çözümü','Diğer') NOT NULL,
	`visitDescription` text NOT NULL,
	`visitManagerId` int NOT NULL,
	`visitManager` varchar(255) NOT NULL,
	`status` enum('Planlandı','Gerçekleşti','İptal') NOT NULL DEFAULT 'Planlandı',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `visit_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weekly_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`branchCode` varchar(50),
	`branchName` varchar(255),
	`managerId` int NOT NULL,
	`managerName` varchar(255),
	`managerEmail` varchar(320),
	`planDate` timestamp NOT NULL,
	`planTime` varchar(5),
	`storeName` varchar(255) NOT NULL,
	`city` varchar(100) NOT NULL,
	`actionType` enum('Denetim','Eğitim','Ürün Tanıtımı','Sorun Çözümü','Diğer') NOT NULL,
	`priority` enum('Yüksek','Orta','Düşük') DEFAULT 'Orta',
	`planDescription` text,
	`status` enum('Planlandı','Tamamlandı','Kısmen','Tamamlanmadı','Ertelendi') DEFAULT 'Planlandı',
	`actualTime` varchar(5),
	`actualNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weekly_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `branches` MODIFY COLUMN `code` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `branches` MODIFY COLUMN `status` enum('active','inactive') DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `branches` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `branches` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `openPifEvaluations` MODIFY COLUMN `employeeName` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `openPifEvaluations` MODIFY COLUMN `employeePosition` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `openPifEvaluations` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `openPifEvaluations` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `position_categories` MODIFY COLUMN `order` int;--> statement-breakpoint
ALTER TABLE `position_categories` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `position_categories` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `position_questions` MODIFY COLUMN `questionNumber` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `position_questions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `position_questions` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','branch_manager','operations_manager','region_manager') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `branchId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `branchName` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `tcNumber` varchar(11);--> statement-breakpoint
ALTER TABLE `users` ADD `hireDate` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `inspectorEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `users` ADD `restaurantManagerEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `branches` ADD CONSTRAINT `branches_code_unique` UNIQUE(`code`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);