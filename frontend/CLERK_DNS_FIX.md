# Clerk DNS Configuration Fix

## Problem
The application is trying to load Clerk from `https://clerk.audit.verexiq.com` which results in `ERR_NAME_NOT_RESOLVED`. This happens because the Clerk publishable key contains a custom domain configuration that doesn't have proper DNS records.

## Root Cause
The production publishable key `pk_live_Y2xlcmsuYXVkaXQudmVyZXhpcS5jb20k` contains the base64-encoded domain `clerk.audit.verexiq.com` but DNS is not configured for this subdomain.

## Solutions

### Option 1: Use Standard Clerk Domain (Recommended for Quick Fix)

1. **Get a new publishable key from Clerk:**
   - Go to https://dashboard.clerk.com
   - Select your application
   - Navigate to **API Keys**
   - Make sure "Use Custom Domain" is NOT enabled
   - Copy the publishable key (should look like `pk_live_xxxxx` without domain encoding)

2. **Update the production environment:**
   - Replace the publishable key in `.env.production`
   - The key should be: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_YOUR_NEW_KEY"`

3. **Deploy the changes:**
   - Commit and push the updated `.env.production`
   - Redeploy on Vercel

### Option 2: Configure DNS for Custom Domain

If you want to use the custom domain `clerk.audit.verexiq.com`:

1. **In your DNS provider (where verexiq.com is managed):**
   - Add a CNAME record:
     - Name: `clerk`
     - Value: `frontend-api.clerk.services`
   - Wait for DNS propagation (5-30 minutes)

2. **In Clerk Dashboard:**
   - Go to **Customization** → **Domains**
   - Add `clerk.audit.verexiq.com` as a custom domain
   - Follow the verification steps
   - Ensure the domain is verified and active

3. **Keep the existing publishable key:**
   - The current key `pk_live_Y2xlcmsuYXVkaXQudmVyZXhpcS5jb20k` will work once DNS is configured

## Current Status

The `.env.production` file has been updated with:
- Placeholder for new publishable key
- Added missing Clerk URL configurations:
  - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
  - `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
  - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard`
  - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard`

## Next Steps

1. Choose either Option 1 or Option 2 above
2. Update the publishable key or configure DNS
3. Test the authentication flow
4. Monitor for any other authentication issues

## Verification

After making changes, verify that:
- The browser console no longer shows `ERR_NAME_NOT_RESOLVED` for clerk domain
- Users can sign in and sign up
- Authentication redirects work correctly
- Protected routes are accessible after authentication