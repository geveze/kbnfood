ALTER TABLE `inspection_actions` MODIFY COLUMN `assignedTo` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `inspection_actions` MODIFY COLUMN `approved` tinyint;