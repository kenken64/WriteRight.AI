-- Add ocr_image_urls column to submissions for permanent OCR image references
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ocr_image_urls TEXT[] DEFAULT '{}';

-- Create dedicated ocr-images bucket (public read for display)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ocr-images', 'ocr-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to ocr-images bucket
CREATE POLICY "Authenticated users can upload ocr images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ocr-images');

-- Allow public read access to ocr-images
CREATE POLICY "Public read access for ocr images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'ocr-images');

-- Allow service role full access
CREATE POLICY "Service role full access ocr images"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'ocr-images');
