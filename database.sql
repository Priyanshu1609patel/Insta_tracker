-- ============================================================
-- Instagram Reel View Tracking & Client Billing System
-- Supabase / PostgreSQL Database Schema
-- Paste this entire file in Supabase SQL Editor and RUN
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE (for Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- CLIENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  rate_per_view DECIMAL(10, 6) NOT NULL DEFAULT 0.01,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- REELS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  reel_url TEXT NOT NULL,
  views BIGINT DEFAULT 0,
  title VARCHAR(500),
  thumbnail_url TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- VIEW HISTORY TABLE (for growth charts)
-- ============================================================
CREATE TABLE IF NOT EXISTS view_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reel_id UUID NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
  views BIGINT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- SYNC LOGS TABLE (track scraping jobs)
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reel_id UUID REFERENCES reels(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL,
  message TEXT,
  views_before BIGINT,
  views_after BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_reels_client_id ON reels(client_id);
CREATE INDEX IF NOT EXISTS idx_view_history_reel_id ON view_history(reel_id);
CREATE INDEX IF NOT EXISTS idx_view_history_recorded_at ON view_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_sync_logs_reel_id ON sync_logs(reel_id);

-- ============================================================
-- UPDATED_AT auto-update trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Optional but recommended
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE view_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations (since we handle auth in backend with JWT)
-- These policies allow backend service role to access everything
CREATE POLICY "Allow all for service role" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON reels FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON view_history FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON sync_logs FOR ALL USING (true);

-- ============================================================
-- SAMPLE DATA (Optional - remove if not needed)
-- ============================================================
-- INSERT INTO users (name, email, password_hash) VALUES
--   ('Admin User', 'admin@example.com', 'bcrypt_hash_here');

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- Client summary view
CREATE OR REPLACE VIEW client_summary AS
SELECT
  c.id,
  c.user_id,
  c.name,
  c.rate_per_view,
  c.created_at,
  COUNT(r.id) AS total_reels,
  COALESCE(SUM(r.views), 0) AS total_views,
  COALESCE(SUM(r.views * c.rate_per_view), 0) AS total_earnings
FROM clients c
LEFT JOIN reels r ON r.client_id = c.id
GROUP BY c.id, c.user_id, c.name, c.rate_per_view, c.created_at;

-- Reel earnings view
CREATE OR REPLACE VIEW reel_earnings AS
SELECT
  r.id,
  r.client_id,
  c.name AS client_name,
  c.rate_per_view,
  r.reel_url,
  r.views,
  r.title,
  r.status,
  r.created_at,
  r.last_updated,
  (r.views * c.rate_per_view) AS earnings
FROM reels r
JOIN clients c ON c.id = r.client_id;

-- ============================================================
-- MIGRATION: Client user role support (run if upgrading existing DB)
-- ============================================================

-- Add client_id (which client this user belongs to — only set for client_user role)
ALTER TABLE users ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Add created_by (which creator created this user — only set for client_user role)
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================
-- MIGRATION: Admin role support (run if upgrading existing DB)
-- ============================================================

-- 1. Change default role from 'admin' to 'creator' for all new registrations
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'creator';

-- 2. Update existing non-admin users to role 'creator'
--    (skip admin@gmail.com which is seeded by the backend on startup)
UPDATE users SET role = 'creator' WHERE email != 'admin@gmail.com';

-- ============================================================
-- MIGRATION: Instagram session tracking
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS ig_session_saved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ig_session_id TEXT;

-- ============================================================
-- MIGRATION: Tiered rate pricing (Option A — highest matching tier wins)
-- ============================================================

-- Add rate_tiers column to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rate_tiers JSONB DEFAULT '[]'::jsonb;

-- Function: returns earnings using highest matched tier, falls back to base rate_per_view
CREATE OR REPLACE FUNCTION calculate_earnings(p_views BIGINT, p_base_rate DECIMAL, p_tiers JSONB)
RETURNS DECIMAL AS $$
DECLARE
  v_tier           JSONB;
  v_tier_min       BIGINT;
  v_best_rate      DECIMAL := p_base_rate;
  v_best_min       BIGINT  := -1;
BEGIN
  IF p_tiers IS NOT NULL AND jsonb_array_length(p_tiers) > 0 THEN
    FOR v_tier IN SELECT * FROM jsonb_array_elements(p_tiers)
    LOOP
      v_tier_min := (v_tier->>'min_views')::BIGINT;
      IF p_views >= v_tier_min AND v_tier_min > v_best_min THEN
        v_best_min  := v_tier_min;
        v_best_rate := (v_tier->>'rate_inr_per_view')::DECIMAL;
      END IF;
    END LOOP;
  END IF;
  RETURN p_views * v_best_rate;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Rebuild reel_earnings view to use tiered calculation
CREATE OR REPLACE VIEW reel_earnings AS
SELECT
  r.id,
  r.client_id,
  c.name          AS client_name,
  c.rate_per_view,
  c.rate_tiers,
  r.reel_url,
  r.views,
  r.title,
  r.status,
  r.created_at,
  r.last_updated,
  calculate_earnings(r.views, c.rate_per_view, c.rate_tiers) AS earnings
FROM reels r
JOIN clients c ON c.id = r.client_id;

-- Rebuild client_summary view to use tiered calculation
CREATE OR REPLACE VIEW client_summary AS
SELECT
  c.id,
  c.user_id,
  c.name,
  c.rate_per_view,
  c.rate_tiers,
  c.description,
  c.created_at,
  COUNT(r.id)                                                                        AS total_reels,
  COALESCE(SUM(r.views), 0)                                                          AS total_views,
  COALESCE(SUM(calculate_earnings(r.views, c.rate_per_view, c.rate_tiers)), 0)       AS total_earnings
FROM clients c
LEFT JOIN reels r ON r.client_id = c.id
GROUP BY c.id, c.user_id, c.name, c.rate_per_view, c.rate_tiers, c.description, c.created_at;

-- ============================================================
-- DONE! Your database is ready.
-- ============================================================
