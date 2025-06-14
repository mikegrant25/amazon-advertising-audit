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