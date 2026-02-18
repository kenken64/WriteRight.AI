-- Add band_justification JSONB column to rewrites table
-- Stores the summary and key before/after changes explaining
-- why the rewrite meets the target band criteria.

ALTER TABLE rewrites
  ADD COLUMN IF NOT EXISTS band_justification JSONB;
