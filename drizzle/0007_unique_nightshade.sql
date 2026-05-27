CREATE TABLE `evaluation_periods_used` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`evaluationPeriod` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluation_periods_used_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_evaluation_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evaluationId` int NOT NULL,
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
