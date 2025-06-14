# Supabase Setup Guide

This guide walks through setting up Supabase for the Amazon Advertising Audit Tool.

## Prerequisites

- Supabase account (create at [supabase.com](https://supabase.com))
- Supabase CLI installed (optional, for type generation)

## 1. Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Configure:
   - **Name**: Amazon Advertising Audit
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Plan**: Free tier for development

## 2. Get API Keys

After project creation, go to Settings → API:

```bash
# Add to frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Add to backend/.env
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_SERVICE_KEY=eyJ... (from service_role key)
```

## 3. Run Database Migrations

### Option A: Via Supabase Dashboard

1. Go to SQL Editor in Supabase Dashboard
2. Create new query
3. Copy contents of:
   - `supabase/migrations/20250111_initial_schema.sql`
   - `supabase/migrations/20250111_storage_buckets.sql`
4. Run each migration in order

### Option B: Via Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref [PROJECT_REF]

# Run migrations
supabase db push
```

## 4. Configure Authentication

Since we're using Clerk for authentication, we need to configure Supabase to accept Clerk JWTs:

1. Go to Authentication → Providers in Supabase Dashboard
2. Disable Email provider (we'll use Clerk)
3. Configure JWT:
   - Go to Settings → API
   - Under "JWT Settings", add Clerk's public key

## 5. Verify Setup

### Check Tables

Go to Table Editor and verify these tables exist:
- `users`
- `audits`
- `audit_files`

### Check Storage

Go to Storage and verify these buckets exist:
- `audit-files`
- `audit-reports`

### Test RLS Policies

1. Go to SQL Editor
2. Run test queries with RLS enabled:

```sql
-- This should return no rows (RLS working)
SELECT * FROM users;

-- Check if policies are enabled
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

## 6. Type Generation

Generate TypeScript types from your database schema:

```bash
cd frontend

# Set environment variable
export SUPABASE_PROJECT_ID=[PROJECT_REF]

# Generate types
npm run supabase:types
```

This creates/updates `src/types/database.types.ts`

## 7. Integration Points

### Frontend Client

The Supabase client is configured in:
- `src/lib/supabase/client.ts` - Browser client
- `src/lib/supabase/server.ts` - Server Components
- `src/lib/supabase/middleware.ts` - Middleware

### Usage Example

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Fetch user's audits
const { data, error } = await supabase
  .from('audits')
  .select('*')
  .order('created_at', { ascending: false })
```

## 8. Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled with policies that:
- Users can only see their own data
- Data access is tied to Clerk authentication
- Service role has full access (for backend processing)

### Storage Security

Storage buckets are configured with:
- Private access (no public URLs)
- RLS policies matching table access
- File type restrictions
- Size limits (50MB for uploads, 100MB for reports)

## 9. Monitoring

### Database Metrics

Monitor via Supabase Dashboard:
- Database size
- Connection pool usage
- Query performance
- Storage usage

### Logs

Check logs for:
- Failed queries
- RLS policy violations
- Storage access attempts

## 10. Troubleshooting

### Common Issues

1. **"permission denied for table"**
   - Check RLS policies
   - Ensure auth token is passed correctly
   - Verify Clerk integration

2. **"JWT expired"**
   - Refresh Clerk session
   - Check token expiration settings

3. **Storage upload fails**
   - Check file size limits
   - Verify MIME type is allowed
   - Ensure bucket policies are correct

### Debug Mode

Enable debug logging:

```typescript
const supabase = createClient({
  auth: {
    debug: true
  }
})
```

## Next Steps

With Supabase configured, you can proceed to:
- US-001-005: Basic Authentication (Clerk integration)
- US-001-006: File Upload Infrastructure

---

Last Updated: January 11, 2025