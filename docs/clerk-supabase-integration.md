# Clerk + Supabase Integration Guide

## Overview

This application uses Clerk for authentication and Supabase for the database. Since Supabase's Row Level Security (RLS) is designed to work with Supabase Auth (using `auth.uid()`), we need a different approach when using Clerk.

## The Problem

- Clerk handles all authentication outside of Supabase
- Supabase RLS policies expect `auth.uid()` which comes from Supabase Auth
- Using the anon key from client-side code with RLS enabled causes "row violates row-level security policy" errors

## The Solution

We've implemented a secure pattern that:

1. **Disables RLS** on all tables
2. **Uses the service role key** in server-side API routes only
3. **Manually filters data** by user in API routes after Clerk authentication
4. **Never exposes the service role key** to the client

### Security Model

```
Client Request → API Route → Clerk Auth → Service Role Query (with user filter) → Response
```

## Implementation Details

### 1. Environment Variables

```env
# Public (safe for client)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Secret (server only)
SUPABASE_SERVICE_KEY=eyJhbGc...
CLERK_SECRET_KEY=sk_live_...
```

### 2. Supabase Clients

#### Admin Client (server-only)
```typescript
// lib/supabase/admin.ts
export function createAdminClient() {
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}
```

#### Authenticated Client (server-only)
```typescript
// lib/supabase/server-with-clerk.ts
export async function createAuthenticatedClient() {
  const { userId } = await auth() // Clerk auth
  const supabase = createAdminClient()
  const user = await getUserByClerkId(userId)
  return { supabase, user }
}
```

### 3. API Routes Pattern

All database operations go through API routes:

```typescript
// app/api/audits/route.ts
export async function GET() {
  const { supabase, user } = await createAuthenticatedClient()
  
  // Manually filter by user
  const { data } = await supabase
    .from('audits')
    .select('*')
    .eq('user_id', user.id) // ← Manual user filtering
    
  return NextResponse.json({ data })
}
```

### 4. Client Components

Client components use fetch to call API routes instead of direct DB access:

```typescript
// Before (causes RLS errors)
const supabase = createClient()
await supabase.from('audits').insert({...})

// After (secure)
await fetch('/api/audits', {
  method: 'POST',
  body: JSON.stringify({...})
})
```

## Migration Steps

1. **Run the RLS fix migration** to disable RLS:
   ```bash
   node scripts/apply-clerk-rls-fix.js
   ```
   Or manually run `supabase/migrations/20250615_fix_rls_for_clerk.sql` in your Supabase dashboard

2. **Update all API routes** to use `createAuthenticatedClient()`

3. **Update client components** to use API routes instead of direct DB access

4. **Ensure webhook is configured** to sync Clerk users to Supabase

## User Sync

The Clerk webhook (`/api/webhooks/clerk`) syncs users to Supabase:

- On `user.created` → Creates user in Supabase with `clerk_id`
- On `user.updated` → Updates user info
- On `user.deleted` → Removes user from Supabase

## Security Considerations

1. **Service role key is never exposed to clients**
2. **All DB access goes through authenticated API routes**
3. **User filtering is enforced at the application level**
4. **Clerk handles all authentication and session management**

## Future Improvements

When Supabase adds better support for external auth providers:

1. Configure Clerk to add custom claims to JWTs
2. Configure Supabase to extract these claims
3. Re-enable RLS with policies that use the custom claims
4. Remove manual user filtering from API routes

## Troubleshooting

### "Row violates row-level security policy" errors
- Ensure the migration has been run to disable RLS
- Check that API routes use `createAuthenticatedClient()` not `createClient()`
- Verify the service role key is set in environment variables

### "User not found in database" errors
- Check that the Clerk webhook is configured and working
- Verify the webhook secret is correct
- Check Supabase logs for webhook sync errors

### Client-side database errors
- Ensure all client components use API routes
- Remove any direct `supabase.from()` calls from client code
- Check browser console for detailed error messages