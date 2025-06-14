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