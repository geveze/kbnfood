ALTER TABLE `field_inspections` DROP FOREIGN KEY `field_inspections_inspectorId_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `field_inspections` MODIFY COLUMN `inspectorId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `field_inspections` MODIFY COLUMN `generalAssessment` longtext;--> statement-breakpoint
ALTER TABLE `field_inspections` MODIFY COLUMN `pdfUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `branches` ADD `branchEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `field_inspections` ADD `additionalEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `field_inspections` DROP COLUMN `createdAt`;--> statement-breakpoint
ALTER TABLE `field_inspections` DROP COLUMN `updatedAt`;