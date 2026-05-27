CREATE TABLE `login_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(100) NOT NULL,
	`ipAddress` varchar(45),
	`success` boolean NOT NULL DEFAULT false,
	`attemptTime` timestamp NOT NULL DEFAULT (now()),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `login_attempts_id` PRIMARY KEY(`id`)
);
