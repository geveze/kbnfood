ALTER TABLE `field_inspections` MODIFY COLUMN `pdfUrl` varchar(500) DEFAULT null;--> statement-breakpoint
ALTER TABLE `field_inspections` ADD `createdAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `field_inspections` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;