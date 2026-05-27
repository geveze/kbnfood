DROP TABLE `branches`;--> statement-breakpoint
DROP TABLE `bulk_upload_history`;--> statement-breakpoint
DROP TABLE `customer_metrics`;--> statement-breakpoint
DROP TABLE `evaluation_periods_used`;--> statement-breakpoint
DROP TABLE `financial_metrics`;--> statement-breakpoint
DROP TABLE `hr_metrics`;--> statement-breakpoint
DROP TABLE `kpi_target_cards_detail`;--> statement-breakpoint
DROP TABLE `kpi_targets`;--> statement-breakpoint
DROP TABLE `login_attempts`;--> statement-breakpoint
DROP TABLE `open_pif_evaluations`;--> statement-breakpoint
DROP TABLE `performance_data`;--> statement-breakpoint
DROP TABLE `performance_evaluation_items`;--> statement-breakpoint
DROP TABLE `performance_evaluations`;--> statement-breakpoint
DROP TABLE `periods`;--> statement-breakpoint
DROP TABLE `position_categories`;--> statement-breakpoint
DROP TABLE `position_questions`;--> statement-breakpoint
DROP TABLE `positions`;--> statement-breakpoint
DROP TABLE `reports`;--> statement-breakpoint
DROP TABLE `user_sessions`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_username_unique`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `username`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `passwordHash`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `branchId`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `branchManager`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `isActive`;