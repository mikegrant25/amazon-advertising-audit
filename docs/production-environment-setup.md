# Production Environment Setup Guide

## Overview
This guide provides step-by-step instructions for setting up the production environment for the Amazon Advertising Audit Tool.

## Prerequisites
- Admin access to Vercel account
- Admin access to Supabase account
- Admin access to Clerk account
- Domain name (if custom domain desired)
- GitHub repository access

## 1. Vercel Production Setup

### Step 1: Create Production Project
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from GitHub: `mikegrant25/amazon-advertising-audit`
4. Select the `frontend` directory as root
5. Framework Preset: Next.js
6. Build Settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm ci`

### Step 2: Environment Variables
Add the following environment variables in Vercel dashboard:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_KEY=your_production_service_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_production_publishable_key
CLERK_SECRET_KEY=your_production_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### Step 3: Domain Configuration
1. Go to Project Settings > Domains
2. Add custom domain (optional)
3. Configure DNS records as instructed
4. Enable automatic HTTPS

### Step 4: Production Branch
1. Set production branch to `main`
2. Enable automatic deployments
3. Configure preview deployments for PRs

## 2. Supabase Production Setup

### Step 1: Create Production Project
1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Name: `amazon-audit-prod`
4. Database Password: Generate strong password (save securely)
5. Region: Choose closest to target users
6. Pricing Plan: Pro ($25/month recommended)

### Step 2: Database Setup
Run migrations in SQL editor:

```sql
-- Run all migrations from frontend/supabase/migrations/
-- 001_initial_schema.sql
-- 002_add_recommendations.sql
-- 003_add_pilot_tracking.sql
```

### Step 3: Storage Buckets
1. Go to Storage
2. Create bucket: `audit-files`
   - Public: No
   - File size limit: 500MB
   - Allowed MIME types: text/csv

### Step 4: Row Level Security
Enable RLS on all tables:

```sql
-- Users can only see their own data
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies (see full RLS setup in migrations)
```

### Step 5: API Settings
1. Go to Settings > API
2. Copy URL and anon key for Vercel
3. Enable Rate Limiting:
   - 100 requests per minute per IP
   - 1000 requests per hour per user

## 3. Clerk Production Setup

### Step 1: Create Production Instance
1. Go to [clerk.com](https://clerk.com)
2. Create new application
3. Name: `Amazon Audit Tool`
4. Sign-in methods:
   - Email/Password ✓
   - Google OAuth ✓ (optional)
   - Email verification required ✓

### Step 2: Configure Settings
1. **User & Authentication**:
   - Enable email verification
   - Set password requirements (8+ chars, 1 number)
   - Enable multi-factor authentication

2. **Sessions**:
   - Session lifetime: 7 days
   - Inactivity timeout: 30 minutes

3. **Webhooks**:
   - Add endpoint: `https://your-domain.com/api/webhooks/clerk`
   - Events: user.created, user.updated

### Step 3: Production Keys
1. Go to API Keys
2. Copy production keys for Vercel
3. Add allowed origins:
   - `https://your-domain.com`
   - `https://*.vercel.app` (for previews)

### Step 4: Customization
1. **Appearance**:
   - Upload logo
   - Match brand colors
   - Customize email templates

2. **User Profile**:
   - Add custom fields: company_name
   - Make company_name required

## 4. Monitoring Setup

### Step 1: Vercel Analytics
1. Go to Project > Analytics
2. Enable Web Vitals
3. Enable Audiences (if on Pro plan)

### Step 2: Sentry Error Tracking
```bash
# Install Sentry
cd frontend
npm install --save @sentry/nextjs

# Run setup wizard
npx @sentry/wizard@latest -i nextjs
```

Add to environment variables:
```bash
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
SENTRY_AUTH_TOKEN=your_auth_token
```

### Step 3: Uptime Monitoring
1. Set up BetterUptime or UptimeRobot
2. Monitor endpoints:
   - `https://your-domain.com` (200 OK)
   - `https://your-domain.com/api/health` (200 OK)
3. Alert channels: Email, Slack

## 5. Security Hardening

### Step 1: API Rate Limiting
Add to `middleware.ts`:

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})
```

### Step 2: Security Headers
Add to `next.config.js`:

```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]
```

### Step 3: Content Security Policy
Configure CSP for production security.

## 6. Deployment Process

### Initial Deployment
```bash
# 1. Ensure all environment variables are set in Vercel
# 2. Push to main branch
git push origin main

# 3. Monitor deployment in Vercel dashboard
# 4. Run smoke tests once deployed
```

### Deployment Verification
1. **Basic Functionality**:
   - [ ] Homepage loads
   - [ ] Sign up works
   - [ ] Sign in works
   - [ ] Dashboard accessible
   - [ ] File upload works

2. **Integration Tests**:
   - [ ] Supabase connection
   - [ ] Clerk authentication
   - [ ] File storage
   - [ ] PDF generation

3. **Performance Checks**:
   - [ ] Page load < 3s
   - [ ] No console errors
   - [ ] Analytics tracking

## 7. Rollback Plan

If issues arise:

1. **Immediate Rollback**:
   - Vercel: Instant rollback to previous deployment
   - Database: Restore from automatic backups

2. **Rollback Triggers**:
   - Error rate > 5%
   - Authentication failures
   - Database connection issues
   - Performance degradation

3. **Rollback Process**:
   ```bash
   # In Vercel dashboard
   1. Go to Deployments
   2. Find last working deployment
   3. Click "..." menu
   4. Select "Promote to Production"
   ```

## 8. Post-Deployment

### Monitoring Checklist
- [ ] Check Vercel Analytics
- [ ] Monitor Sentry for errors
- [ ] Verify uptime monitoring
- [ ] Check Supabase metrics
- [ ] Monitor Clerk dashboard

### Performance Baseline
Record initial metrics:
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- Time to First Byte (TTFB)

### Support Readiness
- [ ] Support email configured
- [ ] FAQ published
- [ ] Team trained on tools
- [ ] Escalation process defined

## Environment URLs

### Production
- App: `https://your-domain.com`
- API: `https://your-domain.com/api`
- Supabase: `https://your-project.supabase.co`

### Staging (Vercel Preview)
- App: `https://amazon-audit-*.vercel.app`
- Uses production services with preview data

## Cost Summary

### Monthly Costs (Production)
- Vercel Pro: $20/user
- Supabase Pro: $25
- Clerk Pro: $25 + $0.02/MAU
- Sentry Team: $26
- Uptime Monitoring: $7
- **Total**: ~$103 + usage

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check environment variables
   - Verify Node version (18.x or 20.x)
   - Clear cache and rebuild

2. **Database Connection**:
   - Verify Supabase URL
   - Check service key
   - Confirm RLS policies

3. **Authentication Issues**:
   - Verify Clerk keys
   - Check allowed origins
   - Confirm webhook endpoint

## Support Contacts

- **Vercel Support**: support.vercel.com
- **Supabase Support**: support.supabase.com
- **Clerk Support**: support.clerk.com
- **Internal**: [Your contact info]

---

**Created**: January 14, 2025  
**Status**: Ready for execution  
**Owner**: DevOps Team