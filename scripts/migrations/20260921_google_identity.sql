-- Google Identity Services account links for AniPins' existing users/sessions.
-- This table deliberately stores only Google's stable `sub`, never Google access tokens.
CREATE TABLE IF NOT EXISTS auth_identities (
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL DEFAULT '',
  created_at BIGINT NOT NULL,
  PRIMARY KEY (provider, provider_subject),
  UNIQUE (provider, user_id)
);

CREATE INDEX IF NOT EXISTS idx_auth_identities_user ON auth_identities(user_id);
ALTER TABLE public.auth_identities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.auth_identities FROM anon, authenticated;
