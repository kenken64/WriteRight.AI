-- Add parent_type column to users table
-- Allows parents to indicate if they are a parent, school teacher, or tuition centre teacher

ALTER TABLE users ADD COLUMN parent_type TEXT DEFAULT 'parent'
  CHECK (parent_type IN ('parent', 'school_teacher', 'tuition_teacher'));
