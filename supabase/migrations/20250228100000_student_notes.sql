-- Student correction notes on submissions with priority levels and done-tracking

CREATE TYPE note_priority AS ENUM ('high', 'medium', 'low');

CREATE TABLE student_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  priority note_priority DEFAULT 'medium',
  is_done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_student_notes_submission ON student_notes(submission_id);
CREATE INDEX idx_student_notes_student ON student_notes(student_id);

CREATE TRIGGER student_notes_updated_at
  BEFORE UPDATE ON student_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

-- Students can see their own notes only
CREATE POLICY "Students see own notes"
  ON student_notes FOR SELECT
  USING (student_id IN (SELECT get_my_student_profile_ids()));

-- Students can create their own notes only
CREATE POLICY "Students can create own notes"
  ON student_notes FOR INSERT
  WITH CHECK (student_id IN (SELECT get_my_student_profile_ids()));

-- Students can update their own notes only
CREATE POLICY "Students can update own notes"
  ON student_notes FOR UPDATE
  USING (student_id IN (SELECT get_my_student_profile_ids()));

-- Students can delete their own notes only
CREATE POLICY "Students can delete own notes"
  ON student_notes FOR DELETE
  USING (student_id IN (SELECT get_my_student_profile_ids()));
