-- Add gallery_category column to submissions for manual category override
ALTER TABLE submissions
  ADD COLUMN gallery_category TEXT
  CHECK (gallery_category IN ('environment', 'technology', 'social_issues', 'education', 'health', 'current_affairs'));
