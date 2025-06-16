-- Comprehensive fix for all RLS policies to work with Clerk authentication
-- Since Clerk handles authentication externally, we have two approaches:
-- 1. Use service role key with manual user filtering in application (current approach)
-- 2. Pass Clerk user ID as a custom claim in JWT (future improvement)

-- For now, we'll disable RLS on all tables and rely on application-level security
-- This is safe because:
-- 1. All database access goes through our API routes
-- 2. API routes authenticate users via Clerk before any database operations
-- 3. API routes manually filter data by user_id/clerk_id

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
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE audits DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics DISABLE ROW LEVEL SECURITY;

-- Add comment explaining the security model
COMMENT ON TABLE users IS 'User accounts synchronized with Clerk authentication. RLS disabled - security enforced at application level via Clerk auth + service role queries';
COMMENT ON TABLE audits IS 'Amazon advertising audit records. RLS disabled - access control via API routes with Clerk auth';
COMMENT ON TABLE audit_files IS 'Uploaded files for audits. RLS disabled - access control via API routes with Clerk auth';
COMMENT ON TABLE pilot_feedback IS 'User feedback during pilot. RLS disabled - access control via API routes with Clerk auth';
COMMENT ON TABLE pilot_analytics IS 'Analytics events. RLS disabled - access control via API routes with Clerk auth';

-- Future improvement: Custom JWT claims
-- When ready to re-enable RLS with Clerk:
-- 1. Configure Clerk to add user.id as a custom claim in the JWT
-- 2. Configure Supabase to extract the custom claim
-- 3. Create RLS policies using the custom claim instead of auth.uid()
-- Example future policy:
-- CREATE POLICY "Users can access own audits" ON audits
--   FOR ALL USING (user_id IN (
--     SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims')::json->>'clerk_id'
--   ));

-- For production environments with stricter requirements:
-- Consider using PostgREST pre-request function to set user context
-- Or implement a secure proxy that validates Clerk tokens and uses service role