-- Custom password reset tokens (bypasses Supabase email flow)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast token lookup
CREATE INDEX idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);

-- Auto-cleanup expired tokens (older than 24h)
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_tokens WHERE expires_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql;

-- RLS: only service role can access this table
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
-- No policies = only service_role can access (which is what we want)
