-- Check existing RLS policies before running the migration
-- Run this first to see what policies currently exist

-- Check if RLS is enabled on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'audits', 'audit_files');

-- List all existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'audits', 'audit_files')
ORDER BY tablename, policyname;