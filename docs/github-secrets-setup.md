# GitHub Secrets Setup Guide

This guide walks you through setting up the required secrets for CI/CD pipelines.

## Required Secrets

### For CI Pipeline (Testing & Building)

1. **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**
   - Get from: https://dashboard.clerk.com
   - Navigate to your application → API Keys
   - Copy the "Publishable key"

2. **NEXT_PUBLIC_SUPABASE_URL**
   - Get from: https://supabase.com/dashboard
   - Navigate to your project → Settings → API
   - Copy the "Project URL"

3. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Get from: https://supabase.com/dashboard
   - Navigate to your project → Settings → API
   - Copy the "anon public" key

### For Vercel Deployment

4. **VERCEL_TOKEN**
   - Get from: https://vercel.com/account/tokens
   - Click "Create Token"
   - Name it "GitHub Actions"
   - Copy the token (you won't see it again!)

5. **VERCEL_ORG_ID**
   - Get from: https://vercel.com/account
   - Copy your team/personal account ID
   - Or run: `vercel whoami` locally

6. **VERCEL_PROJECT_ID**
   - First deploy to Vercel: `vercel` in the frontend directory
   - Get from: `.vercel/project.json` after first deploy
   - Or from Vercel dashboard → Project Settings

### Additional Secrets (For Production)

7. **CLERK_SECRET_KEY**
   - Get from: https://dashboard.clerk.com
   - Navigate to your application → API Keys
   - Copy the "Secret key" (keep this secure!)

## How to Add Secrets to GitHub

1. Go to your GitHub repository
2. Click on "Settings" tab
3. Navigate to "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Add each secret with the exact name listed above
6. Paste the corresponding value
7. Click "Add secret"

## Verifying Secrets

After adding all secrets, you can verify they're working by:

1. Making a small change to the frontend
2. Creating a pull request
3. Checking that all CI jobs pass
4. Checking that preview deployment works

## Security Notes

- Never commit these values to your repository
- Rotate tokens periodically
- Use different values for development/staging/production
- Limit token scopes where possible

## Troubleshooting

If CI/CD fails:
- Check the workflow logs for specific error messages
- Verify all secret names match exactly (case-sensitive)
- Ensure tokens haven't expired
- Check that all required secrets are present