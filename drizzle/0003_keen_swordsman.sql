CREATE TABLE `inspection_evaluation_scale` (
	`id` int AUTO_INCREMENT NOT NULL,
	`minScore` int NOT NULL,
	`maxScore` int,
	`label` varchar(100) NOT NULL,
	`description` text,
	`color` varchar(20),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspection_evaluation_scale_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inspector_general_evaluation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fieldInspectionId` int NOT NULL,
	`evaluationScaleId` int,
	`generalComments` longtext,
	`strengths` longtext,
	`improvements` longtext,
	`recommendations` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspector_general_evaluation_id` PRIMARY KEY(`id`)
);
