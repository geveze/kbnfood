CREATE TABLE `login_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(100),
	`ipAddress` varchar(45),
	`userAgent` text,
	`attemptTime` timestamp NOT NULL DEFAULT (now()),
	`status` enum('success','failed','blocked') NOT NULL DEFAULT 'failed',
	`reason` varchar(255),
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `login_attempts_id` PRIMARY KEY(`id`)
);
