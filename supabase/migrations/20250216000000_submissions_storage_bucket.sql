-- Create the submissions storage bucket for uploaded essay files
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to the submissions bucket
CREATE POLICY "Authenticated users can upload submissions"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'submissions');

-- Allow authenticated users to read their own uploads
CREATE POLICY "Authenticated users can read submissions"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'submissions');
