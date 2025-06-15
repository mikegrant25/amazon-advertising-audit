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