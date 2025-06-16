# Authentication Setup Guide

This guide walks through setting up Clerk authentication for the Amazon Advertising Audit Tool.

## Prerequisites

- Clerk account (create at [clerk.com](https://clerk.com))
- Supabase project already configured (see supabase-setup.md)

## 1. Create Clerk Application

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Click "Create application"
3. Configure:
   - **Application name**: Amazon Advertising Audit
   - **Sign-in options**: Email address, Google, Microsoft (optional)
   - **Application type**: B2B SaaS

## 2. Get API Keys

After creating the application, go to API Keys:

```bash
# Add to frontend/.env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## 3. Configure Webhooks

### Create Webhook Endpoint

1. In Clerk Dashboard, go to Webhooks
2. Click "Add Endpoint"
3. Configure:
   - **Endpoint URL**: `https://your-domain.com/api/webhooks/clerk`
   - **Events to listen for**:
     - user.created
     - user.updated
     - user.deleted

### Get Webhook Secret

After creating the webhook:
1. Click on the webhook endpoint
2. Copy the Signing Secret
3. Add to `.env.local`:

```bash
CLERK_WEBHOOK_SECRET=whsec_...
```

## 4. Configure Clerk JWT Template for Supabase (CRITICAL)

This step is essential for Supabase RLS to work properly:

1. **Go to Clerk Dashboard → JWT Templates**
2. **Click "Create Template"**
3. **Name**: `supabase`
4. **Configure the template**:

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

5. **Save the template**
6. **Get the JWKS URL**: Copy from the JWT template page
7. **Configure Supabase to accept Clerk JWTs**:
   - Go to Supabase Dashboard → Settings → Auth
   - Add the JWKS URL from Clerk
   - Save changes

## 5. Configure Authentication URLs

The following URLs are already configured in the codebase:

- **Sign In**: `/sign-in`
- **Sign Up**: `/sign-up`
- **After Sign In**: `/dashboard`
- **After Sign Up**: `/dashboard`

## 6. Test Authentication Flow

1. Start the development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Visit http://localhost:3000
3. Click "Sign Up" to create an account
4. Verify email (check Clerk dashboard for test emails)
5. You should be redirected to `/dashboard`

## 7. Verify User Sync

After signing up:

1. Check Supabase Dashboard → Table Editor → users
2. You should see a new user with:
   - `clerk_id`: Matching your Clerk user ID
   - `email`: Your sign-up email
   - `full_name`: If provided during sign-up

## 8. Protected Routes

The following routes are automatically protected:

- `/dashboard/*` - All dashboard pages
- `/audits/*` - Audit management pages
- `/settings/*` - User settings
- `/api/audits/*` - Audit API endpoints
- `/api/files/*` - File upload endpoints
- `/api/user/*` - User API endpoints

## 9. Using Authentication in Components

### Client Components

```typescript
import { useAuth } from '@clerk/nextjs'
import { useCurrentUser } from '@/lib/hooks/use-current-user'

function MyComponent() {
  // Clerk auth state
  const { isSignedIn, userId } = useAuth()
  
  // Supabase user data
  const { user, isLoading } = useCurrentUser()
  
  if (!isSignedIn) return <div>Please sign in</div>
  if (isLoading) return <div>Loading...</div>
  
  return <div>Welcome {user?.email}!</div>
}
```

### Server Components

```typescript
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

async function MyServerComponent() {
  const { userId } = await auth()
  
  if (!userId) {
    // Handle unauthenticated state
    return null
  }
  
  const supabase = await createClient()
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', userId)
    .single()
  
  return <div>Welcome {user?.email}!</div>
}
```

## 10. Customizing Clerk Components

The sign-in and sign-up pages use Clerk's pre-built components with custom styling:

```typescript
<SignIn 
  appearance={{
    elements: {
      rootBox: "mx-auto",
      card: "shadow-xl"
    }
  }}
/>
```

For more customization options, see [Clerk's appearance documentation](https://clerk.com/docs/components/customization/overview).

## 11. Production Deployment

Before deploying to production:

1. **Update Webhook URL**: Change from localhost to your production domain
2. **Environment Variables**: Add all Clerk variables to Vercel
3. **Domain Configuration**: Add your domain to Clerk's allowed origins
4. **Rate Limits**: Configure appropriate rate limits in Clerk dashboard

## Security Considerations

1. **Webhook Verification**: Always verify webhook signatures (already implemented)
2. **CORS**: Clerk handles CORS automatically for configured domains
3. **Session Duration**: Configure in Clerk dashboard (default: 7 days)
4. **Multi-factor Authentication**: Enable in Clerk dashboard for enhanced security

## Troubleshooting

### Common Issues

1. **"Clerk: auth() was called but Clerk can't detect usage of clerkMiddleware()"**
   - Ensure middleware.ts is in the src directory
   - Check that the middleware matcher is configured correctly

2. **User not syncing to Supabase**
   - Verify webhook endpoint is accessible
   - Check webhook secret is correct
   - Look for errors in Vercel/server logs

3. **Redirect loops**
   - Check that public routes aren't in the protected route matcher
   - Verify after-sign-in URLs are correct

4. **RLS Permission Errors (CRITICAL)**
   - **Most common issue in production**
   - Ensure JWT template is configured in Clerk
   - Verify the `sub` claim in JWT matches RLS policies
   - Check that Supabase is configured to accept Clerk JWTs
   - Test with Supabase client that properly passes the JWT token

5. **File Upload Fails with "permission denied"**
   - This is typically due to missing/incorrect JWT template
   - Follow JWT template setup in Section 4 carefully
   - Ensure storage bucket policies use the same user ID field as table policies

### Debug Mode

Enable Clerk debug logging:

```typescript
// In development only
if (process.env.NODE_ENV === 'development') {
  window.Clerk.debug = true
}
```

## Next Steps

With authentication configured, you can proceed to:
- US-001-006: File Upload Infrastructure
- Implement role-based access control
- Add team/organization support

---

Last Updated: January 11, 2025