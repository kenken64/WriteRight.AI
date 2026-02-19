ALTER TABLE student_highlights
  ADD COLUMN note_id UUID REFERENCES student_notes(id) ON DELETE SET NULL;

CREATE INDEX idx_student_highlights_note ON student_highlights(note_id);
