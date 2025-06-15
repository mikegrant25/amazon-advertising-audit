-- MVP Migrations with Correct Order
-- This file ensures tables are created in the right dependency order
-- Run this in Supabase SQL Editor

BEGIN;

-- ============================================
-- 1. Extensions and Types First
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE audit_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE audit_goal AS ENUM ('profitability', 'growth', 'launch', 'defense', 'portfolio');
CREATE TYPE file_type AS ENUM ('sponsored_products', 'sponsored_brands', 'sponsored_display', 'search_terms', 'business_report');
CREATE TYPE file_status AS ENUM ('pending', 'processing', 'processed', 'failed');

-- ============================================
-- 2. Core Tables (no dependencies)
-- ============================================

-- Users table (managed by Clerk, but we need local reference)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    company_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to users
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. Tables that depend on users
-- ============================================

-- Audits table
CREATE TABLE audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    goal audit_goal NOT NULL,
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    status audit_status DEFAULT 'pending',
    
    -- Analysis results (JSON for flexibility)
    analysis_results JSONB,
    recommendations JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    CONSTRAINT valid_date_range CHECK (date_range_end >= date_range_start)
);

-- Apply updated_at trigger to audits
CREATE TRIGGER update_audits_updated_at BEFORE UPDATE ON audits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Tables that depend on audits
-- ============================================

-- Audit files table
CREATE TABLE audit_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    file_type file_type NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_hash VARCHAR(64), -- SHA256 hash for deduplication
    
    -- Processing metadata
    status file_status DEFAULT 'pending',
    error_message TEXT,
    processed_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure one file type per audit
    CONSTRAINT unique_file_type_per_audit UNIQUE (audit_id, file_type)
);

-- Apply updated_at trigger to audit_files
CREATE TRIGGER update_audit_files_updated_at BEFORE UPDATE ON audit_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Pilot feedback table (now audits table exists)
CREATE TABLE IF NOT EXISTS pilot_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  feedback_text TEXT NOT NULL,
  feedback_type TEXT CHECK (feedback_type IN ('bug', 'feature', 'general')) NOT NULL,
  audit_id UUID REFERENCES audits(id) ON DELETE SET NULL,
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Pilot analytics events table
CREATE TABLE IF NOT EXISTS pilot_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_properties JSONB DEFAULT '{}',
  page_url TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- 5. Add columns to existing tables
-- ============================================

-- Add analysis_result column to audits table
ALTER TABLE audits 
ADD COLUMN IF NOT EXISTS analysis_result jsonb;

-- Add performance_metrics column to audits table
ALTER TABLE audits 
ADD COLUMN IF NOT EXISTS performance_metrics JSONB;

-- Add recommendations columns to audits table
ALTER TABLE audits 
ADD COLUMN IF NOT EXISTS recommendations_generated_at TIMESTAMP WITH TIME ZONE;

-- Add parsed_data column to audit_files table
ALTER TABLE audit_files 
ADD COLUMN IF NOT EXISTS parsed_data JSONB;

-- Add validation_result and other columns to audit_files
ALTER TABLE audit_files 
ADD COLUMN IF NOT EXISTS validation_result jsonb,
ADD COLUMN IF NOT EXISTS error_message text;

-- ============================================
-- 6. Create additional tables
-- ============================================

-- Create asin_metrics table for detailed metrics storage
CREATE TABLE asin_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id uuid REFERENCES audits(id) ON DELETE CASCADE,
  asin text NOT NULL,
  metrics jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create parsed_data table for storing CSV data
CREATE TABLE parsed_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id uuid REFERENCES audit_files(id) ON DELETE CASCADE,
  file_type text NOT NULL,
  row_number integer NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 7. Create all indexes
-- ============================================

-- Users indexes
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);

-- Audits indexes
CREATE INDEX idx_audits_user_id ON audits(user_id);
CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_audits_created_at ON audits(created_at DESC);
CREATE INDEX idx_audits_analysis_result ON audits USING gin (analysis_result);
CREATE INDEX IF NOT EXISTS idx_audits_performance_metrics ON audits USING GIN (performance_metrics);
CREATE INDEX IF NOT EXISTS idx_audits_recommendations_generated_at ON audits(recommendations_generated_at) WHERE recommendations_generated_at IS NOT NULL;

-- Audit files indexes
CREATE INDEX idx_audit_files_audit_id ON audit_files(audit_id);
CREATE INDEX idx_audit_files_status ON audit_files(status);
CREATE INDEX IF NOT EXISTS idx_audit_files_parsed_data ON audit_files USING GIN (parsed_data);

-- Pilot tables indexes
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_user_id ON pilot_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_type ON pilot_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_created_at ON pilot_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pilot_analytics_user_id ON pilot_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_pilot_analytics_event_name ON pilot_analytics(event_name);
CREATE INDEX IF NOT EXISTS idx_pilot_analytics_created_at ON pilot_analytics(created_at DESC);

-- Other table indexes
CREATE INDEX idx_asin_metrics_audit_id ON asin_metrics(audit_id);
CREATE INDEX idx_asin_metrics_asin ON asin_metrics(asin);
CREATE INDEX idx_asin_metrics_created_at ON asin_metrics(created_at);
CREATE INDEX idx_parsed_data_file_id ON parsed_data(file_id);
CREATE INDEX idx_parsed_data_file_type ON parsed_data(file_type);
CREATE INDEX idx_parsed_data_created_at ON parsed_data(created_at);

-- ============================================
-- 8. Enable Row Level Security
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE asin_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE parsed_data ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. Create RLS Policies
-- ============================================

-- Users can only see their own data
CREATE POLICY users_policy ON users
    FOR ALL
    USING (auth.uid()::text = clerk_id);

-- Users can only access their own audits
CREATE POLICY audits_policy ON audits
    FOR ALL
    USING (user_id IN (
        SELECT id FROM users WHERE clerk_id = auth.uid()::text
    ));

-- Users can only access files from their own audits
CREATE POLICY audit_files_policy ON audit_files
    FOR ALL
    USING (audit_id IN (
        SELECT a.id FROM audits a
        JOIN users u ON a.user_id = u.id
        WHERE u.clerk_id = auth.uid()::text
    ));

-- RLS policies for pilot_feedback
CREATE POLICY "Users can create their own feedback" ON pilot_feedback
  FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can view their own feedback" ON pilot_feedback
  FOR SELECT USING (auth.uid()::TEXT = user_id);

-- RLS policies for pilot_analytics
CREATE POLICY "Users can create their own analytics events" ON pilot_analytics
  FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id);

-- Users can only see metrics for their own audits
CREATE POLICY "Users can view own asin metrics" ON asin_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = asin_metrics.audit_id
      AND audits.user_id = auth.uid()
    )
  );

-- Users can insert metrics for their own audits
CREATE POLICY "Users can insert own asin metrics" ON asin_metrics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = asin_metrics.audit_id
      AND audits.user_id = auth.uid()
    )
  );

-- Users can delete their own metrics
CREATE POLICY "Users can delete own asin metrics" ON asin_metrics
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = asin_metrics.audit_id
      AND audits.user_id = auth.uid()
    )
  );

-- Users can only see parsed data for their own files
CREATE POLICY "Users can view own parsed data" ON parsed_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM audit_files af
      JOIN audits a ON af.audit_id = a.id
      WHERE af.id = parsed_data.file_id
      AND a.user_id = auth.uid()
    )
  );

-- Users can insert parsed data for their own files
CREATE POLICY "Users can insert own parsed data" ON parsed_data
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM audit_files af
      JOIN audits a ON af.audit_id = a.id
      WHERE af.id = parsed_data.file_id
      AND a.user_id = auth.uid()
    )
  );

-- Users can delete their own parsed data
CREATE POLICY "Users can delete own parsed data" ON parsed_data
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM audit_files af
      JOIN audits a ON af.audit_id = a.id
      WHERE af.id = parsed_data.file_id
      AND a.user_id = auth.uid()
    )
  );

-- ============================================
-- 10. Grant Permissions
-- ============================================

GRANT INSERT ON pilot_feedback TO authenticated;
GRANT SELECT ON pilot_feedback TO authenticated;
GRANT INSERT ON pilot_analytics TO authenticated;

-- ============================================
-- 11. Create Views and Functions
-- ============================================

-- Create views for common queries
CREATE VIEW user_audit_summary AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(DISTINCT a.id) as total_audits,
    COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_audits,
    COUNT(DISTINCT CASE WHEN a.status = 'processing' THEN a.id END) as processing_audits,
    MAX(a.created_at) as last_audit_date
FROM users u
LEFT JOIN audits a ON u.id = a.user_id
GROUP BY u.id, u.email;

-- Create views for pilot metrics
CREATE OR REPLACE VIEW pilot_metrics AS
SELECT 
  COUNT(DISTINCT user_id) as total_users,
  COUNT(DISTINCT CASE WHEN event_name = 'first_login' THEN user_id END) as users_logged_in,
  COUNT(DISTINCT CASE WHEN event_name = 'audit_created' THEN user_id END) as users_created_audit,
  COUNT(DISTINCT CASE WHEN event_name = 'analysis_completed' THEN user_id END) as users_completed_analysis,
  COUNT(DISTINCT CASE WHEN event_name = 'pdf_downloaded' THEN user_id END) as users_downloaded_pdf,
  COUNT(CASE WHEN event_name = 'audit_created' THEN 1 END) as total_audits,
  COUNT(CASE WHEN event_name = 'pdf_downloaded' THEN 1 END) as total_downloads,
  COUNT(CASE WHEN event_name = 'feedback_submitted' THEN 1 END) as total_feedback
FROM pilot_analytics
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Create function to get user journey funnel
CREATE OR REPLACE FUNCTION get_pilot_funnel()
RETURNS TABLE (
  step TEXT,
  user_count BIGINT,
  percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH funnel_data AS (
    SELECT 
      COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'pilot_signup') as signed_up,
      COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'first_login') as logged_in,
      COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'audit_created') as created_audit,
      COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'file_uploaded') as uploaded_files,
      COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'goal_selected') as selected_goal,
      COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'analysis_completed') as completed_analysis,
      COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'pdf_downloaded') as downloaded_pdf
    FROM pilot_analytics
  )
  SELECT 'Signed Up' as step, signed_up as user_count, 100.0 as percentage FROM funnel_data
  UNION ALL
  SELECT 'Logged In', logged_in, ROUND(logged_in::NUMERIC / NULLIF(signed_up, 0) * 100, 1) FROM funnel_data
  UNION ALL
  SELECT 'Created Audit', created_audit, ROUND(created_audit::NUMERIC / NULLIF(signed_up, 0) * 100, 1) FROM funnel_data
  UNION ALL
  SELECT 'Uploaded Files', uploaded_files, ROUND(uploaded_files::NUMERIC / NULLIF(signed_up, 0) * 100, 1) FROM funnel_data
  UNION ALL
  SELECT 'Selected Goal', selected_goal, ROUND(selected_goal::NUMERIC / NULLIF(signed_up, 0) * 100, 1) FROM funnel_data
  UNION ALL
  SELECT 'Completed Analysis', completed_analysis, ROUND(completed_analysis::NUMERIC / NULLIF(signed_up, 0) * 100, 1) FROM funnel_data
  UNION ALL
  SELECT 'Downloaded PDF', downloaded_pdf, ROUND(downloaded_pdf::NUMERIC / NULLIF(signed_up, 0) * 100, 1) FROM funnel_data;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 12. Storage Buckets (must be last)
-- ============================================

-- Create storage buckets for audit files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'audit-files',
        'audit-files',
        false,
        52428800, -- 50MB limit
        ARRAY[
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain'
        ]
    );

-- Create storage bucket for generated reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'audit-reports',
        'audit-reports',
        false,
        104857600, -- 100MB limit
        ARRAY[
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
    );

-- RLS policies for storage bucket
CREATE POLICY "Users can upload their own audit files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'audit-files' AND
        auth.uid()::text IN (
            SELECT u.clerk_id 
            FROM users u
            JOIN audits a ON u.id = a.user_id
            WHERE a.id::text = (storage.foldername(name))[1]
        )
    );

CREATE POLICY "Users can view their own audit files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'audit-files' AND
        auth.uid()::text IN (
            SELECT u.clerk_id 
            FROM users u
            JOIN audits a ON u.id = a.user_id
            WHERE a.id::text = (storage.foldername(name))[1]
        )
    );

CREATE POLICY "Users can delete their own audit files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'audit-files' AND
        auth.uid()::text IN (
            SELECT u.clerk_id 
            FROM users u
            JOIN audits a ON u.id = a.user_id
            WHERE a.id::text = (storage.foldername(name))[1]
        )
    );

CREATE POLICY "Users can view their own reports" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'audit-reports' AND
        auth.uid()::text IN (
            SELECT u.clerk_id 
            FROM users u
            JOIN audits a ON u.id = a.user_id
            WHERE a.id::text = (storage.foldername(name))[1]
        )
    );

CREATE POLICY "Service role can upload reports" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'audit-reports' AND
        auth.role() = 'service_role'
    );

CREATE POLICY "Users can delete their own reports" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'audit-reports' AND
        auth.uid()::text IN (
            SELECT u.clerk_id 
            FROM users u
            JOIN audits a ON u.id = a.user_id
            WHERE a.id::text = (storage.foldername(name))[1]
        )
    );

-- ============================================
-- 13. Add Comments
-- ============================================

COMMENT ON TABLE users IS 'User accounts synchronized with Clerk authentication';
COMMENT ON TABLE audits IS 'Amazon advertising audit records with analysis results';
COMMENT ON TABLE audit_files IS 'Uploaded files associated with each audit';
COMMENT ON COLUMN audits.analysis_results IS 'JSON structure containing flywheel metrics, performance data, and insights';
COMMENT ON COLUMN audits.recommendations IS 'JSON structure containing goal-specific recommendations';
COMMENT ON COLUMN audit_files.processed_data IS 'Parsed and normalized data from the uploaded file';
COMMENT ON COLUMN audit_files.parsed_data IS 'Stores parsed CSV data in a structured format. Structure: {columns: string[], rows: object[], stats: {totalRows, validRows, invalidRows}}';
COMMENT ON COLUMN audits.performance_metrics IS 'Stores calculated performance metrics including account-level, campaign-level, and ad group metrics. Structure: {accountMetrics, campaignMetrics, adGroupMetrics, topPerformers, bottomPerformers}';

COMMIT;