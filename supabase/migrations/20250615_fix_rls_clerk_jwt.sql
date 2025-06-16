-- Fix RLS policies to work with Clerk authentication
-- Uses the JWT 'sub' claim which contains the Clerk user ID

-- Drop existing policies
DROP POLICY IF EXISTS users_policy ON users;
DROP POLICY IF EXISTS audits_policy ON audits;
DROP POLICY IF EXISTS audit_files_policy ON audit_files;

-- Users can only see their own data
-- The JWT 'sub' claim contains the Clerk user ID
CREATE POLICY users_policy ON users
    FOR ALL
    USING ((auth.jwt()->>'sub') = clerk_id);

-- Users can only access their own audits
CREATE POLICY audits_policy ON audits
    FOR ALL
    USING (user_id IN (
        SELECT id FROM users WHERE clerk_id = (auth.jwt()->>'sub')
    ));

-- Users can only access files from their own audits
CREATE POLICY audit_files_policy ON audit_files
    FOR ALL
    USING (audit_id IN (
        SELECT a.id FROM audits a
        JOIN users u ON a.user_id = u.id
        WHERE u.clerk_id = (auth.jwt()->>'sub')
    ));

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_files ENABLE ROW LEVEL SECURITY;