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