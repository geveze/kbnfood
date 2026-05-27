-- Add points column to field_inspection_questions table
ALTER TABLE `field_inspection_questions` ADD COLUMN `points` int NOT NULL DEFAULT 1 AFTER `questionText`;
