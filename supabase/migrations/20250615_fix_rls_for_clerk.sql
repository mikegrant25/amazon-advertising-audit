-- Fix RLS policies to work with Clerk authentication
-- Since Clerk handles authentication externally, we disable RLS and rely on application-level security

-- Drop all existing RLS policies
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Disable RLS on all tables
DO $$
DECLARE
    tbl record;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('users', 'audits', 'audit_files', 'pilot_feedback', 'pilot_analytics', 'recommendations', 'performance_metrics')
    LOOP
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tbl.tablename);
    END LOOP;
END $$;

-- Add comments explaining the security model
COMMENT ON TABLE users IS 'User accounts synchronized with Clerk authentication. RLS disabled - security enforced at application level via Clerk auth + service role queries';
COMMENT ON TABLE audits IS 'Amazon advertising audit records. RLS disabled - access control via API routes with Clerk auth';
COMMENT ON TABLE audit_files IS 'Uploaded files for audits. RLS disabled - access control via API routes with Clerk auth';
COMMENT ON TABLE pilot_feedback IS 'User feedback during pilot. RLS disabled - access control via API routes with Clerk auth';
COMMENT ON TABLE pilot_analytics IS 'Analytics events. RLS disabled - access control via API routes with Clerk auth';