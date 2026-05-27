ALTER TABLE `position_questions` MODIFY COLUMN `questionNumber` int NOT NULL;--> statement-breakpoint
ALTER TABLE `positions` ADD `displayName` varchar(255);--> statement-breakpoint
ALTER TABLE `positions` ADD `isActive` boolean DEFAULT true;