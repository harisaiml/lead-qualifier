-- LeadScore AI - Supabase Schema
-- Run this in your Supabase SQL editor

-- Lead Scores table
CREATE TABLE IF NOT EXISTS lead_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Lead input
  company_name TEXT NOT NULL,
  website_url TEXT,
  lead_info TEXT,
  industry TEXT,
  contact_info TEXT,
  
  -- Score results
  overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  business_quality INTEGER NOT NULL CHECK (business_quality BETWEEN 0 AND 100),
  buying_intent INTEGER NOT NULL CHECK (buying_intent BETWEEN 0 AND 100),
  website_quality INTEGER NOT NULL CHECK (website_quality BETWEEN 0 AND 100),
  contact_completeness INTEGER NOT NULL CHECK (contact_completeness BETWEEN 0 AND 100),
  conversion_potential INTEGER NOT NULL CHECK (conversion_potential BETWEEN 0 AND 100),
  
  -- AI output
  summary TEXT NOT NULL,
  suggestions TEXT[] NOT NULL DEFAULT '{}',
  outreach_template TEXT,
  status TEXT NOT NULL CHECK (status IN ('excellent', 'good', 'fair', 'poor')) DEFAULT 'fair',
  
  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_lead_scores_created_at ON lead_scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_scores_status ON lead_scores(status);
CREATE INDEX IF NOT EXISTS idx_lead_scores_overall_score ON lead_scores(overall_score DESC);

-- Row Level Security (enable for production with auth)
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;

-- Policy: allow all for now (add auth later)
CREATE POLICY "Allow all operations" ON lead_scores
  FOR ALL USING (true) WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lead_scores_updated_at 
  BEFORE UPDATE ON lead_scores 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();
