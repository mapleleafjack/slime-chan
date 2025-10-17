-- Vercel Postgres database schema for Slime-chan game
-- Run this in your Vercel Postgres database

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  last_login BIGINT NOT NULL,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Game state table (one row per user, upserted on save)
CREATE TABLE IF NOT EXISTS game_state (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  creatures JSONB NOT NULL DEFAULT '[]'::jsonb,
  active_creature_id TEXT,
  debug_time TIMESTAMP,
  last_saved BIGINT NOT NULL,
  version VARCHAR(20) NOT NULL DEFAULT '1.0',
  CONSTRAINT valid_creatures CHECK (jsonb_typeof(creatures) = 'array')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_game_state_user_id ON game_state(user_id);
CREATE INDEX IF NOT EXISTS idx_game_state_last_saved ON game_state(last_saved);

-- Optional: Add a function to update last_saved automatically
CREATE OR REPLACE FUNCTION update_last_saved()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_saved = EXTRACT(EPOCH FROM NOW())::BIGINT * 1000;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_last_saved
  BEFORE UPDATE ON game_state
  FOR EACH ROW
  EXECUTE FUNCTION update_last_saved();
