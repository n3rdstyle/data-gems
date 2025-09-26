-- Run this in your Supabase SQL Editor
-- This creates the waitlist table if it doesn't exist

-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT DEFAULT 'website',
  metadata JSONB
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- Enable Row Level Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anonymous inserts" ON waitlist;
DROP POLICY IF EXISTS "Users can check their own email" ON waitlist;

-- Create a policy to allow inserts from anonymous users
CREATE POLICY "Allow anonymous inserts" ON waitlist
  FOR INSERT
  WITH CHECK (true);

-- Create a policy to allow reading (for checking duplicates)
CREATE POLICY "Users can check their own email" ON waitlist
  FOR SELECT
  USING (true);

-- Verify the table was created
SELECT COUNT(*) as total_signups FROM waitlist;