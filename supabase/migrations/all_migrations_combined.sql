-- Combined Supabase Migrations
-- Generated on 2025-06-15T20:39:55.110Z
-- Run this in Supabase SQL Editor

BEGIN;

-- ============================================
-- Migration: 004_pilot_tracking.sql
-- ============================================

-- Pilot feedback table
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

-- Create indexes for pilot_feedback
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_user_id ON pilot_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_type ON pilot_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_created_at ON pilot_feedback(created_at DESC);

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

-- Create indexes for pilot_analytics
CREATE INDEX IF NOT EXISTS idx_pilot_analytics_user_id ON pilot_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_pilot_analytics_event_name ON pilot_analytics(event_name);
CREATE INDEX IF NOT EXISTS idx_pilot_analytics_created_at ON pilot_analytics(created_at DESC);

-- Enable RLS
ALTER TABLE pilot_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for pilot_feedback
CREATE POLICY "Users can create their own feedback" ON pilot_feedback
  FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can view their own feedback" ON pilot_feedback
  FOR SELECT USING (auth.uid()::TEXT = user_id);

-- RLS policies for pilot_analytics
CREATE POLICY "Users can create their own analytics events" ON pilot_analytics
  FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id);

-- Analytics should be write-only for users (they can't read back)
-- Admin/service role can read all for analysis

-- Grant permissions
GRANT INSERT ON pilot_feedback TO authenticated;
GRANT SELECT ON pilot_feedback TO authenticated;
GRANT INSERT ON pilot_analytics TO authenticated;

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
-- Migration: 20250111_initial_schema.sql
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE audit_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE audit_goal AS ENUM ('profitability', 'growth', 'launch', 'defense', 'portfolio');
CREATE TYPE file_type AS ENUM ('sponsored_products', 'sponsored_brands', 'sponsored_display', 'search_terms', 'business_report');
CREATE TYPE file_status AS ENUM ('pending', 'processing', 'processed', 'failed');

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

-- Create indexes for performance
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_audits_user_id ON audits(user_id);
CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_audits_created_at ON audits(created_at DESC);
CREATE INDEX idx_audit_files_audit_id ON audit_files(audit_id);
CREATE INDEX idx_audit_files_status ON audit_files(status);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_files ENABLE ROW LEVEL SECURITY;

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

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts synchronized with Clerk authentication';
COMMENT ON TABLE audits IS 'Amazon advertising audit records with analysis results';
COMMENT ON TABLE audit_files IS 'Uploaded files associated with each audit';
COMMENT ON COLUMN audits.analysis_results IS 'JSON structure containing flywheel metrics, performance data, and insights';
COMMENT ON COLUMN audits.recommendations IS 'JSON structure containing goal-specific recommendations';
COMMENT ON COLUMN audit_files.processed_data IS 'Parsed and normalized data from the uploaded file';

-- ============================================
-- Migration: 20250111_storage_buckets.sql
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

-- RLS policies for reports bucket
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
-- Migration: 20250114_add_parsed_data_to_audit_files.sql
-- ============================================

-- Add parsed_data column to audit_files table
ALTER TABLE audit_files 
ADD COLUMN IF NOT EXISTS parsed_data JSONB;

-- Add index for faster queries on parsed data
CREATE INDEX IF NOT EXISTS idx_audit_files_parsed_data 
ON audit_files USING GIN (parsed_data);

-- Add comment explaining the structure
COMMENT ON COLUMN audit_files.parsed_data IS 
'Stores parsed CSV data in a structured format. Structure: {columns: string[], rows: object[], stats: {totalRows, validRows, invalidRows}}';

-- ============================================
-- Migration: 20250114_analysis_results.sql
-- ============================================

-- Add analysis_result column to audits table
ALTER TABLE audits 
ADD COLUMN analysis_result jsonb;

-- Create index for performance
CREATE INDEX idx_audits_analysis_result ON audits USING gin (analysis_result);

-- Create asin_metrics table for detailed metrics storage
CREATE TABLE asin_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id uuid REFERENCES audits(id) ON DELETE CASCADE,
  asin text NOT NULL,
  metrics jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_asin_metrics_audit_id ON asin_metrics(audit_id);
CREATE INDEX idx_asin_metrics_asin ON asin_metrics(asin);
CREATE INDEX idx_asin_metrics_created_at ON asin_metrics(created_at);

-- Add RLS policies for asin_metrics
ALTER TABLE asin_metrics ENABLE ROW LEVEL SECURITY;

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

-- ============================================
-- Migration: 20250114_csv_processing.sql
-- ============================================

-- Add validation_result and error_message columns to audit_files
ALTER TABLE audit_files 
ADD COLUMN validation_result jsonb,
ADD COLUMN error_message text,
ADD COLUMN processed_at timestamptz;

-- Create parsed_data table for storing CSV data
CREATE TABLE parsed_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id uuid REFERENCES audit_files(id) ON DELETE CASCADE,
  file_type text NOT NULL,
  row_number integer NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_parsed_data_file_id ON parsed_data(file_id);
CREATE INDEX idx_parsed_data_file_type ON parsed_data(file_type);
CREATE INDEX idx_parsed_data_created_at ON parsed_data(created_at);

-- Add RLS policies for parsed_data
ALTER TABLE parsed_data ENABLE ROW LEVEL SECURITY;

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
-- Migration: 20250114_performance_metrics.sql
-- ============================================

-- Add performance_metrics column to audits table
ALTER TABLE audits 
ADD COLUMN IF NOT EXISTS performance_metrics JSONB;

-- Add index for faster queries on performance metrics
CREATE INDEX IF NOT EXISTS idx_audits_performance_metrics 
ON audits USING GIN (performance_metrics);

-- Add comment explaining the structure
COMMENT ON COLUMN audits.performance_metrics IS 
'Stores calculated performance metrics including account-level, campaign-level, and ad group metrics. Structure: {accountMetrics, campaignMetrics, adGroupMetrics, topPerformers, bottomPerformers}';

-- ============================================
-- Migration: 20250114_recommendations.sql
-- ============================================

-- Add recommendations columns to audits table
ALTER TABLE audits 
ADD COLUMN IF NOT EXISTS recommendations JSONB,
ADD COLUMN IF NOT EXISTS recommendations_generated_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_audits_recommendations_generated_at 
ON audits(recommendations_generated_at) 
WHERE recommendations_generated_at IS NOT NULL;

-- ============================================
-- Migration: mvp_to_production_bridge.sql
-- ============================================

-- MVP to Production Bridge Migration
-- This migration adds production features while maintaining backward compatibility
-- Run this AFTER the initial MVP migrations

BEGIN;

-- ============================================
-- 1. Create new schemas (non-breaking)
-- ============================================
CREATE SCHEMA IF NOT EXISTS tenant;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS cache;

-- ============================================
-- 2. Add organization support to existing structure
-- ============================================

-- Create organizations table
CREATE TABLE IF NOT EXISTS tenant.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create index for slug lookups
CREATE INDEX idx_organizations_slug ON tenant.organizations(slug);

-- Create organization memberships
CREATE TABLE IF NOT EXISTS tenant.organization_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES tenant.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, user_id)
);

-- Create indexes
CREATE INDEX idx_org_members_org_id ON tenant.organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON tenant.organization_members(user_id);

-- ============================================
-- 3. Alter existing tables to add org support
-- ============================================

-- Add organization_id to audits (nullable for backward compatibility)
ALTER TABLE audits 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES tenant.organizations(id);

-- Create index for org queries
CREATE INDEX IF NOT EXISTS idx_audits_organization_id ON audits(organization_id);

-- ============================================
-- 4. Create default organization for existing users
-- ============================================

-- Function to ensure user has organization
CREATE OR REPLACE FUNCTION ensure_user_organization(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_org_id UUID;
    v_user_email TEXT;
    v_org_slug TEXT;
BEGIN
    -- Check if user already has an organization
    SELECT om.organization_id INTO v_org_id
    FROM tenant.organization_members om
    WHERE om.user_id = p_user_id
    LIMIT 1;
    
    IF v_org_id IS NOT NULL THEN
        RETURN v_org_id;
    END IF;
    
    -- Create personal organization for user
    SELECT email INTO v_user_email FROM users WHERE id = p_user_id;
    v_org_slug := LOWER(REGEXP_REPLACE(SPLIT_PART(v_user_email, '@', 1), '[^a-z0-9]', '-', 'g'));
    
    -- Ensure unique slug
    WHILE EXISTS (SELECT 1 FROM tenant.organizations WHERE slug = v_org_slug) LOOP
        v_org_slug := v_org_slug || '-' || SUBSTR(gen_random_uuid()::TEXT, 1, 4);
    END LOOP;
    
    -- Create organization
    INSERT INTO tenant.organizations (name, slug)
    VALUES (COALESCE((SELECT company_name FROM users WHERE id = p_user_id), v_user_email), v_org_slug)
    RETURNING id INTO v_org_id;
    
    -- Add user as owner
    INSERT INTO tenant.organization_members (organization_id, user_id, role)
    VALUES (v_org_id, p_user_id, 'owner');
    
    RETURN v_org_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. Performance improvements
-- ============================================

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_files_audit_id_file_type 
ON audit_files(audit_id, file_type);

CREATE INDEX IF NOT EXISTS idx_audits_user_goal_status 
ON audits(user_id, goal, status);

-- Add GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_audits_analysis_result_gin 
ON audits USING GIN (analysis_result);

CREATE INDEX IF NOT EXISTS idx_audit_files_parsed_data_gin 
ON audit_files USING GIN (parsed_data);

-- ============================================
-- 6. Create analytics tables for better performance
-- ============================================

-- Pre-aggregated metrics table
CREATE TABLE IF NOT EXISTS analytics.audit_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC,
    metadata JSONB DEFAULT '{}',
    calculated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(audit_id, metric_type, metric_name)
);

-- Indexes for fast lookups
CREATE INDEX idx_audit_metrics_audit_id ON analytics.audit_metrics(audit_id);
CREATE INDEX idx_audit_metrics_type_name ON analytics.audit_metrics(metric_type, metric_name);

-- ============================================
-- 7. Enhanced RLS policies
-- ============================================

-- Enable RLS on new tables
ALTER TABLE tenant.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.audit_metrics ENABLE ROW LEVEL SECURITY;

-- Organization policies
CREATE POLICY "Users can view their organizations" ON tenant.organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id 
            FROM tenant.organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can update their organizations" ON tenant.organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id 
            FROM tenant.organization_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- Member policies
CREATE POLICY "Users can view organization members" ON tenant.organization_members
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM tenant.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Metrics policies
CREATE POLICY "Users can view metrics for their audits" ON analytics.audit_metrics
    FOR SELECT USING (
        audit_id IN (
            SELECT a.id 
            FROM audits a
            JOIN users u ON a.user_id = u.id
            WHERE u.clerk_id = auth.uid()::TEXT
        )
    );

-- ============================================
-- 8. Helper functions for cleaner code
-- ============================================

-- Get user's current organization
CREATE OR REPLACE FUNCTION get_current_organization_id()
RETURNS UUID AS $$
    SELECT organization_id 
    FROM tenant.organization_members 
    WHERE user_id = auth.uid()
    ORDER BY created_at DESC
    LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Check if user has permission
CREATE OR REPLACE FUNCTION has_organization_permission(p_org_id UUID, p_permission TEXT)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM tenant.organization_members 
        WHERE organization_id = p_org_id 
        AND user_id = auth.uid()
        AND (
            role = 'owner' OR 
            (role = 'admin' AND p_permission != 'delete') OR
            (role = 'member' AND p_permission = 'read')
        )
    );
$$ LANGUAGE SQL STABLE;

-- ============================================
-- 9. Monitoring and logging setup
-- ============================================

-- Slow query log table
CREATE TABLE IF NOT EXISTS analytics.slow_queries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query_text TEXT,
    execution_time_ms INTEGER,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS analytics.api_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES tenant.organizations(id),
    endpoint TEXT NOT NULL,
    method VARCHAR(10) NOT NULL,
    response_time_ms INTEGER,
    status_code INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for analytics
CREATE INDEX idx_slow_queries_created_at ON analytics.slow_queries(created_at DESC);
CREATE INDEX idx_api_usage_org_created ON analytics.api_usage(organization_id, created_at DESC);

-- ============================================
-- 10. Migration helper for existing data
-- ============================================

-- Migrate existing audits to organizations
DO $$
DECLARE
    r RECORD;
    v_org_id UUID;
BEGIN
    -- For each user with audits
    FOR r IN 
        SELECT DISTINCT u.id as user_id
        FROM users u
        JOIN audits a ON a.user_id = u.id
    LOOP
        -- Ensure they have an organization
        v_org_id := ensure_user_organization(r.user_id);
        
        -- Update their audits
        UPDATE audits 
        SET organization_id = v_org_id
        WHERE user_id = r.user_id 
        AND organization_id IS NULL;
    END LOOP;
END $$;

COMMIT;

-- ============================================
-- Post-migration notes:
-- ============================================
-- 1. This migration is backward compatible
-- 2. Existing functionality continues to work
-- 3. New features are opt-in
-- 4. Run analyze after migration: ANALYZE;
-- 5. Monitor performance with: SELECT * FROM pg_stat_user_tables;

-- ============================================
-- Migration: production_optimized_schema.sql
-- ============================================

-- Production-Optimized Supabase Schema for Amazon Advertising Audit Tool
-- Version: 2.0
-- Designed for: Multi-tenant enterprise scale, performance, and future extensibility

BEGIN;

-- =====================================================
-- EXTENSIONS & SETUP
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- For query performance monitoring
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- For advanced indexing
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimization

-- =====================================================
-- SCHEMAS - Organize by domain
-- =====================================================
CREATE SCHEMA IF NOT EXISTS auth_mirror;     -- Mirror Clerk auth data
CREATE SCHEMA IF NOT EXISTS tenant;          -- Multi-tenant core
CREATE SCHEMA IF NOT EXISTS audit;           -- Audit domain
CREATE SCHEMA IF NOT EXISTS analytics;       -- Analytics & metrics
CREATE SCHEMA IF NOT EXISTS storage_meta;    -- File storage metadata
CREATE SCHEMA IF NOT EXISTS cache;           -- Performance caching
CREATE SCHEMA IF NOT EXISTS logs;            -- System logs & events

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA tenant TO authenticated;
GRANT USAGE ON SCHEMA audit TO authenticated;
GRANT USAGE ON SCHEMA analytics TO authenticated;

-- =====================================================
-- CUSTOM TYPES
-- =====================================================
CREATE TYPE audit.status AS ENUM ('draft', 'pending', 'processing', 'completed', 'failed', 'archived');
CREATE TYPE audit.goal AS ENUM ('profitability', 'growth', 'launch', 'defense', 'portfolio', 'custom');
CREATE TYPE audit.file_type AS ENUM (
    'sponsored_products', 
    'sponsored_brands', 
    'sponsored_display', 
    'search_terms', 
    'business_report',
    'bulk_operations',
    'custom'
);
CREATE TYPE audit.file_status AS ENUM ('uploaded', 'validating', 'processing', 'processed', 'failed', 'archived');
CREATE TYPE tenant.subscription_tier AS ENUM ('trial', 'starter', 'professional', 'enterprise', 'custom');
CREATE TYPE tenant.user_role AS ENUM ('owner', 'admin', 'analyst', 'viewer');
CREATE TYPE analytics.metric_type AS ENUM ('account', 'campaign', 'ad_group', 'keyword', 'asin', 'search_term');

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Universal updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Efficient tenant isolation function
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_tenant_id', true)::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- Performance tracking function
CREATE OR REPLACE FUNCTION log_slow_query()
RETURNS event_trigger AS $$
DECLARE
    query_info RECORD;
BEGIN
    FOR query_info IN 
        SELECT * FROM pg_stat_statements 
        WHERE mean_exec_time > 1000 -- Log queries taking > 1 second
        ORDER BY mean_exec_time DESC 
        LIMIT 10
    LOOP
        INSERT INTO logs.slow_queries (query, mean_time_ms, calls, total_time_ms)
        VALUES (query_info.query, query_info.mean_exec_time, query_info.calls, query_info.total_exec_time)
        ON CONFLICT (query) DO UPDATE
        SET mean_time_ms = EXCLUDED.mean_time_ms,
            calls = EXCLUDED.calls,
            total_time_ms = EXCLUDED.total_time_ms;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TENANT SCHEMA - Multi-tenancy foundation
-- =====================================================

-- Organizations (Agencies/Companies)
CREATE TABLE tenant.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    subscription_tier tenant.subscription_tier DEFAULT 'trial',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Limits & quotas
    max_users INTEGER DEFAULT 5,
    max_audits_per_month INTEGER DEFAULT 10,
    max_file_size_mb INTEGER DEFAULT 100,
    storage_quota_gb INTEGER DEFAULT 10,
    
    -- White-label settings
    custom_domain VARCHAR(255),
    brand_config JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Organization members (users)
CREATE TABLE tenant.organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES tenant.organizations(id) ON DELETE CASCADE,
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role tenant.user_role DEFAULT 'analyst',
    
    -- Permissions (for fine-grained access control)
    permissions JSONB DEFAULT '{}',
    
    -- Activity tracking
    last_active_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deactivated_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(organization_id, email)
);

-- API keys for programmatic access
CREATE TABLE tenant.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES tenant.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE, -- Store SHA256 hash
    key_prefix VARCHAR(10) NOT NULL, -- For identification (e.g., "vxq_live_")
    scopes JSONB DEFAULT '["read"]',
    
    -- Rate limiting
    rate_limit_per_hour INTEGER DEFAULT 1000,
    
    -- Metadata
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES tenant.organization_members(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- AUDIT SCHEMA - Core business domain
-- =====================================================

-- Audits table with partitioning support
CREATE TABLE audit.audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES tenant.organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES tenant.organization_members(id),
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    goal audit.goal NOT NULL,
    custom_goal_config JSONB, -- For custom goals
    
    -- Date range (partition key candidate)
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    
    -- Status & workflow
    status audit.status DEFAULT 'draft',
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    processing_duration_ms INTEGER,
    
    -- Configuration
    config JSONB DEFAULT '{}', -- Flexible configuration storage
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_date_range CHECK (date_range_end >= date_range_start),
    CONSTRAINT valid_processing_times CHECK (
        processing_completed_at IS NULL OR 
        processing_completed_at >= processing_started_at
    )
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for audits (example for 2025)
CREATE TABLE audit.audits_2025_01 PARTITION OF audit.audits
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE audit.audits_2025_02 PARTITION OF audit.audits
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
-- Continue for all months...

-- Audit files with improved structure
CREATE TABLE audit.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audit.audits(id) ON DELETE CASCADE,
    file_type audit.file_type NOT NULL,
    
    -- File metadata
    original_filename VARCHAR(500) NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_hash VARCHAR(64) NOT NULL, -- SHA256 for deduplication
    mime_type VARCHAR(100),
    
    -- Processing
    status audit.file_status DEFAULT 'uploaded',
    validation_result JSONB,
    error_details JSONB,
    
    -- Performance optimization
    row_count INTEGER,
    is_sample BOOLEAN DEFAULT false, -- For large file sampling
    
    -- Timestamps
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    validated_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure one active file per type per audit
    UNIQUE(audit_id, file_type) WHERE status != 'archived'
);

-- =====================================================
-- ANALYTICS SCHEMA - Metrics & results
-- =====================================================

-- Aggregated metrics table (denormalized for performance)
CREATE TABLE analytics.metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audit.audits(id) ON DELETE CASCADE,
    metric_type analytics.metric_type NOT NULL,
    entity_id VARCHAR(255), -- Campaign ID, ASIN, etc.
    entity_name VARCHAR(500),
    
    -- Time dimensions
    date_period DATE,
    
    -- Core metrics (stored as JSONB for flexibility)
    metrics JSONB NOT NULL,
    
    -- Calculated scores
    performance_score DECIMAL(5,2),
    efficiency_score DECIMAL(5,2),
    opportunity_score DECIMAL(5,2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Composite index for common queries
    UNIQUE(audit_id, metric_type, entity_id, date_period)
);

-- Recommendations table
CREATE TABLE analytics.recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audit.audits(id) ON DELETE CASCADE,
    
    -- Categorization
    category VARCHAR(100) NOT NULL, -- 'optimization', 'expansion', 'efficiency', etc.
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    
    -- Content
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    impact_summary JSONB NOT NULL, -- Expected impact metrics
    
    -- Actionability
    action_items JSONB NOT NULL, -- Step-by-step actions
    estimated_effort VARCHAR(50), -- 'minutes', 'hours', 'days'
    requires_budget BOOLEAN DEFAULT false,
    estimated_cost_range JSONB,
    
    -- Targeting
    applies_to_entities JSONB, -- Which campaigns/products this applies to
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending',
    implemented_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    dismissed_reason TEXT,
    
    -- ML/AI metadata
    confidence_score DECIMAL(3,2),
    model_version VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Flywheel analysis results
CREATE TABLE analytics.flywheel_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audit.audits(id) ON DELETE CASCADE,
    
    -- Flywheel components
    awareness_score DECIMAL(5,2) NOT NULL,
    consideration_score DECIMAL(5,2) NOT NULL,
    purchase_score DECIMAL(5,2) NOT NULL,
    loyalty_score DECIMAL(5,2) NOT NULL,
    advocacy_score DECIMAL(5,2) NOT NULL,
    
    -- Overall health
    overall_score DECIMAL(5,2) NOT NULL,
    stage_balance_score DECIMAL(5,2) NOT NULL,
    
    -- Detailed insights
    bottlenecks JSONB NOT NULL,
    opportunities JSONB NOT NULL,
    stage_analysis JSONB NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(audit_id)
);

-- =====================================================
-- STORAGE META SCHEMA - File handling optimization
-- =====================================================

-- Parsed data storage (optimized structure)
CREATE TABLE storage_meta.parsed_data (
    audit_id UUID NOT NULL REFERENCES audit.audits(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES audit.files(id) ON DELETE CASCADE,
    chunk_number INTEGER NOT NULL,
    
    -- Compressed data storage
    data_compressed BYTEA NOT NULL, -- GZIP compressed JSONB
    row_count INTEGER NOT NULL,
    
    -- Quick access metadata
    date_range daterange,
    entity_ids TEXT[], -- For quick filtering
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (file_id, chunk_number)
) PARTITION BY HASH (audit_id);

-- Create hash partitions for parallel processing
CREATE TABLE storage_meta.parsed_data_0 PARTITION OF storage_meta.parsed_data
    FOR VALUES WITH (modulus 4, remainder 0);
CREATE TABLE storage_meta.parsed_data_1 PARTITION OF storage_meta.parsed_data
    FOR VALUES WITH (modulus 4, remainder 1);
CREATE TABLE storage_meta.parsed_data_2 PARTITION OF storage_meta.parsed_data
    FOR VALUES WITH (modulus 4, remainder 2);
CREATE TABLE storage_meta.parsed_data_3 PARTITION OF storage_meta.parsed_data
    FOR VALUES WITH (modulus 4, remainder 3);

-- =====================================================
-- CACHE SCHEMA - Performance optimization
-- =====================================================

-- Analysis results cache
CREATE TABLE cache.analysis_results (
    cache_key VARCHAR(255) PRIMARY KEY,
    audit_id UUID NOT NULL REFERENCES audit.audits(id) ON DELETE CASCADE,
    result_type VARCHAR(100) NOT NULL,
    
    -- Cached data
    data_compressed BYTEA NOT NULL,
    
    -- Cache management
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    hit_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- LOGS SCHEMA - Audit trail & monitoring
-- =====================================================

-- Activity log for compliance
CREATE TABLE logs.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES tenant.organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES tenant.organization_members(id) ON DELETE SET NULL,
    
    -- Activity details
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    request_id UUID,
    
    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for logs
CREATE TABLE logs.activity_log_2025_01 PARTITION OF logs.activity_log
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Performance monitoring
CREATE TABLE logs.slow_queries (
    query TEXT PRIMARY KEY,
    mean_time_ms DECIMAL(10,2),
    calls BIGINT,
    total_time_ms DECIMAL(12,2),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pilot/feedback tracking (improved structure)
CREATE TABLE logs.user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES tenant.organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES tenant.organization_members(id) ON DELETE SET NULL,
    
    -- Feedback content
    type VARCHAR(50) NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'praise', 'other')),
    category VARCHAR(100),
    message TEXT NOT NULL,
    
    -- Context
    audit_id UUID REFERENCES audit.audits(id) ON DELETE SET NULL,
    page_path VARCHAR(500),
    
    -- Metadata
    browser_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Response tracking
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT
);

-- =====================================================
-- INDEXES - Optimized for common query patterns
-- =====================================================

-- Tenant indexes
CREATE INDEX idx_org_members_clerk_id ON tenant.organization_members(clerk_id);
CREATE INDEX idx_org_members_org_id_role ON tenant.organization_members(organization_id, role);
CREATE INDEX idx_api_keys_org_id ON tenant.api_keys(organization_id) WHERE revoked_at IS NULL;

-- Audit indexes
CREATE INDEX idx_audits_org_id_status ON audit.audits(organization_id, status);
CREATE INDEX idx_audits_created_by ON audit.audits(created_by);
CREATE INDEX idx_audits_date_range ON audit.audits USING gist(daterange(date_range_start, date_range_end));
CREATE INDEX idx_audits_tags ON audit.audits USING gin(tags);
CREATE INDEX idx_files_audit_id_type ON audit.files(audit_id, file_type);
CREATE INDEX idx_files_hash ON audit.files(file_hash); -- For deduplication

-- Analytics indexes
CREATE INDEX idx_metrics_audit_id_type ON analytics.metrics(audit_id, metric_type);
CREATE INDEX idx_metrics_entity ON analytics.metrics(entity_id);
CREATE INDEX idx_metrics_performance ON analytics.metrics(audit_id, performance_score DESC);
CREATE INDEX idx_recommendations_audit_id_priority ON analytics.recommendations(audit_id, priority);
CREATE INDEX idx_recommendations_category ON analytics.recommendations(category);

-- Cache indexes
CREATE INDEX idx_cache_expires ON cache.analysis_results(expires_at);

-- Full-text search indexes
CREATE INDEX idx_audits_search ON audit.audits USING gin(
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE tenant.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.flywheel_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_meta.parsed_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache.analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs.user_feedback ENABLE ROW LEVEL SECURITY;

-- Helper function for current user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM tenant.organization_members 
        WHERE clerk_id = auth.uid()::text
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Organization policies
CREATE POLICY "Users see own organization" ON tenant.organizations
    FOR SELECT USING (id = get_user_organization_id());

CREATE POLICY "Organization admins can update" ON tenant.organizations
    FOR UPDATE USING (
        id = get_user_organization_id() AND
        EXISTS (
            SELECT 1 FROM tenant.organization_members
            WHERE organization_id = id
            AND clerk_id = auth.uid()::text
            AND role IN ('owner', 'admin')
        )
    );

-- Member policies
CREATE POLICY "Users see organization members" ON tenant.organization_members
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Users see own profile" ON tenant.organization_members
    FOR ALL USING (clerk_id = auth.uid()::text);

-- Audit policies
CREATE POLICY "Users see organization audits" ON audit.audits
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Users create audits" ON audit.audits
    FOR INSERT WITH CHECK (
        organization_id = get_user_organization_id() AND
        created_by IN (
            SELECT id FROM tenant.organization_members
            WHERE clerk_id = auth.uid()::text
        )
    );

CREATE POLICY "Audit creators can update" ON audit.audits
    FOR UPDATE USING (
        organization_id = get_user_organization_id() AND
        (created_by IN (
            SELECT id FROM tenant.organization_members
            WHERE clerk_id = auth.uid()::text
        ) OR EXISTS (
            SELECT 1 FROM tenant.organization_members
            WHERE organization_id = audit.audits.organization_id
            AND clerk_id = auth.uid()::text
            AND role IN ('owner', 'admin')
        ))
    );

-- File policies
CREATE POLICY "Users access organization files" ON audit.files
    FOR ALL USING (
        audit_id IN (
            SELECT id FROM audit.audits
            WHERE organization_id = get_user_organization_id()
        )
    );

-- Analytics policies  
CREATE POLICY "Users see organization analytics" ON analytics.metrics
    FOR SELECT USING (
        audit_id IN (
            SELECT id FROM audit.audits
            WHERE organization_id = get_user_organization_id()
        )
    );

CREATE POLICY "Users see organization recommendations" ON analytics.recommendations
    FOR ALL USING (
        audit_id IN (
            SELECT id FROM audit.audits
            WHERE organization_id = get_user_organization_id()
        )
    );

-- =====================================================
-- MATERIALIZED VIEWS - Performance optimization
-- =====================================================

-- Organization dashboard metrics
CREATE MATERIALIZED VIEW analytics.organization_metrics AS
SELECT 
    o.id as organization_id,
    COUNT(DISTINCT a.id) as total_audits,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed') as completed_audits,
    COUNT(DISTINCT a.id) FILTER (WHERE a.created_at >= CURRENT_DATE - INTERVAL '30 days') as audits_last_30_days,
    COUNT(DISTINCT om.id) as total_users,
    COUNT(DISTINCT om.id) FILTER (WHERE om.last_active_at >= CURRENT_DATE - INTERVAL '7 days') as active_users_7_days,
    COALESCE(AVG(am.performance_score), 0) as avg_performance_score,
    COUNT(DISTINCT ar.id) FILTER (WHERE ar.priority IN ('critical', 'high')) as high_priority_recommendations
FROM tenant.organizations o
LEFT JOIN tenant.organization_members om ON o.id = om.organization_id
LEFT JOIN audit.audits a ON o.id = a.organization_id
LEFT JOIN analytics.metrics am ON a.id = am.audit_id
LEFT JOIN analytics.recommendations ar ON a.id = ar.audit_id
GROUP BY o.id;

CREATE UNIQUE INDEX idx_org_metrics_org_id ON analytics.organization_metrics(organization_id);

-- Top performers view
CREATE MATERIALIZED VIEW analytics.top_performers AS
SELECT 
    audit_id,
    metric_type,
    entity_id,
    entity_name,
    performance_score,
    metrics,
    ROW_NUMBER() OVER (PARTITION BY audit_id, metric_type ORDER BY performance_score DESC) as rank
FROM analytics.metrics
WHERE performance_score IS NOT NULL;

CREATE INDEX idx_top_performers_audit ON analytics.top_performers(audit_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON tenant.organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organization_members_updated_at BEFORE UPDATE ON tenant.organization_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audits_updated_at BEFORE UPDATE ON audit.audits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activity logging trigger
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO logs.activity_log (
        organization_id,
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values
    ) VALUES (
        COALESCE(NEW.organization_id, OLD.organization_id),
        (SELECT id FROM tenant.organization_members WHERE clerk_id = auth.uid()::text LIMIT 1),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply activity logging to critical tables
CREATE TRIGGER log_audit_changes AFTER INSERT OR UPDATE OR DELETE ON audit.audits
    FOR EACH ROW EXECUTE FUNCTION log_activity();

-- =====================================================
-- FUNCTIONS - Business logic
-- =====================================================

-- Get audit completion funnel
CREATE OR REPLACE FUNCTION analytics.get_audit_funnel(
    p_organization_id UUID,
    p_date_from DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_date_to DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    step TEXT,
    count BIGINT,
    percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH funnel AS (
        SELECT
            COUNT(*) FILTER (WHERE status != 'draft') as started,
            COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM audit.files f WHERE f.audit_id = a.id)) as uploaded_files,
            COUNT(*) FILTER (WHERE status IN ('processing', 'completed')) as processing_started,
            COUNT(*) FILTER (WHERE status = 'completed') as completed,
            COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM analytics.recommendations r WHERE r.audit_id = a.id)) as has_recommendations
        FROM audit.audits a
        WHERE a.organization_id = p_organization_id
        AND a.created_at BETWEEN p_date_from AND p_date_to
    )
    SELECT 'Started' as step, started as count, 100.0 as percentage FROM funnel
    UNION ALL
    SELECT 'Uploaded Files', uploaded_files, ROUND(uploaded_files::NUMERIC / NULLIF(started, 0) * 100, 1) FROM funnel
    UNION ALL
    SELECT 'Processing Started', processing_started, ROUND(processing_started::NUMERIC / NULLIF(started, 0) * 100, 1) FROM funnel
    UNION ALL
    SELECT 'Completed', completed, ROUND(completed::NUMERIC / NULLIF(started, 0) * 100, 1) FROM funnel
    UNION ALL
    SELECT 'Has Recommendations', has_recommendations, ROUND(has_recommendations::NUMERIC / NULLIF(started, 0) * 100, 1) FROM funnel;
END;
$$ LANGUAGE plpgsql STABLE;

-- Calculate storage usage
CREATE OR REPLACE FUNCTION tenant.calculate_storage_usage(p_organization_id UUID)
RETURNS TABLE (
    total_files BIGINT,
    total_size_bytes BIGINT,
    total_size_gb NUMERIC,
    quota_gb INTEGER,
    usage_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(f.*)::BIGINT as total_files,
        COALESCE(SUM(f.file_size_bytes), 0)::BIGINT as total_size_bytes,
        ROUND(COALESCE(SUM(f.file_size_bytes), 0) / 1073741824.0, 2) as total_size_gb,
        o.storage_quota_gb,
        ROUND((COALESCE(SUM(f.file_size_bytes), 0) / 1073741824.0) / o.storage_quota_gb * 100, 1) as usage_percentage
    FROM tenant.organizations o
    LEFT JOIN audit.audits a ON o.id = a.organization_id
    LEFT JOIN audit.files f ON a.id = f.audit_id
    WHERE o.id = p_organization_id
    GROUP BY o.id, o.storage_quota_gb;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- STORAGE BUCKETS - Supabase Storage configuration
-- =====================================================

-- Audit files bucket with organization isolation
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audit-files',
    'audit-files',
    false,
    104857600, -- 100MB default, override per organization
    ARRAY[
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/zip',
        'application/x-gzip'
    ]
) ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Reports bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audit-reports',
    'audit-reports',
    false,
    209715200, -- 200MB for large reports
    ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
) ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies with organization isolation
CREATE POLICY "Organization members can upload files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'audit-files' AND
        (storage.foldername(name))[1] = get_user_organization_id()::text
    );

CREATE POLICY "Organization members can view files" ON storage.objects
    FOR SELECT USING (
        bucket_id IN ('audit-files', 'audit-reports') AND
        (storage.foldername(name))[1] = get_user_organization_id()::text
    );

CREATE POLICY "Organization members can delete files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'audit-files' AND
        (storage.foldername(name))[1] = get_user_organization_id()::text AND
        EXISTS (
            SELECT 1 FROM tenant.organization_members
            WHERE organization_id = get_user_organization_id()
            AND clerk_id = auth.uid()::text
            AND role IN ('owner', 'admin')
        )
    );

-- =====================================================
-- SCHEDULED JOBS - Maintenance tasks
-- =====================================================

-- Archive old data
CREATE OR REPLACE FUNCTION maintenance.archive_old_audits()
RETURNS void AS $$
BEGIN
    -- Archive audits older than 2 years
    UPDATE audit.audits
    SET status = 'archived', archived_at = CURRENT_TIMESTAMP
    WHERE created_at < CURRENT_DATE - INTERVAL '2 years'
    AND status = 'completed'
    AND archived_at IS NULL;
    
    -- Clean up old cache entries
    DELETE FROM cache.analysis_results
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Clean up old activity logs (keep 1 year)
    DELETE FROM logs.activity_log
    WHERE created_at < CURRENT_DATE - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Refresh materialized views
CREATE OR REPLACE FUNCTION maintenance.refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.organization_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.top_performers;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MIGRATION HELPERS
-- =====================================================

-- Function to migrate from old schema
CREATE OR REPLACE FUNCTION migrate_from_v1_schema()
RETURNS void AS $$
BEGIN
    -- This function would contain migration logic from the old schema
    -- Placeholder for actual migration implementation
    RAISE NOTICE 'Migration from v1 schema would be implemented here';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DOCUMENTATION
-- =====================================================

COMMENT ON SCHEMA tenant IS 'Multi-tenant organization and user management';
COMMENT ON SCHEMA audit IS 'Core audit functionality and file management';
COMMENT ON SCHEMA analytics IS 'Analytics, metrics, and recommendations';
COMMENT ON SCHEMA storage_meta IS 'Metadata for file storage optimization';
COMMENT ON SCHEMA cache IS 'Performance caching layer';
COMMENT ON SCHEMA logs IS 'Activity logging and monitoring';

COMMENT ON TABLE tenant.organizations IS 'Multi-tenant organizations (agencies/companies)';
COMMENT ON TABLE audit.audits IS 'Amazon advertising audits with partitioning for scale';
COMMENT ON TABLE analytics.metrics IS 'Denormalized metrics for fast querying';
COMMENT ON TABLE analytics.recommendations IS 'AI-generated recommendations with tracking';

COMMIT;

COMMIT;
