-- Fix: infinite recursion between student_profiles and parent_student_links RLS policies
--
-- The cycle:
--   student_profiles "Parents see linked student profiles" → queries parent_student_links
--   parent_student_links "Students see own links"          → queries student_profiles
--
-- Solution: a SECURITY DEFINER function that bypasses RLS to resolve the
-- current user's student_profile IDs, breaking the circular reference.

CREATE OR REPLACE FUNCTION get_my_student_profile_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM student_profiles WHERE user_id = auth.uid();
$$;

-- Recreate the parent_student_links policy for students using the function
DROP POLICY IF EXISTS "Students see own links" ON parent_student_links;
CREATE POLICY "Students see own links"
  ON parent_student_links FOR SELECT
  USING (student_id IN (SELECT get_my_student_profile_ids()));
