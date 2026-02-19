-- Submission messages: real-time chat between teacher/parent and student on a submission

CREATE TABLE submission_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_submission_messages_sub_created
  ON submission_messages(submission_id, created_at);

ALTER TABLE submission_messages ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER helpers to break RLS recursion when checking submission ownership

CREATE OR REPLACE FUNCTION get_submission_student_user_id(p_submission_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT sp.user_id
  FROM submissions s
  JOIN assignments a ON a.id = s.assignment_id
  JOIN student_profiles sp ON sp.id = a.student_id
  WHERE s.id = p_submission_id;
$$;

CREATE OR REPLACE FUNCTION get_submission_student_profile_id(p_submission_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT a.student_id
  FROM submissions s
  JOIN assignments a ON a.id = s.assignment_id
  WHERE s.id = p_submission_id;
$$;

-- SELECT: student who owns the submission can see messages
CREATE POLICY "Students see own submission messages"
  ON submission_messages FOR SELECT
  USING (
    get_submission_student_user_id(submission_id) = auth.uid()
  );

-- SELECT: parent/teacher linked to the student can see messages
CREATE POLICY "Parents/teachers see linked submission messages"
  ON submission_messages FOR SELECT
  USING (
    get_submission_student_profile_id(submission_id) IN (
      SELECT student_id FROM parent_student_links WHERE parent_id = auth.uid()
    )
  );

-- INSERT: sender must be auth.uid() and must be either the owning student or a linked parent/teacher
CREATE POLICY "Authorized users can send submission messages"
  ON submission_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      -- student who owns the submission
      get_submission_student_user_id(submission_id) = auth.uid()
      OR
      -- parent/teacher linked to the student
      get_submission_student_profile_id(submission_id) IN (
        SELECT student_id FROM parent_student_links WHERE parent_id = auth.uid()
      )
    )
  );

-- Enable Supabase Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE submission_messages;
