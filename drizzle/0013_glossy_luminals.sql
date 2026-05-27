ALTER TABLE `field_inspections` MODIFY COLUMN `totalScore` decimal(5,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `field_inspection_answers` ADD `point_deduction` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `field_inspection_questions` ADD `pointDeduction` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `field_inspections` ADD `restaurantManagerName` varchar(255);--> statement-breakpoint
ALTER TABLE `field_inspections` ADD `generalAssessment` text;--> statement-breakpoint
ALTER TABLE `field_inspection_answers` DROP COLUMN `penaltyPoints`;--> statement-breakpoint
ALTER TABLE `field_inspection_questions` DROP COLUMN `penaltyPoints`;