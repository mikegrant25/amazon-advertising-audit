# Production Database Migration Guide

This guide provides multiple methods to run migrations on your production Supabase database.

## Method 1: Supabase Dashboard (Recommended for First-Time Setup)

This is the simplest method if you're running migrations for the first time.

### Steps:

1. **Login to Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your production project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Combined Migration**
   - Copy the entire contents of `/supabase/migrations/all_migrations_combined.sql`
   - Paste into the SQL editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

4. **Verify Success**
   - Check for any error messages
   - Go to "Table Editor" to confirm all tables were created
   - Go to "Storage" to confirm buckets were created

## Method 2: Supabase CLI (For Automated Deployments)

Use this method if you have the database connection string.

### Prerequisites:
```bash
# Install Supabase CLI if not already installed
brew install supabase/tap/supabase
```

### Steps:

1. **Get your database URL**
   - Go to Supabase Dashboard → Settings → Database
   - Copy the "Connection string" (URI format)
   - It looks like: `postgresql://postgres:[password]@[host]:[port]/postgres`

2. **Set environment variable**
   ```bash
   export SUPABASE_DB_URL="your-connection-string-here"
   ```

3. **Run the migration script**
   ```bash
   cd "/Volumes/4TB External SSD/Amazon Advertising Audit"
   ./scripts/run-migrations-cli.sh
   ```

## Method 3: Node.js Script (For CI/CD Integration)

Use this method if you want to integrate migrations into your deployment pipeline.

### Prerequisites:
- Production Supabase URL and Service Key

### Steps:

1. **Set environment variables**
   ```bash
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_SERVICE_KEY="your-service-key"
   ```

2. **Run the Node.js migration script**
   ```bash
   cd "/Volumes/4TB External SSD/Amazon Advertising Audit/frontend"
   node ../scripts/run-production-migrations.js
   ```

## Migration Order

The migrations will be run in this specific order:

1. `20250111_initial_schema.sql` - Creates core tables (users, audits, audit_files)
2. `20250111_storage_buckets.sql` - Sets up file storage buckets
3. `20250114_add_parsed_data_to_audit_files.sql` - Adds JSONB column for parsed data
4. `20250114_analysis_results.sql` - Creates analysis results table
5. `20250114_csv_processing.sql` - Creates CSV processing jobs table
6. `20250114_performance_metrics.sql` - Creates performance metrics table
7. `20250114_recommendations.sql` - Creates recommendations table
8. `004_pilot_tracking.sql` - Creates pilot user tracking tables

## Post-Migration Verification

After running migrations, verify the following:

### 1. Check Tables
In Supabase Dashboard → Table Editor, confirm these tables exist:
- `users`
- `audits`
- `audit_files`
- `analysis_results`
- `csv_processing_jobs`
- `performance_metrics`
- `recommendations`
- `pilot_users`
- `pilot_activity_log`

### 2. Check Storage Buckets
In Supabase Dashboard → Storage, confirm these buckets exist:
- `audit-files` (50MB limit, CSV/Excel files only)
- `audit-reports` (100MB limit, PDF files only)

### 3. Check RLS Policies
In SQL Editor, run:
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

You should see multiple policies for each table.

### 4. Test RLS
```sql
-- This should return 0 rows (RLS is working)
SELECT COUNT(*) FROM users;
```

## Troubleshooting

### Common Issues:

1. **"permission denied" errors**
   - Make sure you're using the service role key, not the anon key
   - Check that your database URL includes the correct password

2. **"already exists" errors**
   - This is normal if some objects were already created
   - The scripts handle this gracefully

3. **Storage bucket errors**
   - Storage policies might need to be created after buckets
   - You can create buckets manually in the Storage section

4. **Connection refused**
   - Check that your IP is allowed in Supabase → Settings → Database → Connection Pooling
   - Ensure you're using the correct port (usually 5432 or 6543 for pooled connections)

## Security Notes

- Never commit database URLs or service keys to version control
- Use environment variables or secure secret management
- Rotate service keys regularly
- Limit service key usage to deployment processes only

## Next Steps

After successful migration:

1. Update your production environment variables in Vercel/your hosting platform
2. Test authentication flow with Clerk
3. Verify file upload functionality
4. Run a test audit to ensure end-to-end functionality