-- GI Social Analytics - Supabase Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)

-- ============================================
-- 1. RESEARCHERS TABLE
-- Stores your target AI researchers
-- ============================================
CREATE TABLE IF NOT EXISTS researchers (
  id TEXT PRIMARY KEY,
  handle TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_following BOOLEAN DEFAULT FALSE,
  likes INTEGER DEFAULT 0,
  reposts INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  last_interaction TIMESTAMPTZ,
  is_hot BOOLEAN DEFAULT FALSE,
  previous_likes INTEGER DEFAULT 0,
  previous_reposts INTEGER DEFAULT 0,
  previous_replies INTEGER DEFAULT 0,
  previous_is_following BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. NOTIFICATIONS_LOG TABLE
-- Stores hashes of processed notifications for deduplication
-- ============================================
CREATE TABLE IF NOT EXISTS notifications_log (
  id TEXT PRIMARY KEY,
  notification_hash TEXT UNIQUE NOT NULL,
  handle TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('like', 'repost', 'reply')),
  raw_row TEXT, -- Store the raw CSV row for debugging
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. ALERTS TABLE
-- Activity feed showing recent interactions
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new_follow', 'like', 'repost', 'reply')),
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. METADATA TABLE
-- Stores settings like total followers count
-- ============================================
CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_researchers_handle ON researchers(handle);
CREATE INDEX IF NOT EXISTS idx_researchers_is_following ON researchers(is_following);
CREATE INDEX IF NOT EXISTS idx_notifications_log_hash ON notifications_log(notification_hash);
CREATE INDEX IF NOT EXISTS idx_notifications_log_handle ON notifications_log(handle);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_handle ON alerts(handle);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Enable public access for this app
-- ============================================
ALTER TABLE researchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE metadata ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean re-runs)
DROP POLICY IF EXISTS "Allow public access" ON researchers;
DROP POLICY IF EXISTS "Allow public access" ON notifications_log;
DROP POLICY IF EXISTS "Allow public access" ON alerts;
DROP POLICY IF EXISTS "Allow public access" ON metadata;

-- Create permissive policies for all operations
CREATE POLICY "Allow public access" ON researchers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON notifications_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON metadata FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- HELPER FUNCTION: Check if notification exists
-- ============================================
CREATE OR REPLACE FUNCTION check_notification_exists(p_hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM notifications_log WHERE notification_hash = p_hash);
END;
$$ LANGUAGE plpgsql;
