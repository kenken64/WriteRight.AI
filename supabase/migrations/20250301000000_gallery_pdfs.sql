-- Add gallery_pdf_ref column to submissions for cached PDF downloads
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS gallery_pdf_ref TEXT;

-- Create the gallery-pdfs storage bucket for generated PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-pdfs', 'gallery-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read gallery PDFs
CREATE POLICY "Authenticated users can read gallery PDFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'gallery-pdfs');

-- Allow authenticated users to upload gallery PDFs
CREATE POLICY "Authenticated users can insert gallery PDFs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'gallery-pdfs');
