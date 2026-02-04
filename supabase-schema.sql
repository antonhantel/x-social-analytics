-- GI Social Analytics - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Researchers table
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
  previous_likes INTEGER,
  previous_reposts INTEGER,
  previous_replies INTEGER,
  previous_is_following BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new_follow', 'like', 'repost', 'reply')),
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metadata table (for total followers, etc.)
CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_researchers_handle ON researchers(handle);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_handle ON alerts(handle);

-- Row Level Security (RLS) - Optional but recommended
-- Enable RLS on all tables
ALTER TABLE researchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE metadata ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
-- For a simple setup, allow public access with anon key:
CREATE POLICY "Allow public read" ON researchers FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON researchers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON researchers FOR UPDATE USING (true);

CREATE POLICY "Allow public read" ON alerts FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON alerts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON metadata FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON metadata FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON metadata FOR UPDATE USING (true);
