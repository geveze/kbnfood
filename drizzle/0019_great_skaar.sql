CREATE TABLE `probation_evaluation_criteria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evaluationId` int NOT NULL,
	`criteriaType` enum('criteria','competency') NOT NULL,
	`criteriaName` varchar(255) NOT NULL,
	`score` decimal(3,1),
	`scoreLabel` enum('very_good','good','expected','development_needed','insufficient'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `probation_evaluation_criteria_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `probation_evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`employeeName` varchar(255) NOT NULL,
	`department` varchar(255),
	`position` varchar(255),
	`hireDate` timestamp,
	`evaluationType` enum('1.5_months','5.5_months','9_months','annual') NOT NULL,
	`evaluationDate` timestamp NOT NULL DEFAULT (now()),
	`evaluatedBy` varchar(255),
	`evaluatedBySecond` varchar(255),
	`hrReviewedBy` varchar(255),
	`continueEmployment` boolean,
	`continueEmploymentReason` text,
	`successPercentage` decimal(5,2),
	`overallComments` text,
	`branchId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `probation_evaluations_id` PRIMARY KEY(`id`)
);
