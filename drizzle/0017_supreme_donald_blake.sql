CREATE TABLE `branches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(50) NOT NULL,
	`region` varchar(255),
	`manager` varchar(255),
	`regionManagerId` int,
	`address` text,
	`phone` varchar(20),
	`evaluationPeriod` varchar(50),
	`status` enum('active','inactive') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branches_id` PRIMARY KEY(`id`),
	CONSTRAINT `branches_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
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
CREATE TABLE `evaluation_periods_used` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`evaluationPeriod` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluation_periods_used_id` PRIMARY KEY(`id`)
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
	`weightedScore` varchar(50),
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
CREATE TABLE `login_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(100),
	`ipAddress` varchar(45),
	`userAgent` text,
	`attemptTime` timestamp NOT NULL DEFAULT (now()),
	`status` enum('success','failed','blocked') NOT NULL DEFAULT 'failed',
	`reason` varchar(255),
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `login_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `open_pif_evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`positionId` int NOT NULL,
	`employeeName` varchar(255) NOT NULL,
	`employeeIdNumber` varchar(50),
	`evaluationDate` timestamp NOT NULL DEFAULT (now()),
	`evaluatedByName` varchar(255),
	`answers` json NOT NULL,
	`totalScore` decimal(5,2),
	`evaluationScale` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `open_pif_evaluations_id` PRIMARY KEY(`id`)
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
CREATE TABLE `performance_evaluation_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evaluationId` int NOT NULL,
	`positionCode` varchar(50) NOT NULL,
	`category` varchar(100) NOT NULL,
	`subcategory` varchar(100) NOT NULL,
	`itemNumber` int NOT NULL,
	`itemDescription` text NOT NULL,
	`score` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `performance_evaluation_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`evaluationPeriod` varchar(50) NOT NULL,
	`employeeName` varchar(255) NOT NULL,
	`employeePosition` varchar(255) NOT NULL,
	`employeeIdNumber` varchar(50),
	`hireDate` timestamp,
	`evaluationDate` timestamp,
	`evaluatedByManager` varchar(255),
	`managerOpinion` text,
	`totalScore` decimal(5,2),
	`evaluationScale` varchar(50),
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `performance_evaluations_id` PRIMARY KEY(`id`)
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
CREATE TABLE `position_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`positionId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `position_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `position_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`questionNumber` varchar(10) NOT NULL,
	`questionText` text NOT NULL,
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `position_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `positions_id` PRIMARY KEY(`id`),
	CONSTRAINT `positions_name_unique` UNIQUE(`name`)
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
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','branch_manager','operations_manager','region_manager') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `branchId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);