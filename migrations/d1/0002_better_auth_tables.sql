-- Better Auth's identity tables are namespaced so they cannot collide with
-- AniPins' existing users/sessions tables while the staged auth bridge is tested.
CREATE TABLE IF NOT EXISTS better_auth_user (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS better_auth_session (
  id TEXT PRIMARY KEY NOT NULL,
  expiresAt INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL REFERENCES better_auth_user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS better_auth_session_user_id_idx ON better_auth_session(userId);

CREATE TABLE IF NOT EXISTS better_auth_account (
  id TEXT PRIMARY KEY NOT NULL,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES better_auth_user(id) ON DELETE CASCADE,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt INTEGER,
  refreshTokenExpiresAt INTEGER,
  scope TEXT,
  password TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS better_auth_account_user_id_idx ON better_auth_account(userId);
CREATE UNIQUE INDEX IF NOT EXISTS better_auth_account_provider_account_idx ON better_auth_account(providerId, accountId);

CREATE TABLE IF NOT EXISTS better_auth_verification (
  id TEXT PRIMARY KEY NOT NULL,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER,
  updatedAt INTEGER
);
CREATE INDEX IF NOT EXISTS better_auth_verification_identifier_idx ON better_auth_verification(identifier);
