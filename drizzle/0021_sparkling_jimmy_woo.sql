DROP TABLE `evaluation_periods_used`;--> statement-breakpoint
DROP TABLE `login_attempts`;--> statement-breakpoint
DROP TABLE `open_pif_evaluations`;--> statement-breakpoint
DROP TABLE `performance_evaluation_items`;--> statement-breakpoint
DROP TABLE `position_categories`;--> statement-breakpoint
DROP TABLE `position_questions`;--> statement-breakpoint
DROP TABLE `positions`;--> statement-breakpoint
DROP TABLE `probation_evaluation_criteria`;--> statement-breakpoint
DROP TABLE `probation_evaluations`;--> statement-breakpoint
ALTER TABLE `performance_evaluations` MODIFY COLUMN `hireDate` varchar(50);--> statement-breakpoint
ALTER TABLE `performance_evaluations` ADD `employeeTCNumber` varchar(11) NOT NULL;--> statement-breakpoint
ALTER TABLE `performance_evaluations` ADD `employeeRegistrationNumber` varchar(50);--> statement-breakpoint
ALTER TABLE `performance_evaluations` ADD `branch` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `performance_evaluations` ADD `department` varchar(255);--> statement-breakpoint
ALTER TABLE `performance_evaluations` ADD `evaluationType` enum('1.5_months','5.5_months') NOT NULL;--> statement-breakpoint
ALTER TABLE `performance_evaluations` ADD `evaluationMonth` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `performance_evaluations` ADD `scores` json;--> statement-breakpoint
ALTER TABLE `performance_evaluations` ADD `successPercentage` decimal(5,2);--> statement-breakpoint
ALTER TABLE `performance_evaluations` ADD `continueEmployment` boolean;--> statement-breakpoint
ALTER TABLE `performance_evaluations` ADD `overallComments` text;--> statement-breakpoint
ALTER TABLE `performance_evaluations` ADD `evaluatedBy` varchar(255);--> statement-breakpoint
ALTER TABLE `performance_evaluations` ADD `evaluatedBySecond` varchar(255);--> statement-breakpoint
ALTER TABLE `performance_evaluations` ADD `hrReviewedBy` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `branchName` varchar(255);--> statement-breakpoint
ALTER TABLE `performance_evaluations` ADD CONSTRAINT `performance_evaluations_employeeTCNumber_unique` UNIQUE(`employeeTCNumber`);--> statement-breakpoint
ALTER TABLE `kpi_target_cards_detail` DROP COLUMN `weightedScore`;--> statement-breakpoint
ALTER TABLE `performance_evaluations` DROP COLUMN `branchId`;--> statement-breakpoint
ALTER TABLE `performance_evaluations` DROP COLUMN `evaluationPeriod`;--> statement-breakpoint
ALTER TABLE `performance_evaluations` DROP COLUMN `employeePosition`;--> statement-breakpoint
ALTER TABLE `performance_evaluations` DROP COLUMN `employeeIdNumber`;--> statement-breakpoint
ALTER TABLE `performance_evaluations` DROP COLUMN `evaluationDate`;--> statement-breakpoint
ALTER TABLE `performance_evaluations` DROP COLUMN `evaluatedByManager`;--> statement-breakpoint
ALTER TABLE `performance_evaluations` DROP COLUMN `managerOpinion`;--> statement-breakpoint
ALTER TABLE `performance_evaluations` DROP COLUMN `totalScore`;--> statement-breakpoint
ALTER TABLE `performance_evaluations` DROP COLUMN `evaluationScale`;