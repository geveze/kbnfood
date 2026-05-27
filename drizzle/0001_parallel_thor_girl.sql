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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kpi_targets_id` PRIMARY KEY(`id`)
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
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','region_manager') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `branchId` int;