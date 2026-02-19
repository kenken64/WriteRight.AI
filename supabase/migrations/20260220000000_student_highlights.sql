-- Student text highlights on submission OCR text with color coding

CREATE TYPE highlight_color AS ENUM ('yellow', 'green', 'blue', 'pink', 'orange');

CREATE TABLE student_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  highlighted_text TEXT NOT NULL CHECK (char_length(highlighted_text) BETWEEN 1 AND 5000),
  color highlight_color NOT NULL DEFAULT 'yellow',
  occurrence_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Prevent duplicate highlights on the same text occurrence
ALTER TABLE student_highlights
  ADD CONSTRAINT student_highlights_unique_occurrence
  UNIQUE (submission_id, student_id, highlighted_text, occurrence_index);

CREATE INDEX idx_student_highlights_submission ON student_highlights(submission_id);
CREATE INDEX idx_student_highlights_student ON student_highlights(student_id);

CREATE TRIGGER student_highlights_updated_at
  BEFORE UPDATE ON student_highlights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE student_highlights ENABLE ROW LEVEL SECURITY;

-- Students can see their own highlights only
CREATE POLICY "Students see own highlights"
  ON student_highlights FOR SELECT
  USING (student_id IN (SELECT get_my_student_profile_ids()));

-- Students can create their own highlights only
CREATE POLICY "Students can create own highlights"
  ON student_highlights FOR INSERT
  WITH CHECK (student_id IN (SELECT get_my_student_profile_ids()));

-- Students can update their own highlights only
CREATE POLICY "Students can update own highlights"
  ON student_highlights FOR UPDATE
  USING (student_id IN (SELECT get_my_student_profile_ids()));

-- Students can delete their own highlights only
CREATE POLICY "Students can delete own highlights"
  ON student_highlights FOR DELETE
  USING (student_id IN (SELECT get_my_student_profile_ids()));
