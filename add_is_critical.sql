-- Add isCritical column to field_inspection_questions table
ALTER TABLE field_inspection_questions 
ADD COLUMN isCritical BOOLEAN DEFAULT FALSE AFTER maxScore;

-- Update existing rows to set isCritical based on specific question IDs
-- Kritik sorular: Soru 1, 2, 3, 4, 5 (IZGARA kategorisinden) ve diğer kritik sorular
UPDATE field_inspection_questions 
SET isCritical = TRUE 
WHERE id IN (1, 2, 3, 4, 5);
