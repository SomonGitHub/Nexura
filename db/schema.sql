-- Nexura D1 Schema (SQLite)
-- For Cloudflare D1 Database

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY, -- User UUID from Supabase Auth
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  tier TEXT DEFAULT 'free',
  dashboard_config TEXT DEFAULT '[]', -- JSON string
  ha_url TEXT,
  ha_token_enc TEXT,
  ha_entity_energy TEXT,
  theme TEXT DEFAULT 'default',
  tuya_client_id TEXT,
  tuya_secret_enc TEXT,
  tuya_region TEXT,
  xiaomi_user TEXT,
  xiaomi_password_enc TEXT,
  xiaomi_region TEXT
);

-- 2. Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  PRIMARY KEY (id, user_id)
);

-- 3. Entities table
CREATE TABLE IF NOT EXISTS entities (
  haid TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT,
  type TEXT,
  variant TEXT,
  roomid TEXT,
  PRIMARY KEY (haid, user_id)
);
