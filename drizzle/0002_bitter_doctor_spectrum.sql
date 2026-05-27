CREATE TABLE `critical_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questionId` int NOT NULL,
	`questionText` text NOT NULL,
	`category` varchar(255) NOT NULL,
	`penaltyPoints` int NOT NULL DEFAULT 0,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `critical_questions_id` PRIMARY KEY(`id`),
	CONSTRAINT `critical_questions_questionId_unique` UNIQUE(`questionId`)
);
