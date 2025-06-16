# Clerk JWT Template Configuration for Supabase RLS

## Overview

This document provides detailed instructions for configuring Clerk JWT templates to work with Supabase Row Level Security (RLS). This is a **CRITICAL** configuration that must be completed for the application to function properly.

## The Problem

Without proper JWT template configuration:
- Users can authenticate but cannot access their data
- File uploads fail with "permission denied" errors
- RLS policies cannot identify the authenticated user
- The application appears broken despite successful login

## Step-by-Step Configuration

### 1. Create JWT Template in Clerk

1. Log in to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **JWT Templates** in the left sidebar
3. Click **"New template"**
4. Configure as follows:

**Template Name**: `supabase`

**Claims Configuration**:
```json
{
  "aud": "authenticated",
  "role": "authenticated",
  "email": "{{user.primary_email_address}}",
  "sub": "{{user.id}}",
  "user_metadata": {
    "clerk_id": "{{user.id}}"
  },
  "iat": "{{issued_at}}",
  "exp": "{{expires_at}}"
}
```

**Important**: The `sub` claim MUST match what your RLS policies expect. If your policies use `user_id`, you may need to adjust them or add an additional claim.

### 2. Get JWKS Endpoint URL

After creating the template:
1. Stay on the JWT template page
2. Find the **JWKS Endpoint** URL (format: `https://api.clerk.com/v1/jwks/YOUR_INSTANCE_ID`)
3. Copy this URL - you'll need it for Supabase

### 3. Configure Supabase to Accept Clerk JWTs

1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **Auth**
4. Find the **JWT Configuration** section
5. Configure as follows:

**JWT Secret**: Leave empty (using JWKS instead)
**JWKS URL**: Paste the URL from Clerk (step 2)

6. Save the configuration

### 4. Update Supabase Client Configuration

In your frontend code, ensure the Supabase client uses the JWT token:

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@clerk/nextjs'

export function createClient() {
  const { getToken } = useAuth()
  
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          const clerkToken = await getToken({ template: 'supabase' })
          
          const headers = new Headers(options.headers)
          headers.set('Authorization', `Bearer ${clerkToken}`)
          
          return fetch(url, {
            ...options,
            headers,
          })
        },
      },
    }
  )
}
```

### 5. Verify RLS Policies

Ensure your RLS policies use the correct field from the JWT:

```sql
-- Check current policies
SELECT schemaname, tablename, policyname, definition 
FROM pg_policies 
WHERE schemaname = 'public';

-- Example policy using Clerk user ID from JWT
CREATE POLICY "Users can view own audits" ON public.audits
  FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id);

-- If your policies use a different field, update them:
ALTER POLICY "Users can view own audits" ON public.audits
  USING (auth.jwt() ->> 'sub' = user_id);
```

## Testing the Configuration

### 1. Test JWT Claims

In Supabase SQL Editor, run:
```sql
-- This will show the current JWT claims
SELECT auth.jwt();

-- This will show the user ID from the JWT
SELECT auth.jwt() ->> 'sub' as user_id;
```

### 2. Test Data Access

Try a simple query with RLS:
```sql
-- This should return data if JWT is working
SELECT * FROM audits WHERE user_id = auth.jwt() ->> 'sub';
```

### 3. Test File Upload

1. Log in to the application
2. Navigate to create a new audit
3. Try uploading a CSV file
4. If successful, the JWT configuration is correct

## Common Issues and Solutions

### Issue 1: "permission denied for table"
**Cause**: JWT not being passed or RLS policies using wrong field
**Solution**: 
- Verify JWT template exists in Clerk
- Check Supabase client is using the template
- Ensure RLS policies use `auth.jwt() ->> 'sub'`

### Issue 2: "invalid JWT"
**Cause**: Supabase not configured to accept Clerk JWTs
**Solution**: 
- Verify JWKS URL is correctly set in Supabase
- Check that the JWT template name matches in client code

### Issue 3: User ID mismatch
**Cause**: RLS policies expect different user ID format
**Solution**: 
- Check what field your RLS policies use
- Update either the JWT template or the RLS policies to match

## Production Checklist

Before going to production, ensure:

- [ ] JWT template created in Clerk with correct claims
- [ ] JWKS URL configured in Supabase
- [ ] All Supabase clients use the JWT template
- [ ] RLS policies use correct user ID field
- [ ] File upload tested and working
- [ ] Data access verified for authenticated users
- [ ] Error handling implemented for auth failures

## Additional Resources

- [Clerk JWT Templates Documentation](https://clerk.com/docs/backend-requests/making/jwt-templates)
- [Supabase Auth with External Providers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)

---

**Critical**: This configuration is required for the application to function. Without it, users will be able to log in but won't be able to access any data or upload files.

Last Updated: January 15, 2025