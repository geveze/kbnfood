CREATE TABLE `branches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(50),
	`region` varchar(255),
	`manager` varchar(255),
	`regionManagerId` int,
	`address` text,
	`phone` varchar(20),
	`evaluationPeriod` varchar(50),
	`status` enum('active','inactive'),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `openPifEvaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int,
	`employeeName` varchar(255),
	`employeePosition` varchar(255),
	`employeeIdNumber` varchar(50),
	`hireDate` timestamp,
	`evaluationDate` timestamp,
	`evaluationPeriod` varchar(50),
	`evaluatedByManager` varchar(255),
	`items` json,
	`scoreExplanations` json,
	`managerOpinion` text,
	`totalScore` int,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `openPifEvaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `position_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`positionId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`order` int DEFAULT 0,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `position_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `position_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`questionText` text NOT NULL,
	`questionNumber` int,
	`order` int DEFAULT 0,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `position_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
